"use client";

import BarGroup from "@/components/data/graphics/BarGroup";
import Layout02b from "@/components/layouts/Layout02b";

import useWindowDimensions from "@/hooks/use-window-dimensions";

export default function DataIncomeExpensesYearLayout() {
  const windowDimensions = useWindowDimensions();

  return (
    <Layout02b>
      Data Income v. Expenses (year) from own page
      <br />
      <BarGroup
        width={Number(windowDimensions.width)}
        height={Number(windowDimensions.height)}
      />
    </Layout02b>
  );
}
