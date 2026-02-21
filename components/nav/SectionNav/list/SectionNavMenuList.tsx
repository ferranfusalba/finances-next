"use client";

import { useEffect, useState } from "react";
import { useCoarsePointer } from "@/hooks/use-coarse-pointer";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";

import SectionNavMenuListItem from "@/components/nav/SectionNav/list/SectionNavMenuListItem";

export default function SectionNavMenuList({
  list,
  type,
}: {
  list: Array<{ id: string; name: string; active?: boolean }>;
  type: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState(list);
  useEffect(() => setItems(list), [list]);

  const isCoarsePointer = useCoarsePointer();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    const reorderPayload = reordered.map((item, index) => ({
      id: item.id,
      order: index + 1,
    }));

    await fetch("/api/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, items: reorderPayload }),
    });

    router.refresh();
  }

  return (
    <DndContext
      id={`nav-${type}`}
      sensors={isCoarsePointer ? [] : sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={horizontalListSortingStrategy}
      >
        <ol className="flex overflow-auto flex-nowrap scroll-touch">
          {items.map((item) => (
            <SectionNavMenuListItem
              item={item}
              key={item.id}
              type={type}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}
