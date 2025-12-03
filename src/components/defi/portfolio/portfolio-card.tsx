import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, ArrowUpDown, ChevronRight, ChevronUpCircleIcon, RefreshCcw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createChart, ColorType, CrosshairMode, LineSeries, type UTCTimestamp, type Time, type ISeriesApi } from "lightweight-charts";
import { useAppContext, type Token } from "@/contexts/AppContext"
import WalletTransaction from "./wallet-transaction"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrencyContext } from "@/contexts/CurrencyContext"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState, useCallback } from "react";
import SwapDetails from "./swap-details"
import { useTheme } from "@/contexts/ThemeContext";
import { getRealTimeWalletUpdate, getWalletBalance } from "@/lib/walletData";
import { useDebouncedValue } from "@/hooks/useDebounceValue";
import { parseUnits, formatUnits } from "ethers";

export interface Quote {
  provider: string;                     // "1inch", "LiFi", etc.

  // raw amounts from API (wei or token base units)
  sellAmount: string;                   // raw amount of sell token (wei)
  buyAmount: string;                    // raw amount of buy token (wei)

  // converted / UI-friendly
  sellAmountHuman: string;              // formatted (e.g. "0.003774")
  buyAmountHuman: string;               // formatted (e.g. "3.3241")

  // tokens
  sellToken: string;                    // token contract address (src)
  buyToken: string;                     // token contract address (dst)
  sellSymbol: string;                   // "BNB", "USDT", etc.
  buySymbol: string;

  sellDecimals: number;
  buyDecimals: number;

  // gas related
  estimatedGas: number;                 // gas units
  gasPriceWei: string;                  // price per gas unit (wei)
  gasCostWei: string;                   // total cost = estimatedGas * gasPrice
  gasCostNative: string;                // formatted in BNB
  gasCostUSD?: string;                  // optional (if you have BNB price)

  // allowance (important for ERC20)
  allowanceTarget: string;              // spender that must be approved (router)
  needsApproval: boolean;               // true if allowance < sellAmount

  // rate info
  price: number;                        // buy / sell ratio
  priceText: string;                    // "1 BNB ≈ 330 USDT"

  // aggregated net value (your custom calculation)
  netValue: string;                     // raw wei
  netValueHuman: string;                // formatted

  // transaction data to send
  tx: {
    from?: string;                      // usually user's wallet
    to: string;                         // router address
    data: string;                       // calldata
    value: string;                      // native value to send (wei)
    gas?: number;                       // gas limit
    gasPrice?: string;                  // gas price (wei)
  };

  slippagePct: string;
  slippageText: string;

  // debugging / developer
  raw?: any;                            // store raw provider quote if needed
}

export interface SwapToken {
    from: Token;
    to: Token;
}

// Helper to create empty token
const createEmptyToken = (): Token => ({
    contract_address: "",
    contract_ticker_symbol: "",
    contract_name: "",
    logo_url: "",
    decimals: 0,
    balance: 0,
    quote_rate: 0,
    quote_rate_24h: 0,
    quote: 0,
    is_spam: false,
});

// Helper to check if token is empty
const isTokenEmpty = (token: Token): boolean => {
    return !token.contract_address || token.contract_address === "";
};

