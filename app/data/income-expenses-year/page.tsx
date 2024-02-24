"use client";
import BarGroup from "@/components/data/graphics/BarGroup";
import useWindowDimensions from "@/hooks/use-window-dimensions";

export default function DataIncomeExpensesYearLayout() {
  const windowDimensions = useWindowDimensions();

  return (
    <>
      Data Income v. Expenses (year) from own page
      <br />
      <BarGroup
        width={Number(windowDimensions.width)}
        height={Number(windowDimensions.height)}
      />
    </>
  );
}
