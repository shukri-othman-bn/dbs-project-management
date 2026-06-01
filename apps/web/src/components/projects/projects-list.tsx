"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { RagBadge, StageBadge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  PROJECT_LIST_TABS,
  collectFilterOptions,
  countByTab,
  filterProjects,
  getTabLabel,
  type ProjectListRow,
  type ProjectListTabId,
} from "@/lib/project-list-filters";
import { countActiveMasterListFilters, type MasterListFilterState } from "@/lib/master-list-filters";
import { MasterListFiltersBar } from "@/components/master-list/master-list-filters-bar";
import { cn } from "@/lib/utils";

function UnitPill({ unit }: { unit: string | null }) {
  if (!unit) return <span className="text-slate-400">—</span>;
  return (
    <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      {unit}
    </span>
  );
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function TenderingDetailsCell({ project }: { project: ProjectListRow }) {
  const rows = [
    { label: "Open Date", value: formatDate(project.tenderOpenDate) },
    { label: "Close Date", value: formatDate(project.tenderClosingDate) },
    { label: "Extended Date", value: formatDate(project.tenderExtendedDate) },
    { label: "Approved Date", value: formatDate(project.tenderApprovedDate) },
  ].filter((r) => r.value);

  if (rows.length === 0) return <span className="text-slate-400">—</span>;

  return (
    <ul className="space-y-0.5 text-xs text-slate-600">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="font-medium text-slate-700">{r.label}:</span> {r.value}
        </li>
      ))}
    </ul>
  );
}

export function ProjectsList({ projects }: { projects: ProjectListRow[] }) {
  const [tab, setTab] = useState<ProjectListTabId>("all");
  const [filters, setFilters] = useState<MasterListFilterState>({
    search: "",
    unit: "",
    vote: "",
    contractor: "",
    projectType: "",
    projectStatus: "",
    ministry: "",
    department: "",
  });

  const filterOptions = useMemo(() => collectFilterOptions(projects), [projects]);
  const tabCounts = useMemo(() => countByTab(projects), [projects]);

  const filtered = useMemo(
    () => filterProjects(projects, { tab, ...filters }),
    [projects, tab, filters]
  );

  const activeFilters = countActiveMasterListFilters(filters);
  const showTenderingColumns = tab === "tendering";

  function patchFilters(patch: Partial<MasterListFilterState>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  return (
    <Card>
      <div className="px-6 pt-4">
        <div
          className="grid grid-cols-4 gap-x-1 gap-y-0 border-b border-slate-100"
          role="tablist"
        >
          {PROJECT_LIST_TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 border-b-2 px-2 py-2.5 text-center text-sm font-medium leading-snug transition-colors",
                  active
                    ? "border-slate-800 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                <span>{t.label}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium",
                    active ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {tabCounts[t.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <CardContent className="space-y-4 border-b border-slate-100 py-4">
        <MasterListFiltersBar
          filters={filters}
          options={filterOptions}
          onSearchChange={(search) => patchFilters({ search })}
          onUnitChange={(unit) => patchFilters({ unit })}
          onVoteChange={(vote) => patchFilters({ vote })}
          onContractorChange={(contractor) => patchFilters({ contractor })}
          onProjectTypeChange={(projectType) => patchFilters({ projectType })}
          onProjectStatusChange={(projectStatus) => patchFilters({ projectStatus })}
          onMinistryChange={(ministry) => patchFilters({ ministry })}
          onDepartmentChange={(department) => patchFilters({ department })}
        />
      </CardContent>

      <CardContent className="p-0 overflow-x-auto">
        <p className="border-b border-slate-100 bg-slate-50 px-6 py-3 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{filtered.length}</span>
          {" project"}
          {filtered.length === 1 ? "" : "s"}
          {" in "}
          <span className="font-medium text-slate-800">{getTabLabel(tab)}</span>
          {activeFilters > 0 && (
            <span className="text-slate-500">
              {" "}
              · {activeFilters} filter{activeFilters === 1 ? "" : "s"} applied
            </span>
          )}
          {filters.search.trim() && (
            <span className="text-slate-500"> · matching &ldquo;{filters.search.trim()}&rdquo;</span>
          )}
        </p>
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-slate-500">
              <th className="px-6 py-3 font-medium">Unit</th>
              {showTenderingColumns ? (
                <>
                  <th className="px-6 py-3 font-medium">Tender no.</th>
                  <th className="px-6 py-3 font-medium">Quotation / Contract</th>
                  <th className="min-w-[220px] px-6 py-3 font-medium">Project title</th>
                  <th className="min-w-[160px] px-6 py-3 font-medium">Tendering details</th>
                  <th className="min-w-[180px] px-6 py-3 font-medium">Tendering remarks</th>
                </>
              ) : (
                <>
                  <th className="px-6 py-3 font-medium">Project no.</th>
                  <th className="min-w-[220px] px-6 py-3 font-medium">Project title</th>
                  <th className="px-6 py-3 font-medium">Client</th>
                  <th className="px-6 py-3 font-medium">OIC</th>
                  <th className="px-6 py-3 font-medium">Physical</th>
                  <th className="px-6 py-3 font-medium">Budget</th>
                </>
              )}
              <th className="px-6 py-3 font-medium">Status</th>
              {!showTenderingColumns && <th className="px-6 py-3 font-medium">RAG</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                <td className="px-6 py-3">
                  <UnitPill unit={p.unit} />
                </td>
                {showTenderingColumns ? (
                  <>
                    <td className="px-6 py-3 font-medium text-slate-800">
                      {p.tenderNo ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {p.quotationOrContractNo ?? "—"}
                    </td>
                    <td className="px-6 py-3">
                      <Link
                        href={`/projects/${p.id}`}
                        className="font-medium text-slate-800 hover:underline"
                      >
                        {p.title}
                      </Link>
                      {p.toMonitor && (
                        <span className="ml-2 text-amber-500" title="Keep in view">
                          ●
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <TenderingDetailsCell project={p} />
                    </td>
                    <td className="whitespace-pre-wrap px-6 py-3 text-xs text-slate-600">
                      {p.tenderRemarks ?? "—"}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-3">
                      <Link
                        href={`/projects/${p.id}`}
                        className="font-medium text-slate-800 hover:underline"
                      >
                        {p.projectNumber}
                      </Link>
                      {p.toMonitor && (
                        <span className="ml-2 text-amber-500" title="Keep in view">
                          ●
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <Link
                        href={`/projects/${p.id}`}
                        className="line-clamp-2 text-slate-800 hover:underline"
                      >
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-slate-600">{p.ministry ?? "—"}</td>
                    <td className="px-6 py-3 text-slate-600">{p.oicName ?? "—"}</td>
                    <td className="px-6 py-3">{formatPercent(p.physicalActual)}</td>
                    <td className="px-6 py-3">
                      {formatPercent(p.utilizationPct)}
                      <span className="mt-0.5 block text-xs text-slate-400">
                        {formatCurrency(p.paymentsCertified)}
                      </span>
                    </td>
                  </>
                )}
                <td className="px-6 py-3">
                  <StageBadge stage={p.lifecycleStage} />
                </td>
                {!showTenderingColumns && (
                  <td className="px-6 py-3">
                    <RagBadge status={p.rag as "green" | "amber" | "red"} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-6 py-10 text-center text-slate-500">
            No projects match the current filters.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
