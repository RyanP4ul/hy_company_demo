import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number with ₱ peso sign, thousands separators and fixed decimals.
 * Uses manual formatting to avoid any locale-dependent currency symbols (e.g. $).
 */
export function formatPeso(value: number, minDecimals = 2, maxDecimals = 2): string {
  const fixed = value.toLocaleString(undefined, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });
  return `₱${fixed}`;
}

/**
 * Format a number with thousands separators and fixed decimals (no currency symbol).
 */
export function formatNumber(value: number, minDecimals = 2, maxDecimals = 2): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });
}
