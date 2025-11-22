import { ChevronDown } from "lucide-react"
import type { SwapToken } from "./portfolio-card"
import { Skeleton } from "@/components/ui/skeleton"

const SwapDetails = ({swapToken, usdtToInrRate, loading}: {swapToken: SwapToken, usdtToInrRate: number, loading: boolean}) => {
    
    if (loading) {
        return (
            <div className="w-full border border-border rounded-xl h-23.5 bg-background py-2 px-3">
                <div className="flex items-center justify-between text-xs">
                    <Skeleton className="h-[16px] w-[100px]" />
                    <Skeleton className="h-[16px] w-[100px]" />
                </div>
                <div className="flex items-center justify-between text-2xl mt-2.5">
                    <Skeleton className="h-[26px] w-[100px]" />
                    <Skeleton className="h-[26px] w-[100px]" />
                </div>
                <div className="flex items-center justify-between text-xs mt-2.5">
                    <Skeleton className="h-[16px] w-[100px]" />
                    <Skeleton className="h-[16px] w-[100px]" />
                </div>
            </div>
        )
    }
    
    return (
        <div className="w-full border border-border rounded-xl h-23.5 bg-background py-2 px-3">
            <div className="flex items-center justify-between text-xs">
                <p>PAY</p>
                <button className="text-xs text-primary underline-offset-4 hover:underline">Use Max</button>
            </div>
            <div className="flex items-center justify-between mt-1.5 dark:text-amber-50 cursor-pointer">
                <p className="text-2xl">₹{Math.round((swapToken.from.balance * usdtToInrRate!) * 100) / 100}</p>
                <div className="flex items-center gap-x-1 border border-border rounded-full py-1 px-2">
                    <img
                        src={
                            swapToken.from.logo_url!.includes("https://") 
                            ? swapToken.from.logo_url 
                            : `${import.meta.env.VITE_BOT_BASE_URL}/api/token-icon?url=${String(swapToken.from.logo_url).slice(1)}`}
                        className="flex items-center justify-center rounded-full bg-gray-200 text-xs w-5 h-5 flex-shrink-0"
                    />
                    <p>{swapToken.from.contract_ticker_symbol}</p>
                    <ChevronDown size={12} />
                </div>
            </div>
            <div className="flex items-center justify-between text-xs mt-1.5">
                <p>Balance</p>
                <p>{swapToken.from.balance}</p>
            </div>
        </div>
    )
}
export default SwapDetails