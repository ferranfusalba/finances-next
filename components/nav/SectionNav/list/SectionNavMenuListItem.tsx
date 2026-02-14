"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";

export default function SectionNavMenuListItem({
  item,
  type,
}: {
  item: { id: string; name: string; bankName?: string; active?: boolean };
  type: string;
}) {
  const pathname = usePathname();
  const accountSelected = "/accounts/" + item.id === pathname;
  const budgetSelected = "/budgets/" + item.id === pathname;
  const dataSelected = "/data/" + item.id === pathname;
  const settingsSelected = "/settings/" + item.id === pathname;
  const playgroundSelected = "/playground/" + item.id === pathname;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-2 flex items-center mx-2.5 h-11",
        item.active === false
          ? "text-slate-400 border-slate-400"
          : "text-white border-white",
        {
          "bg-black border-black dark:bg-white dark:border-white dark:text-sky-900":
            accountSelected,
        },
        {
          "bg-black border-black dark:bg-white dark:border-white dark:text-pink-900":
            budgetSelected,
        },
        {
          "bg-black border-black dark:bg-white dark:border-white dark:text-lime-900":
            dataSelected,
        },
        {
          "bg-black border-black dark:bg-white dark:border-white dark:text-stone-900":
            settingsSelected,
        },
        {
          "bg-black border-black dark:bg-white dark:border-white dark:text-fuchsia-900":
            playgroundSelected,
        }
      )}
    >
      <button
        className="select-none cursor-grab active:cursor-grabbing px-1 opacity-50 hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Link
        className="w-max min-w-10rem text-center px-3"
        href={`/${type}/` + item.id}
      >
        {item.bankName ? (
          <>
            <small>{item.bankName}</small> · {item.name}
          </>
        ) : (
          item.name
        )}
      </Link>
    </li>
  );
}
