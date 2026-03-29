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
      className="font-mono p-1 h-6 border-solid border-2 rounded-md inline-flex items-center"
      style={{
        borderColor: backgroundColor,
        backgroundColor: backgroundColor,
        color: textColor,
      }}
    >
      {data}
    </span>
  );
}
