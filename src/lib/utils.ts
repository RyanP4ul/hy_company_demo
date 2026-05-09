import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with ₱ peso sign, thousands separators and fixed decimals.
 * Uses manual formatting to avoid any locale-dependent currency symbols (e.g. $).
 */
export function formatPeso(
  amount: number | undefined | null,
  minDecimals?: number,
  maxDecimals?: number,
): string {
  const val = amount ?? 0;
  return `₱${val.toLocaleString(undefined, {
    minimumFractionDigits: minDecimals ?? 2,
    maximumFractionDigits: maxDecimals ?? 2,
  })}`;
}

/**
 * Format a number with thousands separators and fixed decimals (no currency symbol).
 */
export function formatNumber(
  value: number,
  minDecimals = 2,
  maxDecimals = 2,
): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });
}
