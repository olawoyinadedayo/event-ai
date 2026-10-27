import type { CurrencyCode } from "@/types/database";

export interface CurrencyOption {
  code: CurrencyCode;
  symbol: string;
  label: string;
  locale: string;
}

export const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar", locale: "en-US" },
  { code: "NGN", symbol: "₦", label: "Nigerian Naira", locale: "en-NG" },
  { code: "EUR", symbol: "€", label: "Euro", locale: "en-IE" },
  { code: "GBP", symbol: "£", label: "British Pound", locale: "en-GB" },
] as const satisfies readonly CurrencyOption[];

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

const formatters = new Map<string, Intl.NumberFormat>();

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return (
    typeof value === "string" &&
    CURRENCIES.some((currency) => currency.code === value)
  );
}

export function getCurrency(code: string | null | undefined): CurrencyOption {
  return CURRENCIES.find((currency) => currency.code === code) ?? CURRENCIES[0];
}

export function formatCurrency(
  value: number,
  code: string | null | undefined,
): string {
  const currency = getCurrency(code);
  const amount = Number.isFinite(value) ? value : 0;
  const minimumFractionDigits = Number.isInteger(amount) ? 0 : 2;
  const cacheKey = `${currency.code}:${minimumFractionDigits}`;
  let formatter = formatters.get(cacheKey);

  if (!formatter) {
    formatter = new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
      minimumFractionDigits,
      maximumFractionDigits: 2,
    });
    formatters.set(cacheKey, formatter);
  }

  return formatter.format(amount);
}
