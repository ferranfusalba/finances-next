import DataMenuItem from "@/components/data/top-menu/item/DataTopMenuItem";

export default async function DataTopMenu() {
  const data = [
    {
      id: "global",
      name: "Global",
    },
    {
      id: "monthly",
      name: "Monthly",
    },
    {
      id: "yearly",
      name: "Yearly",
    },
  ];
  return (
    <>
      <nav className="flex bg-lime-900 min-h-top-bar">
        <ul className="flex overflow-auto flex-nowrap scroll-touch">
          {data.map((item) => (
            <DataMenuItem key={item.id} data={item} />
          ))}
        </ul>
      </nav>
    </>
  );
}
