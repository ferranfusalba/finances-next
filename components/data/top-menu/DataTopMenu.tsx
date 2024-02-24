import DataMenuItem from "@/components/data/top-menu/item/DataTopMenuItem";

export default async function DataTopMenu() {
  const data = [
    {
      id: "asset-allocation",
      name: "Asset Allocation",
    },
    {
      id: "entities-allocation",
      name: "Financial Entities Allocation",
    },
    {
      id: "salaries",
      name: "Salaries",
    },
    {
      id: "subscriptions",
      name: "Subscriptions",
    },
    {
      id: "income-expenses-year",
      name: "Income & Expenses 2024",
    },
    {
      id: "income-expenses",
      name: "Income & Expenses Inception",
    },
    {
      id: "net-worth-evolution",
      name: "Net Worth Evolution",
    },
  ];
  return (
    <>
      {/* min-h-top-bar */}
      <nav className="flex bg-lime-900">
        <ul className="flex overflow-auto flex-nowrap scroll-touch">
          {data.map((item) => (
            <DataMenuItem key={item.id} data={item} />
          ))}
        </ul>
      </nav>
    </>
  );
}
