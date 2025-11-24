import type { Token } from "@/contexts/AppContext";
import type { CandlestickData, HistogramData, UTCTimestamp, ISeriesApi, SeriesMarker, Time } from "lightweight-charts";
import { createSeriesMarkers } from "lightweight-charts";

type Kline = [
    number,   // open time (ms)
    number,   // open
    number,   // high
    number,   // low
    number,   // close
    number,   // volume
];

export interface TradePositionApi {
    entryTimestamp: number;
    entryPrice: number
    exitTimestamp?: number;
    exitPrice?:number;
}

export const staticTokenData = async (showCoin: Partial<Token>, timeInterval: string, rate: number, type: "candle" | "line", setIsLoading: (isLoading: boolean) => void, series: ISeriesApi<"Candlestick"> | ISeriesApi<"Line">, volumeSeries: ISeriesApi<'Histogram'>, lastPriceRef?: { value: number | null }) => {
    await fetch(
    `${import.meta.env.VITE_BOT_BASE_URL}/api/kline?interval=${timeInterval}&limit=500&to=${Date.now()}&platform=bsc&address=${showCoin.contract_address}`)
    .then((res) => res.json())
    .then((json: { data: { data: Kline[] } }) => {
        const klines = json.data.data;
        const IST_OFFSET_MS = 5.5 * 3600 * 1000;
        const data: CandlestickData[] = klines.map((k) => ({
        time: ((k[5] + IST_OFFSET_MS) / 1000) as UTCTimestamp,
        open: k[0] * rate,
        high: k[1] * rate,
        low: k[2] * rate,
        close: k[3] * rate,
        }));

        const getColor = (close: number, open: number) => {
            if (close > open) {
                return "rgba(38,166,154,0.32)";
            } else {
                return "rgba(239,83,80,0.32)";
            }
        };

        const volumeData: HistogramData[] = klines.map((k) => ({
            time: ((k[5] + IST_OFFSET_MS) / 1000) as UTCTimestamp,
            value: k[4],
            color: k[4] === 0 ? "rgba(148,163,184,0.32)" : getColor(k[3], k[0]),
        }));
        
        if (!data) {
            setIsLoading(false);
            return;
        }
        
        if (type === "candle") {
            series.setData(data);
        } else {
            series.setData(data.map((d) => ({time: d.time, value: d.close})));
            lastPriceRef!.value = data[data.length - 1].close;
        }
        volumeSeries.setData(volumeData);

        setIsLoading(false);

    })
    .catch(() => {
        setIsLoading(false);
    });
}

export const dynamicTokenData = async (showCoin: Partial<Token>, timeInterval: string, rate: number, type: "candle" | "line", series: ISeriesApi<"Candlestick"> | ISeriesApi<"Line">, volumeSeries: ISeriesApi<'Histogram'>, lastPriceRef?: { value: number | null }) => {
    console.log("Sintral WebSocket for ", showCoin.contract_ticker_symbol);
    const ws = new WebSocket(import.meta.env.VITE_SINTRAL_WS_URL);

    ws.onopen = () => {
        console.log("✅ Connected to Sintral WebSocket for ", showCoin.contract_ticker_symbol);      
        // PING
        ws.send(
            JSON.stringify({
            id: 1,
            method: "PING",
            params: [],
            })
        );
        
        // SUBSCRIBE to kline data
        ws.send(
            JSON.stringify({
            id: 3,
            method: "SUBSCRIPTION",
            params: ["datahub@kline@14@" + showCoin.contract_address + "@" + timeInterval],
            })
        );
    };

    ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        const d = msg.d.u; // kline payload
        const IST_OFFSET_SEC = 5.5 * 3600;
        const timeSec = toSeconds(d[5]) + IST_OFFSET_SEC;
        const candle: CandlestickData = {
            time: timeSec as UTCTimestamp,
            open: parseFloat(d[0]) * rate,
            high: parseFloat(d[1]) * rate,
            low: parseFloat(d[2]) * rate,
            close: parseFloat(d[3]) * rate,
        };

        const up = candle.close >= candle.open;
        const upColor = "rgba(38,166,154,0.32)";
        const downColor = "rgba(239,83,80,0.32)";
        const barColor = up ? upColor : downColor;

        const volumeData: HistogramData = {
            time: timeSec as UTCTimestamp,
            value: parseFloat(d[4]),
            color: parseFloat(d[4]) === 0 ? "rgba(148,163,184,0.32)" : barColor,
        };
        
        if (type === "candle") {
            series.update(candle);
        } else {
            if (lastPriceRef!.value !== null) {
                const pctChange = Math.abs((candle.close - lastPriceRef!.value)/lastPriceRef!.value * 100);
                if (pctChange < 0.01) {
                    return;
                }
            }
            series.update({time: candle.time, value: candle.close});
            lastPriceRef!.value = candle.close;
        }
        volumeSeries.update(volumeData);
    };
}

function toSeconds(raw: number | string): number {
    const s = String(raw);
    if (s.length === 10) return Number(s);             // already seconds
    if (s.length === 13) return Math.floor(Number(s) / 1000); // ms → sec
    if (s.length > 13) return Math.floor(Number(s.slice(0, 13)) / 1000); // micro/nano → sec
    return Math.floor(Number(s));
}

export const getTokenMarkers = async (
  showCoin: Partial<Token>,
  series: ISeriesApi<"Candlestick">
) => {
  if (!showCoin.contract_address) {
    console.warn("getTokenMarkers called without contract_address");
    return;
  }

  try {
    const res = await fetch(
      `${import.meta.env.VITE_BOT_BASE_URL}/api/token/${showCoin.contract_address}/token-position`
    );
    const json = await res.json();

    const allPositions = (json.data.slice(-5) || []) as TradePositionApi[];

    const markers: SeriesMarker<Time>[] = [];

    const IST_OFFSET_SEC = 5.5 * 3600

    for (const pos of allPositions) {
        if (pos.entryTimestamp && pos.entryPrice) { 
        const time = (toSeconds(pos.entryTimestamp) + IST_OFFSET_SEC) as UTCTimestamp;

        markers.push({
            time,
            position: "belowBar",
            shape: "arrowUp",
            color: "rgba(80, 200, 185, 0.9)",
            text: "🅱",
        });
        }

        if (pos.exitTimestamp && pos.exitPrice) {
        const time = (toSeconds(pos.exitTimestamp) + IST_OFFSET_SEC) as UTCTimestamp;

        markers.push({
            time,
            position: "aboveBar",
            shape: "arrowDown",
            color: "rgba(250, 120, 120, 0.9)",
            text: "🆂",
        });
        }
    }

    // Attach markers plugin (Binance-style arrows on candles)
    const markersApi = createSeriesMarkers(series, markers);

    // optional: return markersApi if you ever want to update/remove later
    return markersApi;
  } catch (err) {
    console.log("Failed to fetch token markers", err);
  }
};
