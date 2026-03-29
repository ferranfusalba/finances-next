import { getCurrencyColors } from "@/lib/utils/currency";
import BackgroundChip from "./BackgroundChip";

export default function CurrencyTag({ code }: { code: string }) {
  const colors = getCurrencyColors(code);
  if (!colors || colors.length < 2) return null;

  return <BackgroundChip data={code} backgroundColor={colors[0]} textColor={colors[1]} />;
}
