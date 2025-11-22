import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type CurrencyType = "usd" | "inr";

interface CurrencyContextType {
    usdtToInrRate: number | null;
    setUsdtToInrRate: React.Dispatch<React.SetStateAction<number | null>>;
    rateUpdateTrigger: number;
    setRateUpdateTrigger: React.Dispatch<React.SetStateAction<number>>;
    currency: CurrencyType;
    setCurrency: React.Dispatch<React.SetStateAction<CurrencyType>>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
    const [usdtToInrRate, setUsdtToInrRate] = useState<number | null>(null);
    const [rateUpdateTrigger, setRateUpdateTrigger] = useState<number>(0);
    const [currency, setCurrency] = useState<CurrencyType>("usd");

    async function getUSDINRRate() {
        setUsdtToInrRate(null);
        try {
            if (currency === "usd") {
                setUsdtToInrRate(1);
                return;
            }
            const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=inr&precision=2',
            {
                method: 'GET',
                headers: {
                'Accept': 'application/json',
                },
            }
            );

            if (!response.ok) {
                setUsdtToInrRate(87);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data || !data.tether || typeof data.tether.inr !== 'number') {
                setUsdtToInrRate(87);
                throw new Error('Invalid response format from CoinGecko API');
            }

            setUsdtToInrRate(data.tether.inr);
        } catch (error) {
            setUsdtToInrRate(87);
            console.error('Error fetching USDT to INR rate:', error);
            throw new Error(`Failed to fetch USDT to INR rate: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    useEffect(() => {
        getUSDINRRate()

        const intervalId = setInterval(async () => {
            await getUSDINRRate()
        }, 30_000)

        return () => clearInterval(intervalId)

    }, [rateUpdateTrigger, currency]);

    return (
        <CurrencyContext.Provider value={{  usdtToInrRate, setUsdtToInrRate,
                                            rateUpdateTrigger, setRateUpdateTrigger,
                                            currency, setCurrency
        }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrencyContext = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error("useCurrencyContext must be used within an CurrencyProvider");
    }
    return context;
}
