import currenciesOne from "@/statics/currencies-one.json";
import currenciesCrypto from "@/statics/currencies-crypto.json";
import currencyColors from "@/statics/currency-colors.json";

import { Currency } from "@/types/Currency";

export const currencies: Currency[] = [
  ...(currenciesOne as Currency[]),
  ...(currenciesCrypto as Currency[]),
].sort((a, b) => a.code.localeCompare(b.code));

export const getCurrencySymbol = (code: string): string => {
  try {
    const formatted = new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    const symbol = formatted.find((p) => p.type === "currency")?.value;
    if (symbol && symbol !== code) return symbol;
  } catch {
    // unsupported currency code (e.g. crypto)
  }
  return code;
};

const colors: Record<string, string[]> = currencyColors;

export const getCurrencyColors = (code: string): string[] | undefined => {
  return colors[code];
};

export const getCurrencyColor0 = (code: string) => {
  return colors[code]?.[0];
};

export const getCurrencyColor1 = (code: string) => {
  return colors[code]?.[1];
};
