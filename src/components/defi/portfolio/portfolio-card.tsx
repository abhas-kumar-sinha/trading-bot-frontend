import { ArrowLeft, ArrowUpDown, ChevronUpCircleIcon, RefreshCcw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createChart, ColorType, CrosshairMode, LineSeries, type UTCTimestamp, type Time, type ISeriesApi } from "lightweight-charts";
import { useAppContext, type Token } from "@/contexts/AppContext"
import WalletTransaction from "./wallet-transaction"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrencyContext } from "@/contexts/CurrencyContext"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react";
import SwapDetails from "./swap-details"
import { useTheme } from "@/contexts/ThemeContext";
import { getRealTimeWalletUpdate, getWalletBalance } from "@/lib/walletData";

export interface SwapToken {
    from: Token;
    to: Token;
}

const PortfolioCard = () => {

    const chartContainerRef = useRef<HTMLDivElement>(null);
    const { usdtToInrRate, setRateUpdateTrigger, currency } = useCurrencyContext();
    const { walletBalance, tokens, setShowCoin } = useAppContext();
    const [loading, setLoading] = useState(false);
    const { theme } = useTheme();
    const [trigger, setTrigger] = useState(0);
    const [swapToken, setSwapToken] = useState<SwapToken>({
        from:{
            contract_address: "",
            contract_ticker_symbol: "",
            contract_name: "",
            logo_url: "",
            balance: 0,
            quote_rate: 0,
            quote_rate_24h: 0,
            quote: 0,
            is_spam: false,
        },
        to:{
            contract_address: "",
            contract_ticker_symbol: "",
            contract_name: "",
            logo_url: "",
            balance: 0,
            quote_rate: 0,
            quote_rate_24h: 0,
            quote: 0,
            is_spam: false,
        }
    })

    const handleTokenClick = (token: Token) => {
        setShowCoin({
            contract_name: token.contract_name,
            contract_address: token.contract_address,
            contract_ticker_symbol: token.contract_ticker_symbol,
            logo_url: token.logo_url,
        });

        setSwapToken((prev) => {
            return {
                ...prev,
                from: token
            }
        })
    }

    const handleGoBack = () => {
        setSwapToken((prev) => {
            return {
                ...prev,
                from: {
                    contract_address: "",
                    contract_ticker_symbol: "",
                    contract_name: "",
                    logo_url: "",
                    balance: 0,
                    quote_rate: 0,
                    quote_rate_24h: 0,
                    quote: 0,
                    is_spam: false,
                },
            }
        })
    }

    const handleSwapTokenPosition = () => {
        setLoading(true);
        setSwapToken((prev) => {
            return {
                ...prev,
                from: prev.to,
                to: prev.from,
            }
        })
        setLoading(false);
    }

    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = rootStyles.getPropertyValue("--primary").trim();
    const backgroundColor = rootStyles.getPropertyValue("--background").trim();
    const foregroundColor = rootStyles.getPropertyValue("--foreground").trim();

    const updateWalletBalance = async (lineSeries: ISeriesApi<'Line'>) => {
        const { lastAmount, lastTimestamp } = await getWalletBalance(lineSeries);
        
        let currentAmount = lastAmount;
        const currentTimestamp = lastTimestamp; // Keep timestamp fixed

        // Initial real-time update
        const result = await getRealTimeWalletUpdate(lineSeries, currentAmount, currentTimestamp);
        currentAmount = result.amount;

        // Periodic updates
        const intervalId = setInterval(async () => {
            const result = await getRealTimeWalletUpdate(lineSeries, currentAmount, currentTimestamp);
            currentAmount = result.amount;
        }, 10_000);

        // Return cleanup function
        return () => clearInterval(intervalId);
    }

    useEffect(() => {
        const getWalletBlanceInterval = setInterval(() => {
            setTrigger((prev) => prev + 1);
        }, 60_000);  // Update wallet balance every 1 min

        return () => clearInterval(getWalletBlanceInterval);
    }, []);

    useEffect(() => {
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
            minBarSpacing: 10,
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
    
        // Dynamic price formatting helper (adapts decimals to magnitude)
        const computeDecimalsFromPrice = (price: number) => {
        if (!isFinite(price) || price === 0) return 2;
        const abs = Math.abs(price);
        if (abs >= 1) return 2;
        const decimals = Math.ceil(-Math.log10(abs)) + 2;
        return Math.min(8, Math.max(2, decimals)); // clamp between 2 and 8
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
    
        // create line series with a safe high precision initially
        const lineSeries = chart.addSeries(LineSeries, {
        color: primaryColor,
        lineWidth: 2,
        priceFormat: {
            type: "price",
            precision: 8, // allow decimals down to 1e-8 initially
            minMove: Math.pow(10, -8),
        },
        }) as ISeriesApi<"Line">;
            
        updateWalletBalance(lineSeries)

        // After setting data, fit the content to show all data starting from the left
        chart.timeScale().fitContent();

        const handleResize = () => {
        if (chartContainerRef.current) {
            chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
        };
        window.addEventListener("resize", handleResize);
    
        return () => {
        window.removeEventListener("resize", handleResize);
        chart.remove();
        };
    }, [primaryColor, backgroundColor, foregroundColor, theme, trigger, usdtToInrRate]);

    if (loading) {
        return (
            <div className="border border-border rounded-xl w-110 bg-sidebar p-3 text-sidebar-foreground">
                <div className="flex items-center justify-between w-full mb-2">
                    <Skeleton className="h-[20px] w-[100px]" />
                    <Button variant="ghost" onClick={() => handleGoBack()}><ArrowLeft /></Button>
                </div>
                <div className="relative flex flex-col items-center gap-y-2 h-49">
                    <SwapDetails loading={loading} swapToken={swapToken} usdtToInrRate={usdtToInrRate!} />
                    <Button variant="outline" className="absolute bg-sidebar! border-border! top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" onClick={() => handleSwapTokenPosition()}>
                        <ArrowUpDown />
                    </Button>
                    <SwapDetails loading={loading} swapToken={swapToken} usdtToInrRate={usdtToInrRate!} />
                </div>
                <div className="text-xs mt-2.5 flex flex-col gap-y-1 tracking-wider">
                    <p className="flex items-center justify-between"><span>Provider</span> <Skeleton className="h-[20px] w-[100px]" /></p>
                    <p className="flex items-center justify-between"><span>Price</span> <Skeleton className="h-[20px] w-[100px]" /></p>
                    <p className="flex items-center justify-between"><span>Fees</span> <Skeleton className="h-[20px] w-[100px]" /></p>
                    <p className="flex items-center justify-between"><span>Slippage</span> <Skeleton className="h-[20px] w-[100px]" /></p>
                </div>
                <div className="w-full mt-2.5">
                    <Button className={"w-full cursor-not-allowed opacity-50"}>Swap</Button>
                </div>
            </div>
        )
    }

    if (!(swapToken.from.contract_address === "")) {
        return (
            <div className="border border-border rounded-xl w-110 bg-sidebar p-3 text-sidebar-foreground">
                <div className="flex items-center justify-between w-full mb-2">
                    <p className="ms-1 -mt-1">Swap Token</p>
                    <Button variant="ghost" onClick={() => {setTrigger((prev) => prev + 1); handleGoBack()}}><ArrowLeft /></Button>
                </div>
                <div className="relative flex flex-col items-center gap-y-2 h-49">
                    <SwapDetails loading={loading} swapToken={swapToken} usdtToInrRate={usdtToInrRate!} />
                    <Button variant="outline" className="absolute bg-sidebar! border-border! top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" onClick={() => handleSwapTokenPosition()}>
                        <ArrowUpDown />
                    </Button>
                    <SwapDetails loading={loading} swapToken={swapToken} usdtToInrRate={usdtToInrRate!} />
                </div>
                <div className="text-xs mt-4 flex flex-col gap-y-1 tracking-wider">
                    <p className="flex items-center justify-between"><span>Provider</span> <span>Uniswap</span></p>
                    <p className="flex items-center justify-between"><span>Price</span> <span>1USDC = 1000 INR</span></p>
                    <p className="flex items-center justify-between"><span>Fees</span> <span>₹5,230</span></p>
                    <p className="flex items-center justify-between"><span>Slippage</span> <span>0.5%</span></p>
                </div>
                <div className="w-full mt-4.5">
                    <Button className="w-full">Swap</Button>
                </div>
            </div>
        )
    }

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
                    <Button variant="ghost" className="mt-4" onClick={() => setRateUpdateTrigger((prev) => prev + 1)}><RefreshCcw size={11} /></Button>
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
                        {tokens
                        .map((token: Token) => (
                            <div
                            key={token.contract_ticker_symbol}
                            className="flex items-center justify-between p-3 mb-0.5 w-full transition-all hover:bg-sidebar-accent cursor-pointer"
                            onClick={() => handleTokenClick(token)}
                            >
                                <div className="flex items-center gap-x-2">
                                    <img
                                        src={
                                            token.logo_url!.includes("https://") 
                                            ? token.logo_url 
                                            : `${import.meta.env.VITE_BOT_BASE_URL}/api/token-icon?url=${String(token.logo_url).slice(1)}`}
                                        className="flex items-center justify-center rounded-full bg-gray-200 text-xs w-8 h-8 flex-shrink-0"
                                    />
                                    <div className="flex flex-col">
                                        <p className="text-sm font-semibold">{token.contract_ticker_symbol}</p>
                                        <p className="text-xs flex items-center gap-x-1">{currency === "inr" ? "₹" : "$"}{Math.round((token.quote_rate * usdtToInrRate!) * 100) / 100}
                                            &nbsp;<span className={cn("flex items-center gap-x-1 font-semibold", token.quote_rate > token.quote_rate_24h ? "text-green-600" : "text-red-400")}>
                                                ({token.quote_rate > token.quote_rate_24h ? "+" : ""}{Math.round(((token.quote_rate - token.quote_rate_24h)/token.quote_rate_24h * 100) * 100) / 100}%)
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <p className="text-sm font-semibold">{Math.round((token.balance) * 10000) / 10000}</p>
                                    <p className="text-xs flex items-center gap-x-1">{currency === "inr" ? "₹" : "$"}{Math.round((token.quote * usdtToInrRate!) * 100) / 100}</p>
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
    )
}
export default PortfolioCard