import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  type ISeriesApi,
  type UTCTimestamp,
  type CandlestickSeriesOptions,
  CandlestickSeries,
  type Time,
  HistogramSeries,
  type HistogramSeriesOptions,
} from "lightweight-charts";
import { dynamicTokenData, staticTokenData } from "@/lib/TokenData";
import type { Token } from "@/contexts/AppContext";
import { useCurrencyContext } from "@/contexts/CurrencyContext";

interface CandleChartProps {
  showCoin: Partial<Token>;
  theme: string;
  rate: number | null;
  timeInterval: string;
}

const CandleChart = ({ showCoin, theme, rate, timeInterval }: CandleChartProps) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [trigger, setTrigger] = useState(0);
    const { currency } = useCurrencyContext();

    useEffect(() => {
      setTimeout(() => {
        setTrigger(prev => prev + 1);
      }, 500);
    }, [currency]);

    useEffect(() => {
      setTrigger(prev => prev + 1);
    }, [theme]);

    useEffect(() => {
        if (!chartContainerRef.current || rate == null) return;
      
        const rootStyles = getComputedStyle(document.documentElement);
        const backgroundColor = rootStyles.getPropertyValue("--background").trim();
        const textColor = rootStyles.getPropertyValue("--foreground").trim();
      
        const chart = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth,
          height: 340,
          autoSize: true,
          layout: {
            background: { type: ColorType.Solid, color: backgroundColor },
            textColor,
          },
          // <-- keep your original crosshair config exactly
          crosshair: {
            mode: CrosshairMode.Normal,
            vertLine: {
              color: "#94a3b8",
              width: 1,
              style: 1,
              visible: true,
              labelVisible: true,
            },
            horzLine: {
              color: "#94a3b8",
              width: 1,
              style: 1,
              visible: true,
              labelVisible: true,
            },
          },
          grid: {
            vertLines: {
              color: theme === "dark" ? "#ededed" : "#b3b3b3",
              style: 1,
              visible: true,
            },
            horzLines: {
              color: theme === "dark" ? "#ededed" : "#b3b3b3",
              style: 1,
              visible: true,
            },
          },
          rightPriceScale: { borderVisible: false },
          timeScale: {
            borderVisible: false,
            rightOffset: 5,
            minBarSpacing: 1,
            timeVisible: true,
            secondsVisible: true,
          },
          handleScroll: {
            mouseWheel: true,
            pressedMouseMove: true,
          },
          handleScale: {
            axisPressedMouseMove: true,
            mouseWheel: true,
            pinch: true,
          },
        });
      
        // dynamic price formatter
        const formatPriceDynamic = (price: number): string => {
          if (!isFinite(price)) return String(price);
          if (price === 0) return "0";
      
          const abs = Math.abs(price);
          let decimals: number;
      
          if (abs >= 1) {
            decimals = 2;
          } else {
            decimals = Math.ceil(-Math.log10(abs)) + 2;
            decimals = Math.min(8, Math.max(2, decimals));
          }
      
          return price.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });
        };
      
        chart.applyOptions({
          localization: {
            timeFormatter: (time: Time) => {
              if (typeof time === "number") {
                const date = new Date((time as UTCTimestamp) * 1000);
                return date.toLocaleTimeString("en-IN", {
                  timeZone: "UTC",
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });
              }
              return String(time);
            },
            priceFormatter: (price: number) => formatPriceDynamic(price),
          },
        });
      
        const series = chart.addSeries(CandlestickSeries, {
          upColor: "#26a69a",
          downColor: "#ef5350",
          wickVisible: true,
          borderVisible: false,
          priceFormat: {
            type: "price",
            precision: 8,
            minMove: Math.pow(10, -8),
          },
        } as CandlestickSeriesOptions) as ISeriesApi<"Candlestick">;

        const volumeSeries = chart.addSeries(HistogramSeries, {
          priceFormat: { type: 'volume' },
          priceScaleId: 'volume',
        } as HistogramSeriesOptions) as ISeriesApi<'Histogram'>;

        chart.priceScale("volume").applyOptions({
          scaleMargins: {
            top: 0.8,   
            bottom: 0
          },
          borderVisible: false,
        });
      
        staticTokenData(showCoin, timeInterval, rate, "candle", setIsLoading, series, volumeSeries);
        dynamicTokenData(showCoin, timeInterval, rate, "candle", series, volumeSeries);
      
        const handleResize = () => {
          if (chartContainerRef.current) {
            chart.applyOptions({ width: chartContainerRef.current.clientWidth });
          }
        };
        window.addEventListener("resize", handleResize);
      
        return () => {
          window.removeEventListener("resize", handleResize);
          chart.remove();
        };
      }, [showCoin, theme, trigger, timeInterval]);
      

    return (
        <div className="relative w-full h-full">
        {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
            <span className="text-foreground animate-pulse -mt-12">
                Loading chart...
            </span>
            </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
        </div>
    );
};

export default CandleChart;
