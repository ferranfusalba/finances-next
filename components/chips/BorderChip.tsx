import { cn } from "@/lib/utils";

export default function BorderChip({
  data,
  borderColor,
}: {
  data: string;
  borderColor: string;
}) {
  return (
    <span
      className={cn(
        "font-mono p-1 h-6 border-solid border-2 rounded-md inline-flex items-center",
        "border-" + borderColor,
      )}
    >
      {data}
    </span>
  );
}
