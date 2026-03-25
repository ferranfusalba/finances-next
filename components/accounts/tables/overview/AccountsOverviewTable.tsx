"use client";

import { useEffect, useState } from "react";
import { useCoarsePointer } from "@/hooks/use-coarse-pointer";
import { useRouter } from "next/navigation";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
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
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragVertical } from "@carbon/icons-react";

import CurrencyTag from "@/components/chips/CurrencyTag";

import { currency } from "@/lib/utils";
import { getCountryFlag } from "@/lib/utils/country";

import { Account } from "@/types/Account";
import Link from "next/link";

const columnHelper = createColumnHelper<Account>();

function SortableRow({
  row,
  children,
  isCoarsePointer,
}: {
  row: { id: string; original: Account };
  children: React.ReactNode;
  isCoarsePointer: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.original.id, disabled: isCoarsePointer });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="bg-slate-700 border-b border-b-slate-400"
    >
      <td className="p-2">
        <button
          aria-label="Drag to reorder"
          className="hidden pointer-fine:block select-none cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <DragVertical className="h-4 w-4" />
        </button>
      </td>
      {children}
    </tr>
  );
}

export default function AccountsOverviewTable({
  accounts,
  userLocale,
}: {
  accounts: Array<Account>;
  userLocale: string;
}) {
  const router = useRouter();
  const [data, setData] = useState(accounts);
  useEffect(() => setData(accounts), [accounts]);

  const columns = [
    columnHelper.accessor("order", {
      header: () => <span>Order</span>,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("bankName", {
      header: () => <span>Bank</span>,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("name", {
      header: () => <span>Name</span>,
      cell: (info) => {
        return (
          <Link
            href={`/accounts/${info.row.original.id}`}
            className="underline"
          >
            {info.row.original.name}
          </Link>
        );
      },
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("code", {
      header: () => <span>Code</span>,
      cell: (info) => {
        return (
          <span className="font-mono p-1 bg-slate-100 rounded-md text-stone-900">
            {info.row.original.code}
          </span>
        );
      },
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("active", {
      header: () => <span>Active</span>,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("type", {
      header: () => <span>Type</span>,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("description", {
      header: () => <span>Description</span>,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("defaultCurrency", {
      header: () => <span>Currency</span>,
      cell: (info) => {
        return (
          <CurrencyTag code={info.row.original.defaultCurrency as string} />
        );
      },
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("currentBalance", {
      header: () => <span>Balance</span>,
      cell: (info) => {
        const number = info.getValue();
        const defaultCurrency = info.row.original?.defaultCurrency;

        return (
          <>{currency(userLocale, defaultCurrency as string).format(number)}</>
        );
      },
      footer: (info) => {
        const balancesByCurrency = info.table.options.data.reduce(
          (acc, item) => {
            const { defaultCurrency, currentBalance } = item;
            acc[defaultCurrency as string] =
              (acc[defaultCurrency as string] || 0) + currentBalance;
            return acc;
          },
          {} as Record<string, number>,
        );

        return (
          <ul>
            {Object.entries(balancesByCurrency).map(
              ([accountCurrency, total]) => (
                <li key={accountCurrency}>
                  {currency(userLocale, accountCurrency).format(total)}
                </li>
              ),
            )}
          </ul>
        );
      },
    }),
    columnHelper.accessor("number", {
      header: () => <span>Number</span>,
      cell: (info) => {
        return <span className="font-mono">{info.row.original.number}</span>;
      },
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("country", {
      header: () => <span>Country</span>,
      cell: (info) => {
        return (
          <>
            {info.row.original.country}{" "}
            {getCountryFlag(info.row.original.country)}
          </>
        );
      },
      footer: (info) => info.column.id,
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const isCoarsePointer = useCoarsePointer();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = data.findIndex((item) => item.id === active.id);
    const newIndex = data.findIndex((item) => item.id === over.id);

    const reordered = arrayMove(data, oldIndex, newIndex).map(
      (item, index) => ({
        ...item,
        order: index + 1,
      }),
    );
    setData(reordered);

    const reorderPayload = reordered.map((item, index) => ({
      id: item.id,
      order: index + 1,
    }));

    await fetch("/api/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "accounts", items: reorderPayload }),
    });

    router.refresh();
  }

  return (
    <div className="flex flex-col overflow-auto flex-nowrap scroll-touch pb-24">
      <DndContext
        id="accounts-table"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table>
          <caption className="sr-only">Accounts overview</caption>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-slate-400">
                <th scope="col" className="text-start px-2 border-r border-r-slate-900 font-bold" />
                {headerGroup.headers.map((header) => (
                  <th
                    scope="col"
                    key={header.id}
                    className="text-start px-2 border-r border-r-slate-900 font-bold"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <SortableContext
            items={data.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <SortableRow key={row.original.id} row={row} isCoarsePointer={isCoarsePointer}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-2">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </SortableRow>
              ))}
            </tbody>
          </SortableContext>
          <tfoot>
            {table.getFooterGroups().map((footerGroup) => (
              <tr key={footerGroup.id} className="bg-slate-400 text-slate-600">
                <th className="px-2 font-bold" />
                {footerGroup.headers.map((header) => (
                  <th key={header.id} className="px-2 font-bold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.footer,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </tfoot>
        </table>
      </DndContext>
    </div>
  );
}
