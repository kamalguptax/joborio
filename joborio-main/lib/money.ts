export const CURRENCIES = [
  { code: "USD", label: "US Dollar ($)", symbol: "$" },
  { code: "INR", label: "Indian Rupee (₹)", symbol: "₹" },
  { code: "EUR", label: "Euro (€)", symbol: "€" },
  { code: "GBP", label: "British Pound (£)", symbol: "£" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export function isCurrencyCode(value: string): value is CurrencyCode {
  return CURRENCIES.some((item) => item.code === value);
}

export function currencySymbol(code?: string | null): string {
  return CURRENCIES.find((item) => item.code === code)?.symbol ?? "$";
}

export function formatMoney(
  amount: number,
  code?: string | null,
  digits = 2,
): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return `${currencySymbol(code)}${value.toFixed(digits)}`;
}
