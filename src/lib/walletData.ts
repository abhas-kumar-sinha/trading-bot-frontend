import type { ISeriesApi, UTCTimestamp } from "lightweight-charts";

export interface WalletBalance {
  timestamp: number; // ms
  profitLoss: number;
}

export interface TokenDetailsApi {
  tokenDetails: {
    changeTime: string,
    currentChange: number
  }
}

/**
 * Convert raw wallet balance points into 1-day buckets and set to series.
 */
export const set1DayBucketedWalletBalance = (
  series: ISeriesApi<'Line'>,
  rawData: WalletBalance[],
) => {
  const BUCKET_MS = 1 * 24 * 60 * 60 * 1000; // 1 day in ms

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

  const entries = Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]);

  let runningValue = 1000;

  const sorted = entries.map(([bucketStartMs, { sum }]) => {
    runningValue += 3 * sum;

    return {
      time: Math.floor(bucketStartMs / 1000) as UTCTimestamp,
      value: runningValue,
    };
  });
  
  series.setData(sorted);

  const lastTimestamp = sorted.length > 0 ? sorted[sorted.length - 1].time : Math.floor(Date.now() / 1000);

  return { 
    lastAmount: runningValue,
    lastTimestamp: lastTimestamp
  };
};

export const getWalletBalance = async (
  series: ISeriesApi<'Line'>
): Promise<{ lastAmount: number; lastTimestamp: number }> => {
  const res = await fetch(`${import.meta.env.VITE_BOT_BASE_URL}/api/wallet-balance`);
  const json: { data: WalletBalance[] } = await res.json();

  return set1DayBucketedWalletBalance(series, json.data);
};

export const getRealTimeWalletUpdate = async (
  series: ISeriesApi<'Line'>, 
  lastAmount: number,
  lastTimestamp: number
) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_BOT_BASE_URL}/api/positions`);
    const json: { data: TokenDetailsApi[] } = await res.json();
    
    const allTokenDetails = json.data;

    let running = lastAmount;

    // Process all positions and calculate total change
    for (const t of allTokenDetails) {
      running += 3 * (t.tokenDetails.currentChange ?? 0);
    }

    // Calculate percentage change
    const percentageChange = Math.abs(((running - lastAmount) / lastAmount) * 100);

    console.log(`Current value: ${running}, Last value: ${lastAmount}, Change: ${percentageChange.toFixed(2)}%`);

    // Only update if price moved > -1%
    if (percentageChange > -1) {
      // Update the LAST point (same timestamp) instead of adding new point
      series.update({
        time: lastTimestamp as UTCTimestamp, // Use the SAME timestamp as last point
        value: running,
      });
      
      console.log('✅ Chart last point updated successfully - price moved > 5%');
      return { amount: running }; // Return new amount, keep same timestamp
    } else {
      console.log(`⚠️ Price change ${percentageChange.toFixed(2)}% < 5%, skipping update`);
      return { amount: lastAmount };
    }
    
  } catch (error) {
    console.error('Error fetching real-time data:', error);
    return { amount: lastAmount };
  }
};
