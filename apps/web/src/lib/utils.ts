import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Truncate toward zero — never round up or down. */
export function truncateToDecimals(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.trunc(value * factor) / factor;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Display a monetary amount: currency format, 2 decimal places, truncated. */
export function formatCurrency(amount: number): string {
  return currencyFormatter.format(truncateToDecimals(amount, 2));
}

/** @deprecated Use formatCurrency — same behavior (currency, 2dp, truncated). */
export function formatCurrencyExact(amount: number): string {
  return formatCurrency(amount);
}

export function parseCurrencyInput(value: string): number | null {
  const cleaned = value.replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  const n = parseFloat(cleaned);
  if (Number.isNaN(n)) return null;
  return truncateToDecimals(n, 2);
}

export function formatCurrencyInputValue(amount: number | null | undefined): string {
  return amount != null ? formatCurrency(amount) : "";
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatPercentExact(value: number): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 10,
  }).format(value);
  return `${formatted}%`;
}

export function formatPercentTwoDecimals(value: number): string {
  const truncated = truncateToDecimals(value, 2);
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(truncated);
  return `${formatted}%`;
}

export function truncatePercentTwoDecimals(value: number): number {
  return truncateToDecimals(value, 2);
}

/** @deprecated Use truncatePercentTwoDecimals */
export function roundPercentTwoDecimals(value: number): number {
  return truncatePercentTwoDecimals(value);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
