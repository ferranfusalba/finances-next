export interface Currency {
  code: string;
  name: string;
  numericCode: string | null;
  type: string;
  minorUnit: number | null;
  countries?: string[];
}
