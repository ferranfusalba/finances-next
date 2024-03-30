"use client";

import Pie from "@/components/data/graphics/Pie";
import Layout02b from "@/components/layouts/Layout02b";

import useWindowDimensions from "@/hooks/use-window-dimensions";

export default function DataAssetAllocationLayout() {
  const windowDimensions = useWindowDimensions();

  return (
    <Layout02b>
      Data Asset Allocation from own page
      <br />
      <Pie
        width={Number(windowDimensions.width)}
        height={Number(windowDimensions.height)}
      />
    </Layout02b>
  );
}
