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
import { ArrowDownRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/contexts/AppContext";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from "@/components/ui/tooltip"
import { ExchangeIcon } from '@web3icons/react'
import { useCurrencyContext } from "@/contexts/CurrencyContext";

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

function formatPrice(price: number | null) {
    if (price === null || price === undefined || isNaN(price)) return "-";
  
    if (price >= 1) {
      // Show 2 decimals for normal prices
      return price.toFixed(2);
    } else if (price >= 0.1) {
      return price.toFixed(3);
    } else if (price >= 0.01) {
      return price.toFixed(4);
    } else if (price >= 0.001) {
      return price.toFixed(5);
    } else if (price >= 0.0001) {
      return price.toFixed(6);
    } else {
      // For ultra-small prices, show up to 8 decimals but strip trailing zeros
      return parseFloat(price.toFixed(8)).toString();
    }
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
    const [botStats, setBotStats] = useState<BotStats>({uptime: null, lastChecked: null})

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
                    <DropdownMenuContent className="w-56 max-h-100">
                    <DropdownMenuLabel>Crypto Coin</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={showCoin.contract_ticker_symbol} onValueChange={(value) => handleRadioChange(value)}>
                        {tokens.map((token) => (
                            <DropdownMenuRadioItem key={token.contract_address} value={token.contract_ticker_symbol}>{token.contract_ticker_symbol}</DropdownMenuRadioItem>
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
                            {key === "Price" ? formatPrice(coinDetails[key]!) : formatNumber(coinDetails[key] ?? 0)} 
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
                                <a target="_blank" className="hover:text-primary text-muted-foreground" href="https://portal.azure.com/#@iitd.ac.in/resource/subscriptions/cfe26d18-e5c3-493a-ad1d-1bc34b937efc/resourceGroups/my-vm-group/providers/Microsoft.Compute/virtualMachines/bsc-trading-bot/connect">
                                    <ArrowDownRight className="transform -rotate-90 animate-none!" />
                                </a>
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