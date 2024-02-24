"use client";
import Brush from "@/components/data/graphics/Brush";
import useWindowDimensions from "@/hooks/use-window-dimensions";

export default function DataNetWorthInceptionLayout() {
  const windowDimensions = useWindowDimensions();

  return (
    <>
      Data Net Worth (Inception) from own page
      <br />
      <Brush
        width={Number(windowDimensions.width)}
        height={Number(windowDimensions.height)}
      />
    </>
  );
}
