import { cn } from "@/lib/utils";

export default function BackgroundChip({
  data,
  backgroundColor,
  textColor,
}: {
  data: string;
  backgroundColor: string;
  textColor: string;
}) {
  return (
    <span
      className={cn(
        "font-mono p-1 rounded-md",
        "bg-" + backgroundColor,
        "text-" + textColor
      )}
    >
      {data}
    </span>
  );
}
