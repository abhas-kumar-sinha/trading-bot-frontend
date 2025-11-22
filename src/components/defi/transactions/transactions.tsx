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

const Transactions = () => {
    const [kolTransactionData, setKolTransactionData] = useState<SmartMoneyTransaction[] | []>([]);
    const [smartTransactionData, setSmartTransactionData] = useState<SmartMoneyTransaction[] | []>([]);
    const [followingTransactionData, setFollowingTransactionData] = useState<SmartMoneyTransaction[] | []>([]);
    const { walletBalance,  } = useAppContext();
    const { usdtToInrRate } = useCurrencyContext();

    const fetchKolTransactionData = async () => {
        const transactions = await axios.get(`${import.meta.env.VITE_BOT_BASE_URL}/api/kol`);
        setKolTransactionData(transactions.data.data);
    }

    const fetchSmartTransactionData = async () => {
        const transactions = await axios.get(`${import.meta.env.VITE_BOT_BASE_URL}/api/smart-money`);
        setSmartTransactionData(transactions.data.data);
    }

    const fetchFollowingTransactionData = async () => {
        const transactions = await axios.get(`${import.meta.env.VITE_BOT_BASE_URL}/api/following`);
        if (transactions.data.data.length > 0) {
            setFollowingTransactionData(transactions.data.data);
        }
    }

    useEffect(() => {
        fetchKolTransactionData()
        fetchSmartTransactionData()
        fetchFollowingTransactionData()

        const interval = setInterval(() => {
            fetchKolTransactionData();
            fetchSmartTransactionData();
        }, 6500);

        const followingInterval = setInterval(() => {
            fetchFollowingTransactionData();
        }, 3500);

        return () => {
            clearInterval(interval);
            clearInterval(followingInterval);
        };
    }, [walletBalance, usdtToInrRate])

    return (
        <div className="border border-border rounded-xl w-[68.5%] flex flex-col p-3 relative bg-background">
            <Tabs defaultValue="following" className="h-full">
                <div className="flex items-start justify-between">
                    <p className="text-3xl bg-gradient-to-br from-primary via-primary/80 to-primary/70 bg-clip-text text-transparent">Transactions</p>
                    <TabsList>
                        <TabsTrigger value="kol"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="bn-svg" width="16" height="16"><path d="M11.293 1.394a1 1 0 011.414 0L15.314 4H19a1 1 0 011 1v3.687l2.607 2.606a1 1 0 010 1.414L20 15.314V19c0 .552-.448 1-1 1h-3.686l-2.607 2.607a1 1 0 01-1.414 0L8.687 20H5a1 1 0 01-1-1v-3.686l-2.606-2.607a1 1 0 010-1.414L4 8.687V5a1 1 0 011-1h3.687l2.606-2.606zm4.844 7.97a.9.9 0 00-1.274 0L11 13.227l-1.863-1.863-.068-.062a.9.9 0 00-1.267 1.267l.062.068 2.5 2.5a.901.901 0 001.273 0l4.5-4.5a.901.901 0 000-1.273z" fill="currentColor"></path></svg>KOL</TabsTrigger>
                        <TabsTrigger value="smart"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="bn-svg" width="16" height="16"><path fill-rule="evenodd" clip-rule="evenodd" d="M4 8.5A4.5 4.5 0 018.5 4H20v16H8.5A4.5 4.5 0 014 15.5v-7zM8.5 7H17v3H8.5a1.5 1.5 0 110-3zm4.5 6h4v4h-4v-4z" fill="currentColor"></path></svg>Smart</TabsTrigger>
                        <TabsTrigger value="following"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="bn-svg" width="16" height="16"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.652 5.474a4.89 4.89 0 016.916 6.916L12 19.958 4.432 12.39a4.89 4.89 0 116.916-6.916l.652.652.652-.652z" fill="currentColor"></path></svg>Following</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="kol" className="h-full">
                    <TransactionTable transactionData={kolTransactionData} />
                </TabsContent>

                <TabsContent value="smart" className="h-full">
                    <TransactionTable transactionData={smartTransactionData} />
                </TabsContent>

                <TabsContent value="following" className="h-full">
                    <TransactionTable transactionData={followingTransactionData} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
export default Transactions