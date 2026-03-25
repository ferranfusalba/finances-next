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
        "font-mono p-1 h-6 border-solid border-2 rounded-md inline-flex items-center",
        "border-" + backgroundColor,
        "bg-" + backgroundColor,
        "text-" + textColor,
      )}
    >
      {data}
    </span>
  );
}
