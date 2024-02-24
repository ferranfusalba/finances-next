"use client";
import Pie from "@/components/data/graphics/Pie";
import useWindowDimensions from "@/hooks/use-window-dimensions";

export default function DataAssetAllocationLayout() {
  const windowDimensions = useWindowDimensions();

  return (
    <>
      Data Asset Allocation from own page
      <br />
      <Pie
        width={Number(windowDimensions.width)}
        height={Number(windowDimensions.height)}
      />
    </>
  );
}
