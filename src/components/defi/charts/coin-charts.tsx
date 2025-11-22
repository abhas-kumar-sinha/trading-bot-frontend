import { ChartCandlestick, ChartLine } from "lucide-react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import LineChart from "./line-chart";
import CandleChart from "./candle-chart";
import { useAppContext } from "@/contexts/AppContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";
import { useCurrencyContext } from "@/contexts/CurrencyContext";

const CoinChart = () => {

  const { usdtToInrRate } = useCurrencyContext();
  const { showCoin } = useAppContext();
  const { theme } = useTheme();
  const [timeInterval, setTimeInterval] = useState("1m");

  return (
    <div className="border border-border rounded-xl w-full overflow-clip">
      <Tabs defaultValue="candlestick" className="h-full flex flex-col p-3 overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex items-start justify-between flex-1 pr-2">
            <p className="text-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/70 bg-clip-text text-transparent">
              {showCoin.contract_name}
            </p>
            <TabsList className="mb-2">
              <TabsTrigger value="candlestick"><ChartCandlestick /></TabsTrigger>
              <TabsTrigger value="line"><ChartLine /></TabsTrigger>
            </TabsList>
          </div>
          <Tabs defaultValue={timeInterval} onValueChange={(val) => setTimeInterval(val)}>
            <TabsList>
              <TabsTrigger value="1m">1m</TabsTrigger>
              <TabsTrigger value="30m">30m</TabsTrigger>
              <TabsTrigger value="1h">1h</TabsTrigger>
              <TabsTrigger value="12h">12h</TabsTrigger>
              <TabsTrigger value="1d">1d</TabsTrigger>
              <TabsTrigger value="1w">1w</TabsTrigger>
              <TabsTrigger value="1M">1M</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <TabsContent value="line" className="h-80">
            <LineChart showCoin={showCoin} theme={theme} rate={usdtToInrRate} timeInterval={timeInterval} />
        </TabsContent>
        <TabsContent value="candlestick" className="h-80">
            <CandleChart showCoin={showCoin} theme={theme} rate={usdtToInrRate} timeInterval={timeInterval} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
export default CoinChart