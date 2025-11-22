import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useState, useEffect } from 'react';
import { useAppContext } from "@/contexts/AppContext";
import axios from "axios";
import { useCurrencyContext } from "@/contexts/CurrencyContext";
import TransactionTable, { type SmartMoneyTransaction } from "./transactionTable";

const PortfolioTransactions = () => {
    const [activeTransactionData, setActiveTransactionData] = useState<SmartMoneyTransaction[] | []>([]);
    const [closedTransactionData, setClosedTransactionData] = useState<SmartMoneyTransaction[] | []>([]);
    const { walletBalance,  } = useAppContext();
    const { usdtToInrRate } = useCurrencyContext();

    const fetchActiveTransactionData = async () => {
        const transactions = await axios.get(`${import.meta.env.VITE_BOT_BASE_URL}/api/kol`);
        setActiveTransactionData(transactions.data.data);
    }

    const fetchClosedTransactionData = async () => {
        const transactions = await axios.get(`${import.meta.env.VITE_BOT_BASE_URL}/api/smart-money`);
        setClosedTransactionData(transactions.data.data);
    }

    useEffect(() => {
        fetchActiveTransactionData()
        fetchClosedTransactionData()

        const interval = setInterval(() => {
            fetchActiveTransactionData();
            fetchClosedTransactionData();
        }, 6500);

        return () => {
            clearInterval(interval);
        };
    }, [walletBalance, usdtToInrRate])

    return (
        <div className="border border-border rounded-xl w-full flex flex-col p-3 relative bg-background">
            <Tabs defaultValue="active" className="h-full">
                <div className="flex items-start justify-between">
                    <p className="text-3xl bg-gradient-to-br from-primary via-primary/80 to-primary/70 bg-clip-text text-transparent">Portfolio Standings</p>
                    <TabsList>
                        <TabsTrigger value="active"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="bn-svg" width="16" height="16"><path d="M11.293 1.394a1 1 0 011.414 0L15.314 4H19a1 1 0 011 1v3.687l2.607 2.606a1 1 0 010 1.414L20 15.314V19c0 .552-.448 1-1 1h-3.686l-2.607 2.607a1 1 0 01-1.414 0L8.687 20H5a1 1 0 01-1-1v-3.686l-2.606-2.607a1 1 0 010-1.414L4 8.687V5a1 1 0 011-1h3.687l2.606-2.606zm4.844 7.97a.9.9 0 00-1.274 0L11 13.227l-1.863-1.863-.068-.062a.9.9 0 00-1.267 1.267l.062.068 2.5 2.5a.901.901 0 001.273 0l4.5-4.5a.901.901 0 000-1.273z" fill="currentColor"></path></svg>Active</TabsTrigger>
                        <TabsTrigger value="closed"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="bn-svg" width="16" height="16"><path fill-rule="evenodd" clip-rule="evenodd" d="M4 8.5A4.5 4.5 0 018.5 4H20v16H8.5A4.5 4.5 0 014 15.5v-7zM8.5 7H17v3H8.5a1.5 1.5 0 110-3zm4.5 6h4v4h-4v-4z" fill="currentColor"></path></svg>Closed</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="active" className="h-full">
                    <TransactionTable transactionData={activeTransactionData} />
                </TabsContent>

                <TabsContent value="closed" className="h-full">
                    <TransactionTable transactionData={closedTransactionData} />
                </TabsContent>

            </Tabs>
        </div>
    )
}
export default PortfolioTransactions