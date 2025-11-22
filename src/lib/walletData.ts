import type { ISeriesApi } from "lightweight-charts";

export interface WalletBalance {
  timestamp: number; // ms
  profitLoss: number;
}

/**
 * Convert raw wallet balance points into 5-minute buckets and set to series.
 * @param series lightweight-charts series (Line)
 * @param rawData array of WalletBalance objects (timestamp in ms)
 */
export const set1DayBucketedWalletBalance = (
  series: ISeriesApi<'Line'>,
  rawData: WalletBalance[],
) => {
  const BUCKET_MS = 1 * 24 * 60 * 60 * 1000; // 1 day in ms

  // Aggregate into buckets: key -> { sum }
  const buckets = new Map<number, { sum: number }>();

  for (const p of rawData) {
    if (typeof p.timestamp !== 'number' || Number.isNaN(p.profitLoss)) continue;

    const bucketStartMs = Math.floor(p.timestamp / BUCKET_MS) * BUCKET_MS;

    const entry = buckets.get(bucketStartMs);
    if (entry) {
      entry.sum += p.profitLoss;
    } else {
      buckets.set(bucketStartMs, { sum: p.profitLoss });
    }
  }

  // Sort buckets
  const entries = Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]);

  // Build chart data with cumulative running balance
  let runningValue = 1000; // initial wallet value

  const sorted = entries.map(([bucketStartMs, { sum }]) => {
    runningValue += 3 * sum; // include previous bucket + multiplier

    return {
      time: new Date(bucketStartMs).toISOString().split("T")[0],
      value: runningValue,
    };
  });
    series.setData(sorted);
  };

export const getWalletBalance = async (series: ISeriesApi<'Line'>) => {
    await fetch(`${import.meta.env.VITE_BOT_BASE_URL}/api/wallet-balance`)
    .then(res => res.json())
    .then((json: { data: WalletBalance[] }) => {
        set1DayBucketedWalletBalance(series, json.data);
    });

}