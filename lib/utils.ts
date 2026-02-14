import { type ClassValue, clsx } from "clsx";
import { Prisma } from "@prisma/client";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const currency = (locale: string, currency: string) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  });

export function toNumber(
  value: Prisma.Decimal | number | null | undefined
): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return value.toNumber();
}
