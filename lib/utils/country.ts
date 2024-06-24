import countries_code from "@/statics/countries_code.json";

const countriesCode: {
  [k: string]: {
    name: string;
    "alpha-2": string;
    "emoji-flag": string;
  };
} = countries_code;

export const getCountryFlag = (alpha2Code: string) => {
  return countriesCode[alpha2Code]["emoji-flag"];
};

export const getCountryName = (alpha2Code: string) => {
  return countriesCode[alpha2Code]["name"];
};
