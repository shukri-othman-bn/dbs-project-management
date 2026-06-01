"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { PROJECT_TAB_GROUPS, type ProjectTabId } from "@/lib/project-labels";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function ProjectDetailNav({
  projectId,
  activeTab,
}: {
  projectId: string;
  activeTab: ProjectTabId;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const expandedGroup = searchParams.get("group");

  function tabHref(tabId: ProjectTabId, groupId: string) {
    const params = new URLSearchParams();
    params.set("tab", tabId);
    params.set("group", groupId);
    return `${pathname}?${params.toString()}`;
  }

  return (
    <Card className="h-fit">
      <CardContent className="p-3">
        <nav className="space-y-4" aria-label="Project sections">
          {PROJECT_TAB_GROUPS.map((group) => {
            const isGroupOpen =
              expandedGroup === group.id ||
              group.tabs.some((t) => t.id === activeTab);
            return (
              <div key={group.id}>
                <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.tabs.map((tab) => {
                    const active = activeTab === tab.id;
                    return (
                      <li key={tab.id}>
                        <Link
                          href={tabHref(tab.id, group.id)}
                          className={cn(
                            "block rounded-lg px-3 py-2 text-sm transition-colors",
                            active
                              ? "bg-slate-800 font-medium text-white"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                            !isGroupOpen && !active && "opacity-90"
                          )}
                        >
                          {tab.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </CardContent>
    </Card>
  );
}
