import currencies_code from "@/statics/currencies_code.json";

const currenciesCode: {
  [k: string]: {
    symbol: string;
    name: string;
    symbol_native: string;
    decimal_digits: number;
    rounding: number;
    code: string;
    name_plural: string;
    color0?: string;
    color1?: string;
  };
} = currencies_code;

export const getCurrencyColor0 = (alpha2Code: string) => {
  return currenciesCode[alpha2Code]["color0"];
};

export const getCurrencyColor1 = (alpha2Code: string) => {
  return currenciesCode[alpha2Code]["color1"];
};
