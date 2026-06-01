"use client";

import { cn } from "@/lib/utils";

export function ListTabBar<T extends string>({
  tabs,
  activeId,
  onSelect,
  columns,
}: {
  tabs: readonly { id: T; label: string }[];
  activeId: T;
  onSelect: (id: T) => void;
  /** Tabs per row (e.g. 6 → two rows for 12 tabs). */
  columns: 4 | 5 | 6;
}) {
  const gridCols =
    columns === 4
      ? "grid-cols-4"
      : columns === 5
        ? "grid-cols-5"
        : "grid-cols-6";

  return (
    <div
      className={cn("grid gap-x-1 gap-y-0 border-b border-slate-100", gridCols)}
      role="tablist"
    >
      {tabs.map((t) => {
        const active = activeId === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(t.id)}
            className={cn(
              "border-b-2 px-2 py-2.5 text-center text-sm font-medium leading-snug transition-colors",
              active
                ? "border-slate-800 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
