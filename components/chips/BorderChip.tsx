export default function BorderChip({
  data,
  borderColor,
}: {
  data: string;
  borderColor: string;
}) {
  return (
    <span
      className="font-mono p-1 h-6 border-solid border-2 rounded-md inline-flex items-center"
      style={{ borderColor }}
    >
      {data}
    </span>
  );
}
