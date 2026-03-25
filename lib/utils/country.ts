import countriesUn from "@/statics/countries-un.json";
import countriesMissing from "@/statics/countries-missing.json";

import { Country } from "@/types/Country";

export const countries: Country[] = [
  ...(countriesUn as Country[]),
  ...(countriesMissing as Country[]),
];

const countriesByCode = new Map<string, Country>(
  countries.map((c) => [c.alpha2Code, c]),
);

export const getCountryFlag = (alpha2Code: string) => {
  return countriesByCode.get(alpha2Code)?.flag ?? "";
};

export const getCountryName = (alpha2Code: string) => {
  return countriesByCode.get(alpha2Code)?.name ?? "";
};
