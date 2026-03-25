import { getCurrencyColor0, getCurrencyColor1 } from "@/lib/utils/currency";
import BackgroundChip from "./BackgroundChip";

export default function CurrencyTag({ code }: { code: string }) {
  const color0 = getCurrencyColor0(code) ?? "";
  const color1 = getCurrencyColor1(code) ?? "";

  return <BackgroundChip data={code} backgroundColor={color0} textColor={color1} />;
}
