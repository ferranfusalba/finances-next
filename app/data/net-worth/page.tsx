"use client";
import Brush from "@/components/data/graphics/Brush";
import Layout02b from "@/components/layouts/Layout02b";
import useWindowDimensions from "@/hooks/use-window-dimensions";

export default function DataNetWorthInceptionLayout() {
  const windowDimensions = useWindowDimensions();

  return (
    <Layout02b>
      Data Net Worth (Inception) from own page
      <br />
      <i>(Brush graphic)</i>
      {/* TODO: Solve TS errors on AreaChart */}
      {/* <Brush
        width={Number(windowDimensions.width)}
        height={Number(windowDimensions.height)}
      /> */}
    </Layout02b>
  );
}
