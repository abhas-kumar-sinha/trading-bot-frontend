import type { Token } from "@/contexts/AppContext"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils";
import type { CurrencyType } from "@/contexts/CurrencyContext";

const SwapDetails = ({swapToken, side, amountToSell, setAmountToSell, rate, currency }: {swapToken: Token, side: "from" | "to", amountToSell: string, setAmountToSell: React.Dispatch<React.SetStateAction<string>>, rate: number, currency: CurrencyType}) => {
        
    const handleUseMax = () => {

        if (swapToken.balance < 0.0001) {
            setAmountToSell("0");
            return;
        }

        setAmountToSell(swapToken.balance.toString());
    }

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(swapToken.contract_address);
    }
    
    return (
        <div className="w-full border border-border rounded-xl h-23.5 bg-background py-2 px-3">
            <div className="flex items-center justify-between text-xs">
                <p>{side === "from" ? "PAY" : "RECEIVE"}</p>
                {side === "from" && <button onClick={handleUseMax} className="text-xs text-primary underline-offset-4 hover:underline">Use Max</button>}
            </div>
            <div className="flex items-center justify-between mt-1.5 dark:text-amber-50 cursor-pointer">
                <Input
                    value={amountToSell}
                    onChange={(e) => setAmountToSell(e.target.value)}
                    disabled={side === "to"}
                    type="number"
                    className="
                    -mt-1
                    -ms-3
                    me-1
                    bg-transparent! 
                    border-none 
                    outline-none!
                    ring-0!
                    shadow-none!
                    focus:outline-none!
                    focus:ring-0!
                    focus:border-none!
                    focus:shadow-none!
                    text-3xl!
                    placeholder:text-3xl!
                    w-44
                    "
                    placeholder="0"
                />
                <div className="flex items-center gap-x-1 border border-border rounded-full py-1 px-2 cursor-pointer  w-fit">
                    <img
                        src={
                            swapToken.logo_url.includes("https://") 
                            ? swapToken.logo_url 
                            : `${import.meta.env.VITE_BOT_BASE_URL}/api/token-icon?url=${String(swapToken.logo_url).slice(1)}`}
                        className="flex items-center justify-center rounded-full bg-gray-200 text-xs w-5 h-5 flex-shrink-0"
                    />
                    <p className="w-fit">{swapToken.contract_ticker_symbol}</p>
                </div>
            </div>
            <div className="flex items-center justify-between text-xs mt-1.5">
                <p>{currency === "inr" ? "₹" : "$"} {(Number(amountToSell) * swapToken.quote_rate * rate).toFixed(3)}</p>
                {side === "from" ? <p className={cn(Number(amountToSell) > swapToken.balance ? "text-red-500" : "")}>{parseFloat(swapToken.balance.toFixed(7))}</p> : <p onClick={handleCopyAddress} className="text-xs text-foreground underline-offset-4 hover:underline cursor-pointer ms-auto w-fit">{(swapToken.contract_address).slice(0, 4) + "..." + (swapToken.contract_address).slice(-4)}</p>}
            </div>
            
        </div>
    )
}
export default SwapDetails