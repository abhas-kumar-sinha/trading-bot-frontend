import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";

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
    walletBalance: number | null;
    setWalletBalance: React.Dispatch<React.SetStateAction<number | null>>;
    address: string | null;
    setAddress: React.Dispatch<React.SetStateAction<string | null>>;
    tokens: Token[];
    setTokens: React.Dispatch<React.SetStateAction<Token[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [showCoin, setShowCoin] = useState<Partial<Token>>({
        contract_name: "Binance Coin",
        contract_address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        contract_ticker_symbol: "BNB",
        logo_url: "https://cdn.moralis.io/bsc/0x.png"
    });
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [tokens, setTokens] = useState<Token[]>([]);

    useEffect(() => {
        const prev_address = localStorage.getItem("address");

        if (prev_address) {
            setAddress(prev_address)
        }
    }, [])

    return (
        <AppContext.Provider value={{   showCoin, setShowCoin, 
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
