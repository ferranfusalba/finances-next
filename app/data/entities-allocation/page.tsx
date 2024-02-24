"use client";
import Pie from "@/components/data/graphics/Pie";
import useWindowDimensions from "@/hooks/use-window-dimensions";

export default function DataEntitiesAllocationLayout() {
  const windowDimensions = useWindowDimensions();

  return (
    <>
      Data Entities Allocation from own page
      <br />
      <Pie
        width={Number(windowDimensions.width)}
        height={Number(windowDimensions.height)}
      />
    </>
  );
}
