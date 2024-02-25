"use client";
import BarGroup from "@/components/data/graphics/BarGroup";
import useWindowDimensions from "@/hooks/use-window-dimensions";

export default function DataIncomeExpensesInceptionLayout() {
  const windowDimensions = useWindowDimensions();

  return (
    <div className="pb-20 md:pb-12">
      Data Income v. Expenses (Inception) from own page
      <br />
      <BarGroup
        width={Number(windowDimensions.width)}
        height={Number(windowDimensions.height)}
      />
    </div>
  );
}
