export interface Country {
  flag: string;
  alpha2Code: string;
  alpha3Code: string;
  name: string;
  fullName?: string;
  timezones?: {
    id: string;
    name: string;
    offset: string;
  }[];
  currencies?: {
    code: string;
    name: string;
    symbol: string;
  }[];
}
