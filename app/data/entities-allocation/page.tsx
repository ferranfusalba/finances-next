"use client";
import Pie from "@/components/data/graphics/Pie";
import useWindowDimensions from "@/hooks/use-window-dimensions";

export default function DataEntitiesAllocationLayout() {
  const windowDimensions = useWindowDimensions();

  return (
    <div className="pb-20 md:pb-12">
      Data Entities Allocation from own page
      <br />
      <Pie
        width={Number(windowDimensions.width)}
        height={Number(windowDimensions.height)}
      />
    </div>
  );
}
