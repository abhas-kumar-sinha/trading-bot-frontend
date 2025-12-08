import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { Suspense } from "react"
import { useCurrencyContext } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/contexts/AppContext";
import HoverTransactionDetails from "./hoverTransactionDetails";
import { timeAgo } from "@/lib/utils";

export interface SmartMoneyTransaction {
    chainId: string;
    txHash: string;
    address: string;
    label: string | null;
    ts: number;
    tradeSideCategory: number;
    txUsdValue: string;
    nativePrice: string;
    tokenSupply: string;
    tokenPrice: string;
    txNativeTokenQty: string;
    ca: string;
    tokenIconUrl: string;
    tokenName: string;
    tokenDecimals: number;
    marketCap: string;
    tokenRiskLevel: number;
    addressLogoUrl: string | null;
    launchTime: number | null;
}

const TransactionTable = ({transactionData}: {transactionData: SmartMoneyTransaction[]}) => {
    const { currency, usdtToInrRate } = useCurrencyContext();
    const { setShowCoin } = useAppContext();

    const getTransactionType = (type: number) => {
        switch (type) {
            case 11:
                return "First Buy"
            case 19:
                return "Buy"
            case 29:
                return "Sell"
            case 21:
                return "Sell All"
            default:
                return "Buy"
        }
    }

    function formatNumber(value: number): string {
        if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + "B";
        if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + "M";
        if (value >= 1_000) return (value / 1_000).toFixed(2) + "K";
        return value.toFixed(2);
    }

    return (
        <div className={cn("absolute rounded-xl bg-accent text-accent-foreground h-full flex w-full mt-3 p-3 hide-scrollbar")}>
        <Table className="table-fixed">
            <TableHeader>
                <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="w-36">Wallet</TableHead>
                    <TableHead className="w-28">Type</TableHead>
                    <TableHead className="w-34">Token</TableHead>
                    <TableHead className="w-25">Amount</TableHead>
                    <TableHead className="w-29 text-right">Mcap</TableHead>
                </TableRow>
            </TableHeader>
            <Suspense fallback={
                <div>
                    <p>Loading...</p>
                </div>
            }>
                <TableBody>
                    {transactionData.length > 0 ? transactionData.map((transaction, index) => (
                        <TableRow key={index}>
                            <TableCell className="underline">{timeAgo(transaction.ts)}</TableCell>
                            <TableCell className="truncate py-4">
                                <HoverTransactionDetails transaction={transaction}>
                                    <p>{transaction.label || transaction.address.slice(0, 6) + "..." + transaction.address.slice(-4)}</p>
                                </HoverTransactionDetails>
                            </TableCell>
                            <TableCell className="truncate">{getTransactionType(transaction.tradeSideCategory)}</TableCell>
                            <TableCell className="flex gap-x-1 py-4 hover:cursor-pointer hover:underline" onClick={() => setShowCoin({
                                contract_name: transaction.tokenName,
                                contract_address: transaction.ca,
                                contract_ticker_symbol: transaction.tokenName,
                                logo_url: transaction.tokenIconUrl
                            })}>
                            <img
                            className="w-6 h-6 rounded-full"
                            src={
                                transaction.tokenIconUrl
                                ? `${import.meta.env.VITE_BOT_BASE_URL}/api/token-icon?url=${String(transaction.tokenIconUrl).slice(1)}`
                                : '/placeholder.png'
                            }
                            alt={transaction.tokenName}
                            loading="lazy"
                            />
                            <span className="truncate">{transaction.tokenName}</span>
                            </TableCell>
                            <TableCell>{currency === "inr" ? "₹ " : "$ "}{formatNumber(Number(transaction.txUsdValue) * usdtToInrRate!)}</TableCell>
                            <TableCell className="text-right">
                                {currency === "inr" ? "₹ " : "$ "}
                                {formatNumber(Number(transaction.marketCap) * usdtToInrRate!)}
                            </TableCell>
                        </TableRow>
                    )) : 
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">No Active Trades</TableCell>
                    </TableRow>
                    }
                </TableBody>
            </Suspense>
        </Table>
    </div>
    )
}
export default TransactionTable