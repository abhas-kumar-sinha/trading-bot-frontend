import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import type { SmartMoneyTransaction } from "./transactionTable"
import { Check, Copy } from "lucide-react"
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyContext } from "@/contexts/CurrencyContext";

interface TradeStatsApi {
    contractAddress: string;
    buyAmtUsd: number;
    buyCnt: number;
    sellAmtUsd: number;
    sellCnt: number;
    realizedPnl: number;
    realizedPnlPercent: number;
    price: number;
    avgPrice: number;
    remainQty: number;
    baseCoinPrice: number;
    lastTxTime: number;
    openTime: number;
}

interface TradeStats {
  Bought: string | null;
  Sold: string | null;
  "Realized Pnl": string | null;
  "Unrealized Pnl": string | null;
  Balance: string | null;
  "Holding Duration": string | null;
}

const HoverTransactionDetails = ({children, transaction}: {children: React.ReactNode, transaction: SmartMoneyTransaction}) => {
  const { currency, usdtToInrRate } = useCurrencyContext();
  const [loading, setLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [tradeStats, setTradeStats] = useState<TradeStats>({
    Bought: null,
    Sold: null,
    "Realized Pnl": null,
    "Unrealized Pnl": null,
    Balance: null,
    "Holding Duration": null
  })

  const formatNumber = (num: number, decimals = 2): string => {
    if (num >= 1e9) return (num / 1e9).toFixed(decimals) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(decimals) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(decimals) + "K";
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const formattedTime = (time: number) => {
    const seconds = Math.floor(time / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);
    
    if (years > 0) return `${years}y`;
    if (months > 0) return `${months}m`;
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}min`;
    return `${seconds}s`;
  };

  const fetchTradeStats = () => {
    setLoading(true);
    axios.get(`${import.meta.env.VITE_BOT_BASE_URL}/api/trade-stats/${transaction.address}`)
      .then(response => {
        const data = response.data.data;
        const tradeStats = data.filter((item: TradeStatsApi) => item.contractAddress === transaction.ca);
        
        setTradeStats({
          Bought: tradeStats[0].buyAmtUsd && tradeStats[0].buyCnt ? `${formatNumber(Number(tradeStats[0].buyAmtUsd * usdtToInrRate!))} (${tradeStats[0].buyCnt})` : null,
          Sold: tradeStats[0].sellAmtUsd && tradeStats[0].sellCnt ? `${formatNumber(Number(tradeStats[0].sellAmtUsd * usdtToInrRate!))} (${tradeStats[0].sellCnt})` : null,
          "Realized Pnl": tradeStats[0].realizedPnl && tradeStats[0].realizedPnlPercent ? `${formatNumber(Number(tradeStats[0].realizedPnl * usdtToInrRate!))} (${tradeStats[0].realizedPnlPercent > 0 ? "+" : ""}${formatNumber(Number(tradeStats[0].realizedPnlPercent * 100))}%)` : null,
          "Unrealized Pnl": tradeStats[0].price && tradeStats[0].avgPrice && tradeStats[0].remainQty && tradeStats[0].baseCoinPrice ? `${formatNumber((Number(tradeStats[0].price) - Number(tradeStats[0].avgPrice)) * Number(tradeStats[0].remainQty) * Number(tradeStats[0].baseCoinPrice))}` : null,
          Balance: tradeStats[0].remainQty && tradeStats[0].price && tradeStats[0].baseCoinPrice ? `${formatNumber(Number(tradeStats[0].remainQty) * Number(tradeStats[0].price) * Number(tradeStats[0].baseCoinPrice) * usdtToInrRate!)} ` : "0",
          "Holding Duration": formattedTime(tradeStats[0].lastTxTime - tradeStats[0].openTime)
        });
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching trade stats:', error);
        setLoading(false);
      });
  }

  const resetTradeStats = () => {
    setTradeStats({
      Bought: null,
      Sold: null,
      "Realized Pnl": null,
      "Unrealized Pnl": null,
      Balance: null,
      "Holding Duration": null
    });
    setLoading(false);
  }

  useEffect(() => {
      let timer: NodeJS.Timeout;
      if (isCopied) {
          timer = setTimeout(() => setIsCopied(false), 2000);
      }
      return () => clearTimeout(timer);
  }, [isCopied]);

  const handleCopy = () => {
    navigator.clipboard.writeText(transaction.address);
    setIsCopied(true);
  };

  return (    
    <HoverCard   onOpenChange={(open) => {
      if (open) {
        fetchTradeStats();
      } else {
        resetTradeStats();
      }
    }}>
      <HoverCardTrigger className="cursor-pointer" asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-60 p-2">
        {loading ?
        <div className="flex flex-col text-xs">
          <div className="flex justify-between items-center w-full">
            <Skeleton className="w-2/3 h-4" />
            <Skeleton className="w-4 h-4" />
          </div>
          <hr className="w-full my-2" />
          <div className="flex flex-col gap-y-1.5">
          {Object.entries(tradeStats).map(([key]) => (
            <div key={key} className="flex justify-between items-center w-full">
              <Skeleton className="w-1/3 h-4" />
              <Skeleton className="w-1/4 h-4" />
            </div>
          ))}
          </div>
        </div>
        :
        <div className="flex flex-col text-xs">
          <div className="flex justify-between items-center w-full">
            <span className="w-2/3 break-words whitespace-nomal">{transaction.address}</span>
            {isCopied ? <Check className="cursor-pointer" size={16} /> : <Copy className="cursor-pointer" size={16} onClick={() => handleCopy()} />}
          </div>
          <hr className="w-full my-2" />
          <div className="flex flex-col gap-y-1.5 text-[10px]">
          {Object.entries(tradeStats).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center w-full">
              <span className="text-muted-foreground">{key}</span>
              <span>{key !== "Holding Duration" && value && (currency === "inr" ? "₹" : "$")} {value ? value : "-"}</span>
            </div>
          ))}
          </div>
        </div>}
      </HoverCardContent>
    </HoverCard>
  )
}
export default HoverTransactionDetails