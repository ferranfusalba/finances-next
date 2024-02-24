"use client";
import AreaClosed from "@/components/data/graphics/AreaClosed/AreaClosed";
import useWindowDimensions from "@/hooks/use-window-dimensions";

export default function DataGlobalLayout() {
  const windowDimensions = useWindowDimensions();

  return (
    <>
      Data Asset Allocation from own page
      <br />
      <AreaClosed
        width={Number(windowDimensions.width)}
        height={Number(windowDimensions.height)}
      />
    </>
  );
}
