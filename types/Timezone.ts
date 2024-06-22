export interface Timezone {
  id: number;
  value: string;
  abbr: string;
  offset: number;
  isdst: boolean;
  text: string;
  utc: Array<string>;
}
