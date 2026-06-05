"use client";

import { cn } from "@/lib/utils";

export function ListTabBar<T extends string>({
  tabs,
  activeId,
  onSelect,
}: {
  tabs: readonly { id: T; label: string }[];
  activeId: T;
  onSelect: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 pb-4" role="tablist">
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
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
