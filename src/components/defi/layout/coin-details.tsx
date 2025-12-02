import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowDownRight, ChevronDown, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/contexts/AppContext";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from "@/components/ui/tooltip"
import { ExchangeIcon } from '@web3icons/react'
import { useCurrencyContext } from "@/contexts/CurrencyContext";
import { Input } from "@/components/ui/input";

type CoinDetails = {
    "Price": number | null;
    "Net Volume": number | null;
    "Market Cap": number | null;
    "Liquidity": number | null;
    "Top 10": number | null;
};

interface BotStats {
    uptime: string | null;
    lastChecked: string | null;
}

const formatNumber = (num: number, decimals = 2): string => {
  if (num >= 1e9) return (num / 1e9).toFixed(decimals) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(decimals) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(decimals) + "K";
  return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

function formatTime(secondsString: string): string {
  const seconds = Number(secondsString);
  const days = Math.floor(seconds / (24 * 3600));
  const hrs = Math.floor((seconds % (24 * 3600)) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) {
    return `${days}d ${hrs}h ${mins}m ${secs}s`;
  } else if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  } else if (mins > 0) {
    return `${mins}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

type Opts = {
  maxSmallSignificant?: number;
  maxSmallDecimals?: number;
  maxTinyPower?: number;
  thousands?: boolean;
  // NEW:
  showFullLeadingZeros?: boolean;   // default false -> compress zeros
  maxVisibleLeadingZeros?: number;  // when showFullLeadingZeros=false, show up to this many zeros before sub
};

function formatPriceWithSubscript(
  price: number | null | undefined,
  opts: Opts = {}
): React.ReactNode {
  const {
    maxSmallSignificant = 8,
    maxSmallDecimals = 12,
    maxTinyPower = 12,
    thousands = true,
    showFullLeadingZeros = false,
    maxVisibleLeadingZeros = 1, // default: show a single 0 before the <sub>
  } = opts;

  if (price === null || price === undefined || Number.isNaN(price)) return "-";
  if (!Number.isFinite(price)) return price > 0 ? "∞" : "-∞";

  const sign = price < 0 ? "-" : "";
  const abs = Math.abs(price);

  if (abs >= 1) {
    const nf = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: thousands,
    });
    return <>{sign}{nf.format(abs)}</>;
  }

  if (abs === 0) return "0";
  if (abs < Math.pow(10, -maxTinyPower)) {
    return <>{sign}&lt; 1e-{maxTinyPower}</>;
  }

  // Build a stable fixed representation with enough decimals, then trim trailing zeros
  const fixed = abs.toFixed(maxSmallDecimals).replace(/0+$/, "");
  const normalized = fixed.endsWith(".") ? fixed + "0" : fixed;

  const m = normalized.match(/^0\.(0*)(\d.*)$/);
  if (!m) return <>{sign}{normalized}</>;

  const leadingZeros = m[1].length;
  const significant = m[2];

  // truncate significant part to reasonable length
  const sigTrunc = significant.slice(0, maxSmallSignificant);

  const index = leadingZeros + 1;

  // Decide how many visible zeros to show before the <sub>
  let visibleZeros = "";
  if (showFullLeadingZeros) {
    visibleZeros = "0".repeat(leadingZeros);
  } else {
    visibleZeros = leadingZeros > 0 ? "0".repeat(Math.min(maxVisibleLeadingZeros, leadingZeros)) : "";
  }


  return (
    <>
      {sign}
      0.
      {visibleZeros}
      <sub style={{ fontVariantNumeric: "normal" }}>{index}</sub>
      {sigTrunc.slice(0, 4)}
    </>
  );
}

const CoinDetails = () => {

    const { showCoin, setShowCoin, tokens } = useAppContext();
    const { currency, usdtToInrRate } = useCurrencyContext()
    const [isBinanceBotActive, setIsBinanceBotActive] = useState<boolean>(true);
    const [coinDetails, setCoinDetails] = useState<CoinDetails>({
        "Price": null,
        "Net Volume": null,
        "Market Cap": null,
        "Liquidity": null,
        "Top 10": null,
    });
    const [percentChange24h, setPercentChange24h] = useState<number | null>(null);
    const [botStats, setBotStats] = useState<BotStats>({uptime: null, lastChecked: null});
    const [searchCrypto, setSearchCrypto] = useState<string>("");
    const [searching, setSearching] = useState<boolean>(false);

    const handleRadioChange = (value: string) => {
        const token = tokens.find((token) => token.contract_ticker_symbol === value);
        if (token) {
            setShowCoin({
                contract_name: token.contract_name,
                contract_address: token.contract_address,
                contract_ticker_symbol: token.contract_ticker_symbol,
                logo_url: token.logo_url
            });
        }
    }

    const handleCoinSearch = () => {
        setSearching(true);
        fetch(`${import.meta.env.VITE_BOT_BASE_URL}/api/token/${searchCrypto}/details`)
            .then((res) => res.json())
            .then((data) => {
                if (data.data) {
                    setShowCoin({
                        contract_name: data.data.name,
                        contract_address: data.data.contractAddress,
                        contract_ticker_symbol: data.data.symbol,
                        logo_url: data.data.icon
                    });
                    setSearchCrypto("")
                } else {
                    alert(`Invalid token: ${searchCrypto}`)
                }
            })
            .catch((err) => {
                alert(`Invalid token: ${searchCrypto}`)
                console.error("Binance fetch error:", err)
            })
            .finally(() => {
                setSearching(false);
            })
    }

    useEffect(() => {
        const checkBot = () => {
            fetch(`${import.meta.env.VITE_BOT_BASE_URL!}/api/health`)
                .then((res) => res.json())
                .then((data) => {
                    setIsBinanceBotActive(data.status);
                    setBotStats((prev) => {
                        return {...prev, uptime: data.uptime, lastChecked: new Date(data.timestamp).toLocaleTimeString()}
                    })
                })
                .catch(() => {
                    setIsBinanceBotActive(false);
                        setBotStats((prev) => {
                        return {...prev, uptime: "inActive", lastChecked: new Date().toLocaleTimeString()}
                    })
                });

        }

        checkBot(); // initial fetch
        const interval = setInterval(checkBot, 10000); // update every 10s

        return () => clearInterval(interval);

    }, [])

    useEffect(() => {
        const fetchData = () => {
        fetch(`${import.meta.env.VITE_BOT_BASE_URL}/api/token/${showCoin.contract_address}/market-dynamics`)
            .then((res) => res.json())
            .then((data) => {
            setCoinDetails({
                "Price": parseFloat(data.data.price) * usdtToInrRate!,
                "Net Volume": (parseFloat(data.data.volume24hBuy) - parseFloat(data.data.volume24hSell)) * usdtToInrRate!,
                "Market Cap": Math.round(parseFloat(data.data.marketCap) * 100) / 100 * usdtToInrRate!,
                "Liquidity": Math.round(parseFloat(data.data.liquidity) * 100) / 100 * usdtToInrRate!,
                "Top 10": parseFloat(data.data.top10HoldersPercentage),
            });
            setPercentChange24h(parseFloat(data.data.percentChange24h));
            })
            .catch((err) => console.error("Binance fetch error:", err))
        };

        fetchData();
        const interval = setInterval(fetchData, 2500);

        return () => clearInterval(interval);
    }, [showCoin, usdtToInrRate]);

    const handleSSHConnection = async () => {
        await navigator.clipboard.writeText(
        `ssh -i "C:\\Users\\Abhas Kumar Sinha\\Desktop\\Important Docs\\bsc-trading-bot_key.pem" bsc-trader@57.159.24.214`
        );
    }
    
    return (
        <div className="flex mt-2 gap-x-3">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button className="h-18 w-50 rounded-xl flex justify-between px-5!" variant="outline">
                        <div className="flex items-center space-x-2 w-36">
                            <img
                                src={
                                    showCoin.logo_url!.includes("https://") 
                                    ? showCoin.logo_url 
                                    : `${import.meta.env.VITE_BOT_BASE_URL}/api/token-icon?url=${String(showCoin.logo_url).slice(1)}`}
                                className="flex items-center justify-center rounded-full bg-gray-200 text-xs w-8 h-8 flex-shrink-0"
                            />
                            <p className="flex flex-col items-start justify-center w-26 -mt-1">
                                <span className="text-sm font-semibold text-start w-full truncate">{showCoin.contract_ticker_symbol}</span>
                                <span className="text-xs -mt-1 text-muted-foreground text-start w-full truncate">{(tokens.find((token) => token.contract_ticker_symbol === showCoin.contract_ticker_symbol)?.contract_name) ?? showCoin.contract_name}</span>
                            </p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>

                </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-60 max-h-100">
                    <DropdownMenuLabel className="flex items-center gap-x-2">
                        <Input value={searchCrypto} onChange={(e) => setSearchCrypto(e.target.value)} className="h-8" placeholder="Search Crypto..." />
                        <Button onClick={handleCoinSearch} className="h-8 w-8">
                            {searching ? <Loader2 className="animate-spin" /> : <Search />}
                        </Button>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={showCoin.contract_ticker_symbol} onValueChange={(value) => handleRadioChange(value)}>
                        {tokens.map((token) => (
                            <DropdownMenuRadioItem key={token.contract_address} value={token.contract_ticker_symbol}>
                                {token.contract_ticker_symbol} ({token.contract_name})
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>

            </DropdownMenu>

            <div className="h-18 w-full rounded-xl flex item-center gap-1 justify-between border border-border">
                {(Object.keys(coinDetails) as (keyof CoinDetails)[]).map((key) => (
                <div key={key} className="flex flex-col items-center rounded-xl gap-x-3 justify-center hover:bg-sidebar flex-1">
                    <div className="flex flex-col items-start">
                        <span className="text-xs text-muted-foreground">{key}</span>
                        <span className="text-sm dark:text-amber-50">
                            {key === "Top 10" ? "" : currency === "inr" ? "₹" : "$"}
                            {key === "Price" ? formatPriceWithSubscript(coinDetails[key]!) : formatNumber(coinDetails[key] ?? 0)} 
                            {key === "Top 10" && !isNaN(coinDetails[key]!) && "%"}
                            {key === "Price" && <span className={cn("text-xs text-muted-foreground", (percentChange24h ?? 0) > 0 ? "text-green-500" : "text-red-500")}>&nbsp;({(percentChange24h ?? 0) > 0 ? "+" : ""}{percentChange24h + '%'})</span>}
                        </span>
                    </div>
                </div>
                ))}
            </div>

            <Button className="h-18 w-47 rounded-xl flex items-center" variant="outline">
                <div className="flex item-center justify-center shrink-0 rounded-full bg-sidebar -ml-1 p-3">
                    <ExchangeIcon className="scale-175" id="binance" variant="branded" size="64" />
                </div>
                <div className="flex flex-col items-start justify-center -mt-1">
                    <span className={cn(
                        "text-sm font-semibold flex items-center justify-between w-full",
                        isBinanceBotActive ? botStats.uptime != "inActive" && (Number(botStats.uptime) || 0) > 300 ? "text-green-500" : "text-yellow-500" : "text-red-500"
                    )}>
                        <span className="animate-pulse">
                            {isBinanceBotActive ? botStats.uptime != "inActive" && (Number(botStats.uptime) || 0) > 300 ? "Bot Active" : "Collecting Data" : "Bot Inactive"}
                        </span>
                        <Tooltip>
                            <TooltipTrigger className="h-4">
                                <button onClick={handleSSHConnection} className="hover:text-primary text-muted-foreground">
                                    <ArrowDownRight className="transform -rotate-90 animate-none!" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Open SSH connection</p>
                            </TooltipContent>
                        </Tooltip>
                    </span>
                    <div className="flex flex-col items-start text-[10px] text-muted-foreground">
                        <span>Uptime: {botStats.uptime ? botStats.uptime != "inActive" ? formatTime(botStats.uptime) : botStats.uptime : "Checking..."}</span>
                        <span>Last Checked: {botStats.lastChecked ? botStats.lastChecked : "Checking..."}</span>
                    </div>
                </div>
            </Button>
        </div>
    )
}
export default CoinDetails