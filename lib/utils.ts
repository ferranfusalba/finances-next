import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const currency = (locale: string, currency: string) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  });