const PortfolioCard = () => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const { usdtToInrRate, setRateUpdateTrigger, currency } = useCurrencyContext();
    const { walletBalance, tokens, setShowCoin, bnbToken, address } = useAppContext();
    const { theme } = useTheme();
    const [trigger, setTrigger] = useState(0);
    const [results, setResults] = useState<Quote[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<Quote | null>(null);
    const [swapToken, setSwapToken] = useState<SwapToken>({
        from: createEmptyToken(),
        to: createEmptyToken(),
    });
    const [amountToSell, setAmountToSell] = useState<string>("");
    const debouncedQuery = useDebouncedValue(amountToSell, 600);
    const [loadingQuote, setLoadingQuote] = useState(false);
    
    // Refs to track component mount state and cleanup functions
    const isMountedRef = useRef(true);
    const abortControllerRef = useRef<AbortController | null>(null);
    const walletUpdateCleanupRef = useRef<(() => void) | null>(null);

    function buildQuote(
        raw: any,
        sellDecimals: number,
        buyDecimals: number,
        sellSymbol: string,
        buySymbol: string,
        nativeDecimals: number,
        nativePriceUSD?: number,
        bestBuyAmountRaw?: bigint        // NEW: best quote in wei
        ) {
        const sellAmount = BigInt(raw.sellAmount);
        const buyAmount = BigInt(raw.buyAmount);
        const estimatedGas = Number(raw.estimatedGas);
        const gasPriceWei = raw.gasPrice;

        const gasCostWei = BigInt(estimatedGas) * BigInt(gasPriceWei);
        const gasCostNative = formatUnits(gasCostWei, nativeDecimals);
        const gasCostUSD = nativePriceUSD
            ? (Number(gasCostNative) * nativePriceUSD).toFixed(6)
            : undefined;

        const sellHuman = formatUnits(sellAmount, sellDecimals);
        const buyHuman = formatUnits(buyAmount, buyDecimals);

        const price = Number(buyHuman) / Number(sellHuman);

        let slippagePct = 0;

        if (bestBuyAmountRaw && bestBuyAmountRaw > 0n) {
            const diff = bestBuyAmountRaw - buyAmount;
            slippagePct = Number((diff * 10000n) / bestBuyAmountRaw) / 100;
        }

        return {
            provider: raw.provider,

            sellAmount: raw.sellAmount,
            buyAmount: raw.buyAmount,

            sellAmountHuman: sellHuman,
            buyAmountHuman: buyHuman,

            sellToken: raw.sellToken,
            buyToken: raw.buyToken,
            sellSymbol,
            buySymbol,

            sellDecimals,
            buyDecimals,

            estimatedGas,
            gasPriceWei: gasPriceWei.toString(),
            gasCostWei: gasCostWei.toString(),
            gasCostNative,
            gasCostUSD,

            allowanceTarget: raw.allowanceTarget,
            needsApproval: false,

            price,
            priceText: `1 ${sellSymbol} ≈ ${price.toPrecision(6)} ${buySymbol}`,

            netValue: raw.netValue,
            netValueHuman: formatUnits(BigInt(raw.netValue), buyDecimals),

            // 🔥 RETURN SLIPPAGE
            slippagePct,            // number, e.g. 0.41
            slippageText: `${slippagePct.toFixed(2)}%`,  // "0.41%"

            tx: {
            from: raw.quote?.tx?.from,
            to: raw.quote?.tx?.to,
            data: raw.quote?.tx?.data,
            value: raw.quote?.tx?.value ?? "0",
            gas: raw.quote?.tx?.gas,
            gasPrice: raw.quote?.tx?.gasPrice,
            },

            raw,
        };
    }

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            // Abort any pending fetch requests
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            // Cleanup wallet updates
            if (walletUpdateCleanupRef.current) {
                walletUpdateCleanupRef.current();
            }
        };
    }, []);

    // Fetch quotes effect
    useEffect(() => {
        // Reset if query is empty or tokens are empty
        if (!debouncedQuery.trim() || isTokenEmpty(swapToken.from) || isTokenEmpty(swapToken.to)) {
            setResults([]);
            setLoadingQuote(false);
            return;
        }

        // Validate amount
        try {
            const amount = parseFloat(debouncedQuery);
            if (isNaN(amount) || amount <= 0) {
                setResults([]);
                setLoadingQuote(false);
                return;
            }
        } catch (error) {
            console.error("Invalid amount:", error);
            setResults([]);
            setLoadingQuote(false);
            return;
        }

        // Abort previous request if exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const ac = new AbortController();
        abortControllerRef.current = ac;
        setLoadingQuote(true);

        function trimToDecimals(value: string, decimals: number) {
        // handle empty / invalid
        if (!value || value === ".") return "0";

        if (!value.includes(".")) return value; // no decimals -> safe

        const [int, frac] = value.split(".");
        if (frac.length <= decimals) return value; // already fine

        // truncate extra decimals (or implement rounding here if you want)
        const trimmedFrac = frac.slice(0, decimals);
        // Avoid trailing '.' (e.g. "1.")
        return trimmedFrac.length ? `${int}.${trimmedFrac}` : int;
        }

        const cleanedAmount = trimToDecimals(debouncedQuery, swapToken.from.decimals);

        const swapParams = {
            src: swapToken.from.contract_address,
            dst: swapToken.to.contract_address,
            amount: parseUnits(cleanedAmount, swapToken.from.decimals).toString(),
            from: address || "",
        };

        fetch(
            `${import.meta.env.VITE_BOT_BASE_URL}/api/trade/quotes?${new URLSearchParams(swapParams)}`,
            { signal: ac.signal }
        )
            .then((r) => (r.ok ? r.json() : Promise.reject(r)))
            .then((data) => {
                if (isMountedRef.current) {
                    const transformed = (data.data || []).map((rawQuote: any) =>
                    buildQuote(
                        rawQuote,
                        swapToken.from.decimals,
                        swapToken.to.decimals,
                        swapToken.from.contract_ticker_symbol,
                        swapToken.to.contract_ticker_symbol,
                        18,
                        usdtToInrRate!
                    )
                    );

                    const bestQuote = transformed.sort((a: Quote, b: Quote) => a.price - b.price)[0];

                    setSelectedProvider(bestQuote);
                    setResults(transformed);
                }
            })
            .catch((err) => {
                if (err.name !== "AbortError" && isMountedRef.current) {
                    console.error("Quote fetch error:", err);
                    setResults([]);
                }
            })
            .finally(() => {
                if (isMountedRef.current) {
                    setLoadingQuote(false);
                }
            });

        return () => {
            ac.abort();
        };
    }, [debouncedQuery, swapToken.from, swapToken.to, address]);

    const handleTokenClick = useCallback((token: Token) => {
        setShowCoin({
            contract_name: token.contract_name,
            contract_address: token.contract_address,
            contract_ticker_symbol: token.contract_ticker_symbol,
            logo_url: token.logo_url,
        });

        // Don't allow swapping BNB or native token
        if (token.contract_address === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" || 
            token.contract_ticker_symbol === "BNB") {
            return;
        }

        if (bnbToken) {
            setSwapToken({
                from: token,
                to: bnbToken,
            });
        }
    }, [setShowCoin, bnbToken]);

    const handleGoBack = useCallback(() => {
        // Reset all swap-related state
        setSwapToken({
            from: createEmptyToken(),
            to: createEmptyToken(),
        });
        setAmountToSell("");
        setResults([]);
        setSelectedProvider(null);
        setLoadingQuote(false);
        
        // Abort any pending requests
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    const handleSwapTokenPosition = useCallback(() => {
        setSwapToken((prev) => ({
            from: prev.to,
            to: prev.from,
        }));
        // Reset amount when swapping positions
        setAmountToSell("");
        setResults([]);
    }, []);

    const updateWalletBalance = useCallback(async (lineSeries: ISeriesApi<'Line'>) => {
        try {
            const { lastAmount, lastTimestamp } = await getWalletBalance(lineSeries);
            
            let currentAmount = lastAmount;
            const currentTimestamp = lastTimestamp;

            // Initial real-time update
            const result = await getRealTimeWalletUpdate(lineSeries, currentAmount, currentTimestamp);
            currentAmount = result.amount;

            // Periodic updates
            const intervalId = setInterval(async () => {
                if (!isMountedRef.current) {
                    clearInterval(intervalId);
                    return;
                }
                try {
                    const result = await getRealTimeWalletUpdate(lineSeries, currentAmount, currentTimestamp);
                    currentAmount = result.amount;
                } catch (error) {
                    console.error("Wallet update error:", error);
                }
            }, 10_000);

            // Return cleanup function
            return () => clearInterval(intervalId);
        } catch (error) {
            console.error("Failed to initialize wallet balance:", error);
            return () => {}; // Return empty cleanup function
        }
    }, []);

    // Wallet balance update interval
    useEffect(() => {
        const getWalletBalanceInterval = setInterval(() => {
            if (isMountedRef.current) {
                setTrigger((prev) => prev + 1);
            }
        }, 600_000);

        return () => clearInterval(getWalletBalanceInterval);
    }, []);

    // Theme change trigger
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (isMountedRef.current) {
                setTrigger((prev) => prev + 1);
            }
        }, 100);

        return () => clearTimeout(timeout);
    }, [theme]);

    // Chart initialization effect
    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const primaryColor = rootStyles.getPropertyValue("--primary").trim();
        const foregroundColor = rootStyles.getPropertyValue("--foreground").trim();

        if (!chartContainerRef.current || usdtToInrRate == null) return;

        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 190,
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: foregroundColor,
            },
            grid: {
                vertLines: {
                    color: theme === "dark" ? "#ededed" : "#b3b3b3",
                    style: 4,
                    visible: true,
                },
                horzLines: {
                    color: theme === "dark" ? "#ededed" : "#b3b3b3",
                    style: 4,
                    visible: true,
                },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: { color: "#94a3b8", width: 1, style: 1, visible: true, labelVisible: true },
                horzLine: { color: "#94a3b8", width: 1, style: 1, visible: true, labelVisible: true },
            },
            rightPriceScale: { visible: false },
            leftPriceScale: {
                visible: true,
                borderVisible: false,
            },
            timeScale: {
                rightOffset: 3,
                barSpacing: 8,
                borderVisible: false,
                timeVisible: false,
                secondsVisible: false,
                fixLeftEdge: true,
                fixRightEdge: false,
            },
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
            },
            handleScale: {
                axisPressedMouseMove: true,
                mouseWheel: true,
                pinch: true,
            },
        });

        const computeDecimalsFromPrice = (price: number) => {
            if (!isFinite(price) || price === 0) return 2;
            const abs = Math.abs(price);
            if (abs >= 1) return 2;
            const decimals = Math.ceil(-Math.log10(abs)) + 2;
            return Math.min(8, Math.max(2, decimals));
        };

        const formatPriceDynamic = (price: number) => {
            if (!isFinite(price)) return String(price);
            if (price === 0) return "0";
            const decimals = computeDecimalsFromPrice(price);
            return price.toLocaleString(undefined, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            });
        };

        chart.applyOptions({
            localization: {
                timeFormatter: (time: Time): string => {
                    if (typeof time === "number") {
                        const date = new Date((time as UTCTimestamp) * 1000);
                        return date.toLocaleTimeString("en-IN", {
                            timeZone: "UTC",
                            hour12: false,
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        });
                    }
                    return String(time);
                },
                priceFormatter: (price: number) => formatPriceDynamic(price),
            },
        });

        const lineSeries = chart.addSeries(LineSeries, {
            color: primaryColor,
            lineWidth: 2,
            priceFormat: {
                type: "price",
                precision: 8,
                minMove: Math.pow(10, -8),
            },
        }) as ISeriesApi<"Line">;

        // Setup wallet balance updates and store cleanup function
        updateWalletBalance(lineSeries).then((cleanup) => {
            walletUpdateCleanupRef.current = cleanup;
        });

        chart.timeScale().fitContent();

        const handleResize = () => {
            if (chartContainerRef.current && isMountedRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            // Cleanup wallet updates
            if (walletUpdateCleanupRef.current) {
                walletUpdateCleanupRef.current();
                walletUpdateCleanupRef.current = null;
            }
            chart.remove();
        };
    }, [trigger, usdtToInrRate, theme, updateWalletBalance]);

    // Swap view
    if (!isTokenEmpty(swapToken.from)) {
        return (
            <div className="border border-border rounded-xl w-110 bg-sidebar p-3 text-sidebar-foreground">
                <div className="flex items-center justify-between w-full mb-2">
                    <p className="ms-1 -mt-1">Swap Token</p>
                    <Button variant="ghost" onClick={() => {
                        setTrigger((prev) => prev + 1);
                        handleGoBack();
                    }}>
                        <ArrowLeft />
                    </Button>
                </div>
                <div className="relative flex flex-col items-center gap-y-2 h-49">
                    <SwapDetails swapToken={swapToken.from} side="from" amountToSell={amountToSell} setAmountToSell={setAmountToSell} rate={usdtToInrRate!} currency={currency} />
                    <Button variant="outline" className="absolute bg-sidebar! border-border! top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" onClick={handleSwapTokenPosition}>
                        <ArrowUpDown />
                    </Button>
                    <SwapDetails swapToken={swapToken.to} side="to" amountToSell={results.length > 0 ? results[0].buyAmountHuman: "0"} setAmountToSell={setAmountToSell} rate={usdtToInrRate!} currency={currency} />
                </div>
                <div className="text-xs mt-2.5 mb-3 flex flex-col gap-y-1.5 tracking-wider">
                    {loadingQuote ? (
                        <>
                            <p className="flex items-center justify-between"><span>Provider</span> <Skeleton className="h-[21px] w-[100px]" /></p>
                            <p className="flex items-center justify-between"><span>Price</span> <Skeleton className="h-[17px] w-[100px]" /></p>
                            <p className="flex items-center justify-between"><span>Fees</span> <Skeleton className="h-[17px] w-[100px]" /></p>
                            <p className="flex items-center justify-between"><span>Slippage</span> <Skeleton className="h-[17px] w-[100px]" /></p>
                        </>
                    ) : (
                        <>
                            <p className="flex items-center justify-between">
                                <span>Provider</span> 
                                <div className="flex items-center gap-x-1">
                                <span>{selectedProvider ? selectedProvider.provider : "-"}</span>
                                {results.length > 1 && 
                                <Dialog>
                                    <DialogTrigger>
                                        <Button variant="ghost" className="h-6 w-4">
                                            <ChevronRight size={14} />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="w-92 px-2 pb-2">
                                        <DialogHeader>
                                            <DialogTitle className="-mt-2 text-center">Select A Quote</DialogTitle>
                                        </DialogHeader>
                                        <DialogDescription>
                                            <div className="flex items-center justify-between text-md px-4">
                                                <span>Net cost</span>
                                                <span>Time</span>
                                            </div>
                                            <div className="flex flex-col mt-2 gap-y-1">
                                                {results.map((result) => (
                                                    <div key={result.allowanceTarget} className={cn("w-full flex items-center justify-between cursor-pointer py-1.5 pe-2 ps-1", result.allowanceTarget === selectedProvider!.allowanceTarget ? "bg-primary/30" : "hover:bg-sidebar")} onClick={() => {
                                                        setSelectedProvider(result);
                                                    }}>
                                                        <div className="flex items-center gap-x-2">
                                                            <div className={cn("w-0.5 h-16 rounded-full", result.allowanceTarget === selectedProvider!.allowanceTarget && "bg-primary")} />
                                                            <div className="flex flex-col">
                                                                <span className="text-[16px] dark:text-white/70 text-black/70 font-semibold">{Number(result.buyAmountHuman).toFixed(3)} {swapToken.to.contract_ticker_symbol}</span>
                                                                <span>{currency === "inr" ? "₹" : "$"} {(Number(result.buyAmountHuman) * swapToken.to.quote_rate * usdtToInrRate!).toFixed(5)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-x-2">
                                                            <span className="dark:text-white/70 text-black/70 font-semibold">{"< 1 min"}</span>
                                                            <span>{result.provider}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </DialogDescription>
                                    </DialogContent>
                                </Dialog>
                                }
                                </div>
                            </p>
                            <p className="flex items-center justify-between">
                                <span>Price</span> 
                                <span>{selectedProvider ? selectedProvider.priceText : "-"}</span>
                            </p>
                            <p className="flex items-center justify-between">
                                <span>Fees</span> 
                                <span>{selectedProvider ? (currency === "inr" ? "₹" : "$") : ""} {selectedProvider ? selectedProvider.gasCostUSD : "-"}</span>
                            </p>
                            <p className="flex items-center justify-between">
                                <span>Slippage</span> 
                                <span>{selectedProvider ? selectedProvider.slippageText : "-"}</span>
                            </p>
                        </>
                    )}
                </div>
                <div className="w-full">
                    <Button className="w-full" disabled={loadingQuote || results.length === 0}>Swap</Button>
                </div>
            </div>
        );
    }

    // Main portfolio view
    return (
        <div className="border border-border rounded-xl w-110 bg-sidebar p-3 text-sidebar-foreground">
            <p className="text-sm">Your Portfolio</p>
            <div className="flex items-center gap-x-2">
                {walletBalance == null || usdtToInrRate == null ? (
                    <Skeleton className="h-[48px] w-[170px] mt-1 rounded-lg" />
                ) : (
                    <>
                        <p className="text-5xl mt-1 text-primary">
                            {currency === "inr" ? "₹" : "$"}{Math.round((walletBalance * usdtToInrRate) * 100) / 100}
                        </p>
                        <Button variant="ghost" className="mt-4" onClick={() => {setRateUpdateTrigger((prev) => prev + 1); setTrigger((prev) => prev + 1)}}>
                            <RefreshCcw size={11} />
                        </Button>
                    </>
                )}
            </div>
            <p className="text-sm mt-1 flex items-center gap-x-1 font-semibold font-mono">
                <ChevronUpCircleIcon size={13} /> ₹5,230 <span className="text-green-700">(+2.5%)</span>
            </p>
            
            <hr className="mt-3 mb-1" />

            <Tabs defaultValue="wallet" className="w-full text-sm" 
                onValueChange={(value) => {
                    if (value === "wallet") {
                        setTrigger((prev) => prev + 1);
                    }
                }}>
                <TabsList>
                    <TabsTrigger value="wallet">Wallet</TabsTrigger>
                    <TabsTrigger value="top-assets">Top Assets</TabsTrigger>
                </TabsList>

                <TabsContent value="wallet">
                    <div className="h-48 -mt-0.5 -ms-2 overflow-auto">
                        <div ref={chartContainerRef} className="w-full h-full" />
                    </div>
                </TabsContent>

                <TabsContent value="top-assets">
                    <div className="h-48 -mt-0.5 -mx-3 overflow-auto">
                        {tokens?.map((token: Token) => (
                            <div
                                key={`${token.contract_ticker_symbol}-${token.contract_address}`}
                                className="flex items-center justify-between p-3 mb-0.5 w-full transition-all hover:bg-sidebar-accent cursor-pointer"
                                onClick={() => handleTokenClick(token)}
                            >
                                <div className="flex items-center gap-x-2">
                                    <img
                                        src={
                                            token.logo_url?.includes("https://") 
                                                ? token.logo_url 
                                                : `${import.meta.env.VITE_BOT_BASE_URL}/api/token-icon?url=${String(token.logo_url).slice(1)}`
                                        }
                                        alt={token.contract_ticker_symbol}
                                        className="flex items-center justify-center rounded-full bg-gray-200 text-xs w-8 h-8 flex-shrink-0"
                                    />
                                    <div className="flex flex-col">
                                        <p className="text-sm font-semibold">{token.contract_ticker_symbol}</p>
                                        <p className="text-xs flex items-center gap-x-1">
                                            {currency === "inr" ? "₹" : "$"}{Math.round((token.quote_rate * (usdtToInrRate ?? 1)) * 100) / 100}
                                            &nbsp;<span className={cn("flex items-center gap-x-1 font-semibold", token.quote_rate > token.quote_rate_24h ? "text-green-600" : "text-red-400")}>
                                                ({token.quote_rate > token.quote_rate_24h ? "+" : ""}{Math.round(((token.quote_rate - token.quote_rate_24h) / token.quote_rate_24h * 100) * 100) / 100}%)
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <p className="text-sm font-semibold">{Math.round((token.balance) * 10000) / 10000}</p>
                                    <p className="text-xs flex items-center gap-x-1">
                                        {currency === "inr" ? "₹" : "$"}{Math.round((token.quote * (usdtToInrRate ?? 1)) * 100) / 100}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
            <div className="flex items-center mt-0.5 gap-x-2 w-full">
                <WalletTransaction />
            </div>
        </div>
    );
};

export default PortfolioCard;
