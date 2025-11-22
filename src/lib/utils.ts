import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(ts: number): string {
  const now = Date.now(); // current time in milliseconds
  const diffSec = Math.floor((now - ts * 1000) / 1000); // difference in seconds

  if (diffSec < 60) return `${diffSec}s`; // seconds
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`; // minutes
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`; // hours
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d`; // days
}