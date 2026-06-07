"use client";

import { cn } from "@/lib/utils";

export function ListTabBar<T extends string>({
  tabs,
  activeId,
  onSelect,
  counts,
}: {
  tabs: readonly { id: T; label: string }[];
  activeId: T;
  onSelect: (id: T) => void;
  counts?: Partial<Record<T, number>>;
}) {
  return (
    <div className="flex flex-wrap gap-2 pb-4" role="tablist">
      {tabs.map((t) => {
        const active = activeId === t.id;
        const count = counts?.[t.id];
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(t.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            )}
          >
            <span>{t.label}</span>
            {count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-medium",
                  active ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
