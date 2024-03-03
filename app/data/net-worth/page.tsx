"use client";
import Brush from "@/components/data/graphics/Brush";
import useWindowDimensions from "@/hooks/use-window-dimensions";

export default function DataNetWorthInceptionLayout() {
  const windowDimensions = useWindowDimensions();

  return (
    <div className="pb-20 md:pb-12">
      Data Net Worth (Inception) from own page
      <br />
      <i>(Brush graphic)</i>
      {/* TODO: Solve TS errors on AreaChart */}
      {/* <Brush
        width={Number(windowDimensions.width)}
        height={Number(windowDimensions.height)}
      /> */}
    </div>
  );
}
