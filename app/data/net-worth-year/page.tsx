"use client";

import AreaClosed from "@/components/data/graphics/AreaClosed";

import useWindowDimensions from "@/hooks/use-window-dimensions";

export default function DataNetWorthYearLayout() {
  const windowDimensions = useWindowDimensions();

  return (
    <div className="pb-24 md:pb-20">
      Data Net Worth (year) from own page
      <br />
      <AreaClosed
        width={Number(windowDimensions.width)}
        height={Number(windowDimensions.height)}
      />
    </div>
  );
}
