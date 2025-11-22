import React, { createContext, useContext, useState, useRef, useEffect, type ReactNode } from "react";

export interface Token {
    contract_name: string;
    contract_address: string;
    contract_ticker_symbol: string;
    balance: number;
    quote: number;
    quote_rate: number;
    quote_rate_24h: number;
    is_spam: boolean;
    logo_url: string;
}

interface AppContextType {
    showCoin: Partial<Token>;
    setShowCoin: React.Dispatch<React.SetStateAction<Partial<Token>>>;
    latestCoinPrice: LatestCoinPrice;
    walletBalance: number | null;
    setWalletBalance: React.Dispatch<React.SetStateAction<number | null>>;
    address: string | null;
    setAddress: React.Dispatch<React.SetStateAction<string | null>>;
    tokens: Token[];
    setTokens: React.Dispatch<React.SetStateAction<Token[]>>;
}

interface LatestCoinPrice {
    btc: number | null;
    eth: number | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [showCoin, setShowCoin] = useState<Partial<Token>>({
        contract_name: "Binance Coin",
        contract_address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        contract_ticker_symbol: "BNB",
        logo_url: "https://cdn.moralis.io/bsc/0x.png"
    });
    const [latestCoinPrice, setLatestCoinPrice] = useState<LatestCoinPrice>({ btc: null, eth: null });
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [tokens, setTokens] = useState<Token[]>([]);

    // Keep a ref to avoid stale closure in websocket event
    const latestCoinPriceRef = useRef(latestCoinPrice);
    latestCoinPriceRef.current = latestCoinPrice;

    useEffect(() => {
        const prev_address = localStorage.getItem("address");

        if (prev_address) {
            setAddress(prev_address)
        }
    }, [])

    useEffect(() => {
        const ws = new WebSocket(
            "wss://stream.binance.com:9443/stream?streams=btcusdt@trade/ethusdt@trade"
        );

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data?.stream && data?.data?.p) {
                    const symbol = data.data.s;
                    const price = parseFloat(data.data.p);
                    setLatestCoinPrice(prev => {
                        if (symbol === "BTCUSDT") {
                            return { ...prev, btc: price };
                        } else if (symbol === "ETHUSDT") {
                            return { ...prev, eth: price };
                        }
                        return prev;
                    });
                }
            } catch (_) {
                // Optionally handle error
            }
        };

        return () => {
            ws.close();
        };
    }, []);

    return (
        <AppContext.Provider value={{   showCoin, setShowCoin, 
                                        latestCoinPrice, 
                                        walletBalance, setWalletBalance, 
                                        address, setAddress,
                                        tokens, setTokens
                                    }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useAppContext must be used within an AppProvider");
    }
    return context;
}
