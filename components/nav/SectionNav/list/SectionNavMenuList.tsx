import SectionNavMenuListItem from "@/components/nav/SectionNav/list/SectionNavMenuListItem";

export default function SectionNavMenuList({
  list,
  type,
}: {
  list: Array<{ id: string; name: string; active?: boolean }>;
  type: string;
}) {
  return (
    <>
      <ol className="flex overflow-auto flex-nowrap scroll-touch">
        {list.map((item, index) => (
          <SectionNavMenuListItem
            item={item}
            index={index}
            key={item.id}
            type={type}
          />
        ))}
      </ol>
    </>
  );
}
