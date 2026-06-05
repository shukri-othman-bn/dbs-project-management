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
import {
  DesktopDataTable,
  desktopTdClass,
  desktopThClass,
  MobileCardList,
  MobileField,
  MobileRecordCard,
  ResponsiveDataView,
} from "@/components/ui/responsive-data";
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
          className="grid grid-cols-2 gap-x-1 gap-y-0 border-b border-slate-100 sm:grid-cols-4"
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

      <CardContent className="p-0">
        <p className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:px-6">
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
        {filtered.length > 0 && (
          <ResponsiveDataView
            mobile={
              <MobileCardList>
                {filtered.map((p) =>
                  showTenderingColumns ? (
                    <MobileRecordCard
                      key={p.id}
                      href={`/projects/${p.id}`}
                      title={p.title}
                      subtitle={p.tenderNo ?? undefined}
                    >
                      <MobileField label="Unit" value={<UnitPill unit={p.unit} />} />
                      <MobileField label="Quotation / Contract" value={p.quotationOrContractNo ?? "—"} />
                      <MobileField
                        label="Tendering details"
                        value={<TenderingDetailsCell project={p} />}
                        span={3}
                      />
                      <MobileField
                        label="Tendering remarks"
                        value={p.tenderRemarks ?? "—"}
                        span={3}
                        className="whitespace-pre-wrap"
                      />
                      <MobileField label="Status" value={<StageBadge stage={p.lifecycleStage} />} />
                    </MobileRecordCard>
                  ) : (
                    <MobileRecordCard
                      key={p.id}
                      href={`/projects/${p.id}`}
                      title={p.projectNumber}
                      subtitle={
                        p.toMonitor ? (
                          <>
                            {p.title}
                            <span className="mt-1 block text-amber-600">Keep in view</span>
                          </>
                        ) : (
                          p.title
                        )
                      }
                    >
                      <MobileField label="Unit" value={<UnitPill unit={p.unit} />} />
                      <MobileField label="Client" value={p.ministry ?? "—"} />
                      <MobileField label="OIC" value={p.oicName ?? "—"} />
                      <MobileField label="Physical" value={formatPercent(p.physicalActual)} />
                      <MobileField
                        label="Budget"
                        value={
                          <>
                            {formatPercent(p.utilizationPct)}
                            <span className="mt-0.5 block text-xs text-slate-400">
                              {formatCurrency(p.paymentsCertified)}
                            </span>
                          </>
                        }
                      />
                      <MobileField label="Status" value={<StageBadge stage={p.lifecycleStage} />} />
                      <MobileField
                        label="RAG"
                        value={<RagBadge status={p.rag as "green" | "amber" | "red"} />}
                      />
                    </MobileRecordCard>
                  )
                )}
              </MobileCardList>
            }
            desktop={
              <DesktopDataTable dense>
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className={desktopThClass}>Unit</th>
                    {showTenderingColumns ? (
                      <>
                        <th className={desktopThClass}>Tender no.</th>
                        <th className={desktopThClass}>Quotation / Contract</th>
                        <th className={desktopThClass}>Project title</th>
                        <th className={desktopThClass}>Tendering details</th>
                        <th className={desktopThClass}>Tendering remarks</th>
                      </>
                    ) : (
                      <>
                        <th className={desktopThClass}>Project no.</th>
                        <th className={desktopThClass}>Project title</th>
                        <th className={desktopThClass}>Client</th>
                        <th className={desktopThClass}>OIC</th>
                        <th className={desktopThClass}>Physical</th>
                        <th className={desktopThClass}>Budget</th>
                      </>
                    )}
                    <th className={desktopThClass}>Status</th>
                    {!showTenderingColumns && <th className={desktopThClass}>RAG</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className={desktopTdClass}>
                        <UnitPill unit={p.unit} />
                      </td>
                      {showTenderingColumns ? (
                        <>
                          <td className={cn(desktopTdClass, "font-medium text-slate-800")}>
                            {p.tenderNo ?? "—"}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-700")}>
                            {p.quotationOrContractNo ?? "—"}
                          </td>
                          <td className={desktopTdClass}>
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
                          <td className={desktopTdClass}>
                            <TenderingDetailsCell project={p} />
                          </td>
                          <td className={cn(desktopTdClass, "whitespace-pre-wrap text-slate-600")}>
                            {p.tenderRemarks ?? "—"}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className={desktopTdClass}>
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
                          <td className={desktopTdClass}>
                            <Link
                              href={`/projects/${p.id}`}
                              className="text-slate-800 hover:underline"
                            >
                              {p.title}
                            </Link>
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {p.ministry ?? "—"}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {p.oicName ?? "—"}
                          </td>
                          <td className={desktopTdClass}>{formatPercent(p.physicalActual)}</td>
                          <td className={desktopTdClass}>
                            {formatPercent(p.utilizationPct)}
                            <span className="mt-0.5 block text-xs text-slate-400">
                              {formatCurrency(p.paymentsCertified)}
                            </span>
                          </td>
                        </>
                      )}
                      <td className={desktopTdClass}>
                        <StageBadge stage={p.lifecycleStage} />
                      </td>
                      {!showTenderingColumns && (
                        <td className={desktopTdClass}>
                          <RagBadge status={p.rag as "green" | "amber" | "red"} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </DesktopDataTable>
            }
          />
        )}
        {filtered.length === 0 && (
          <p className="px-6 py-10 text-center text-slate-500">
            No projects match the current filters.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
