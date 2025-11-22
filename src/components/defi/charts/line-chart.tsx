import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CrosshairMode, LineSeries, type UTCTimestamp, type Time, type ISeriesApi, HistogramSeries, type HistogramSeriesOptions } from "lightweight-charts";
import { dynamicTokenData, staticTokenData } from "@/lib/TokenData";
import type { Token } from "@/contexts/AppContext";
import { useCurrencyContext } from "@/contexts/CurrencyContext";

interface LineChartProps {
    showCoin: Partial<Token>;
    theme: string;
    rate: number | null;
    timeInterval: string;
}

const LineChart = ({ showCoin, theme, rate, timeInterval }: LineChartProps) => {
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
        
    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = rootStyles.getPropertyValue("--primary").trim();
    const backgroundColor = rootStyles.getPropertyValue("--background").trim();
    const foregroundColor = rootStyles.getPropertyValue("--foreground").trim();

    useEffect(() => {
        if (!chartContainerRef.current || rate == null) return;
      
        const chart = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth,
          height: 340,
          layout: {
            background: { type: ColorType.Solid, color: backgroundColor },
            textColor: foregroundColor,
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
          crosshair: {
            mode: CrosshairMode.Normal,
            vertLine: { color: "#94a3b8", width: 1, style: 1, visible: true, labelVisible: true },
            horzLine: { color: "#94a3b8", width: 1, style: 1, visible: true, labelVisible: true },
          },
          rightPriceScale: { borderVisible: false },
          timeScale: {
            borderVisible: false,
            rightOffset: 12,
            minBarSpacing: 10,
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
      
        // Dynamic price formatting helper (adapts decimals to magnitude)
        const computeDecimalsFromPrice = (price: number) => {
          if (!isFinite(price) || price === 0) return 2;
          const abs = Math.abs(price);
          if (abs >= 1) return 2;
          const decimals = Math.ceil(-Math.log10(abs)) + 2;
          return Math.min(8, Math.max(2, decimals)); // clamp between 2 and 8
        };
      
        const formatPriceDynamic = (price: number) => {
          if (!isFinite(price)) return String(price);
          if (price === 0) return "0";
          const decimals = computeDecimalsFromPrice(price);
          return price.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });
        };
      
        chart.applyOptions({
          localization: {
            timeFormatter: (time: Time): string => {
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
      
        // create line series with a safe high precision initially
        const lineSeries = chart.addSeries(LineSeries, {
          color: primaryColor,
          lineWidth: 2,
          priceFormat: {
            type: "price",
            precision: 8, // allow decimals down to 1e-8 initially
            minMove: Math.pow(10, -8),
          },
        }) as ISeriesApi<"Line">;

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
              
        const lastPriceRef = { value: null as number | null };
        const adjustSeriesPrecisionIfNeeded = () => {
          const last = lastPriceRef?.value ?? null;
          if (last != null && isFinite(last)) {
            const precision = computeDecimalsFromPrice(last);
            lineSeries.applyOptions({
              priceFormat: {
                type: "price",
                precision,
                minMove: Math.pow(10, -precision),
              },
            });
          }
        };
      
        // load data (these may set lastPriceRef.value)
        staticTokenData(showCoin, timeInterval, rate, "line", setIsLoading, lineSeries, volumeSeries, lastPriceRef);
        dynamicTokenData(showCoin, timeInterval, rate, "line", lineSeries, volumeSeries, lastPriceRef);
      
        // try to adjust right away (in case staticTokenData set lastPriceRef synchronously)
        adjustSeriesPrecisionIfNeeded();
      
        // also poll once after a short delay to catch async fills
        const adjustTimeout = window.setTimeout(adjustSeriesPrecisionIfNeeded, 500);
      
        const handleResize = () => {
          if (chartContainerRef.current) {
            chart.applyOptions({ width: chartContainerRef.current.clientWidth });
          }
        };
        window.addEventListener("resize", handleResize);
      
        return () => {
          window.removeEventListener("resize", handleResize);
          clearTimeout(adjustTimeout);
          chart.remove();
        };
      }, [primaryColor, backgroundColor, foregroundColor, showCoin, theme, trigger, timeInterval]);
      
    return (
        <div className="relative w-full h-full">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-10">
                    <span className="text-foreground animate-pulse -mt-12">Loading chart...</span>
                </div>
            )}
            <div ref={chartContainerRef} className="w-full h-full" />
        </div>
    );
};

export default LineChart;
