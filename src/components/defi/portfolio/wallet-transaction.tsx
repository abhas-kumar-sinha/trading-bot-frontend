import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useAppContext } from "@/contexts/AppContext"

const WalletTransaction = () => {

    const { walletBalance } = useAppContext();
    const [openDeposit, setOpenDeposit] = useState(false);
    const [openWithdraw, setOpenWithdraw] = useState(false);
    const [rechargeAmount, setRechargeAmount] = useState<string>("");
    const [withdrawAmount, setWithdrawAmount] = useState<string>("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow digits (no decimals, no letters)
        const value = e.target.value.replace(/\D/g, "");
        setRechargeAmount(value);
    };

    const handleWithdrawChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow digits (no decimals, no letters)
        const value = e.target.value.replace(/\D/g, "");
        setWithdrawAmount(value);
    };

    return (
        <>
            <Dialog open={openDeposit} onOpenChange={setOpenDeposit}>
            <DialogTrigger className="flex-1">
                <Button variant="default" className="text-xs px-3 py-1.5 w-full">
                    Deposit
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Deposit Amount</DialogTitle>
                    <DialogDescription>
                        Enter the amount to deposit to Probo.
                    </DialogDescription>
                </DialogHeader>
                <div>
                    <p className="text-muted-foreground text-sm -mb-2">Total balance</p>
                    <p className="text-4xl mt-2 text-primary">₹ {Math.round((walletBalance || 0) * 100) / 100}</p>

                    <div className="flex flex-col gap-y-2 mt-4">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                        id="amount"
                        name="amount"
                        type="number"
                        step="1"
                        max="100"
                        className="h-12"
                        value={rechargeAmount}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (["e", "E", "+", "-", "."].includes(e.key)) {
                            e.preventDefault();
                            }}
                        }
                        />
                    </div>

                    <div className="flex w-[80%] my-4 gap-x-2">
                        <Button variant="outline" className="flex-1" onClick={() =>setRechargeAmount("10")}>+ 10</Button>
                        <Button variant="outline" className="flex-1" onClick={() =>setRechargeAmount("20")}>+ 20</Button>
                        <Button variant="outline" className="flex-1" onClick={() =>setRechargeAmount("50")}>+ 50</Button>
                        <Button variant="outline" className="flex-1" onClick={() =>setRechargeAmount("100")}>+ 100</Button>
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">
                        Recharge
                    </Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>

            <Dialog open={openWithdraw} onOpenChange={setOpenWithdraw}>
            <DialogTrigger className="flex-1">
                <Button variant="outline" className="text-xs px-3 py-1.5 w-full">
                    Pull Out
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Withdraw Amount</DialogTitle>
                    <DialogDescription>
                        Enter the amount to withdraw from Probo.
                    </DialogDescription>
                </DialogHeader>
                <div>
                    <p className="text-muted-foreground text-sm -mb-2">Total balance</p>
                    <p className="text-4xl mt-2 text-primary">₹ {Math.round((walletBalance || 0) * 100) / 100}</p>

                    <div className="flex flex-col gap-y-2 mt-4">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                        id="amount"
                        name="amount"
                        type="number"
                        step="1"
                        max={`${Math.round(walletBalance || 0)}`}
                        className="h-12"
                        value={withdrawAmount}
                        onChange={handleWithdrawChange}
                        onKeyDown={(e) => {
                            if (["e", "E", "+", "-", "."].includes(e.key)) {
                            e.preventDefault();
                            }}
                        }
                        />
                    </div>

                    <div className="flex w-[80%] my-4 gap-x-2">
                        <Button variant="outline" className="flex-1" onClick={() =>setRechargeAmount("10")}>+ 10</Button>
                        <Button variant="outline" className="flex-1" onClick={() =>setRechargeAmount("20")}>+ 20</Button>
                        <Button variant="outline" className="flex-1" onClick={() =>setRechargeAmount("50")}>+ 50</Button>
                        <Button variant="outline" className="flex-1" onClick={() =>setRechargeAmount("100")}>+ 100</Button>
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">
                        Withdraw
                    </Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>
        </>
  )
}
export default WalletTransaction