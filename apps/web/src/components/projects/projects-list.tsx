"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { RagBadge, StageBadge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  CONFIGURED_PROJECTS_TABLE_COLUMNS,
  PROJECT_LIST_TABS,
  collectFilterOptions,
  countByTab,
  filterProjects,
  formatTenderQuotationNo,
  getTabLabel,
  type ConfiguredProjectsTableLayout,
  type ProjectListRow,
  type ProjectListTabId,
} from "@/lib/project-list-filters";
import { countActiveMasterListFilters, type MasterListFilterState } from "@/lib/master-list-filters";
import { MasterListFiltersBar } from "@/components/master-list/master-list-filters-bar";
import { ListTabBar } from "@/components/master-list/list-tab-bar";
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

function formatDateCell(value: string | null) {
  return formatDate(value) ?? "—";
}

function formatEstimateCell(value: number | null) {
  return value != null ? formatCurrency(value) : "—";
}

type ProjectsTableLayout = ConfiguredProjectsTableLayout | "default";

function getProjectsTableLayout(tab: ProjectListTabId): ProjectsTableLayout {
  if (tab === "all") return "all-projects";
  if (tab === "bca") return "bca";
  if (tab === "feasibility") return "feasibility";
  if (tab === "design") return "design";
  if (tab === "tender-quotation") return "tender-quotation";
  if (tab === "on-going") return "on-going";
  if (tab === "completed") return "completed";
  if (tab === "keep-in-view") return "keep-in-view";
  return "default";
}

function isConfiguredTableLayout(layout: ProjectsTableLayout): layout is ConfiguredProjectsTableLayout {
  return layout in CONFIGURED_PROJECTS_TABLE_COLUMNS;
}

function ProjectTitleLink({ project }: { project: ProjectListRow }) {
  return (
    <>
      <Link href={`/projects/${project.id}`} className="font-medium text-slate-800 hover:underline">
        {project.title}
      </Link>
      {project.toMonitor && (
        <span className="ml-2 text-amber-500" title="Keep in view">
          ●
        </span>
      )}
    </>
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
  const tableLayout = getProjectsTableLayout(tab);

  function patchFilters(patch: Partial<MasterListFilterState>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  return (
    <Card>
      <div className="px-6 pt-4">
        <ListTabBar
          tabs={PROJECT_LIST_TABS}
          activeId={tab}
          onSelect={setTab}
          counts={tabCounts}
        />
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
                  tableLayout === "all-projects" ? (
                    <MobileRecordCard key={p.id} href={`/projects/${p.id}`} title={p.title}>
                      <MobileField label="Unit" value={<UnitPill unit={p.unit} />} />
                      <MobileField label="Ministry" value={p.ministry ?? "—"} />
                      <MobileField label="Department" value={p.department ?? "—"} />
                      <MobileField label="Vote" value={p.vote ?? "—"} />
                      <MobileField label="Status" value={<StageBadge stage={p.lifecycleStage} />} />
                    </MobileRecordCard>
                  ) : tableLayout === "bca" ? (
                    <MobileRecordCard key={p.id} href={`/projects/${p.id}`} title={p.title}>
                      <MobileField label="Unit" value={<UnitPill unit={p.unit} />} />
                      <MobileField label="Date assigned" value={formatDateCell(p.bcaDateAssigned)} />
                      <MobileField label="Date due" value={formatDateCell(p.bcaDateDue)} />
                      <MobileField label="Date completed" value={formatDateCell(p.bcaDateCompleted)} />
                      <MobileField label="Estimate" value={formatEstimateCell(p.bcaEstimate)} />
                      <MobileField label="Letter date" value={formatDateCell(p.bcaLetterDate)} span={3} />
                    </MobileRecordCard>
                  ) : tableLayout === "feasibility" || tableLayout === "keep-in-view" ? (
                    <MobileRecordCard key={p.id} href={`/projects/${p.id}`} title={p.title}>
                      <MobileField label="Unit" value={<UnitPill unit={p.unit} />} />
                      <MobileField label="Ministry" value={p.ministry ?? "—"} />
                      <MobileField label="Department" value={p.department ?? "—"} />
                      <MobileField label="Request date" value={formatDateCell(p.feasibilityRequestDate)} />
                      <MobileField label="Site inspection" value={formatDateCell(p.feasibilitySiteInspection)} />
                      <MobileField label="Estimate" value={formatEstimateCell(p.feasibilityEstimate)} />
                      <MobileField label="Proposed period" value={p.feasibilityProposedPeriod ?? "—"} />
                      <MobileField
                        label="Estimate submitted"
                        value={formatDateCell(p.feasibilityEstimateSubmitted)}
                        span={tableLayout === "keep-in-view" ? 3 : undefined}
                      />
                      {tableLayout === "feasibility" && (
                        <MobileField
                          label="Date client confirm"
                          value={formatDateCell(p.feasibilityDateClientConfirm)}
                          span={3}
                        />
                      )}
                    </MobileRecordCard>
                  ) : tableLayout === "design" ? (
                    <MobileRecordCard key={p.id} href={`/projects/${p.id}`} title={p.title}>
                      <MobileField label="Unit" value={<UnitPill unit={p.unit} />} />
                      <MobileField label="Ministry" value={p.ministry ?? "—"} />
                      <MobileField label="Department" value={p.department ?? "—"} />
                      <MobileField label="Date confirmed" value={formatDateCell(p.designDateConfirmed)} />
                      <MobileField label="Vote" value={p.vote ?? "—"} />
                      <MobileField label="Estimate" value={formatEstimateCell(p.designEstimate)} />
                      <MobileField
                        label="Quotation/tender due date"
                        value={formatDateCell(p.designQuotationTenderDueDate)}
                      />
                      <MobileField
                        label="Actual quotation/tender date"
                        value={formatDateCell(p.designActualQuotationTenderDate)}
                        span={3}
                      />
                    </MobileRecordCard>
                  ) : tableLayout === "tender-quotation" ? (
                    <MobileRecordCard key={p.id} href={`/projects/${p.id}`} title={p.title}>
                      <MobileField label="Unit" value={<UnitPill unit={p.unit} />} />
                      <MobileField label="Department" value={p.department ?? "—"} />
                      <MobileField label="Tender no./quotation no." value={formatTenderQuotationNo(p)} />
                      <MobileField label="Open date" value={formatDateCell(p.tenderOpenDate)} />
                      <MobileField label="Close date" value={formatDateCell(p.tenderClosingDate)} />
                      <MobileField label="Extended date" value={formatDateCell(p.tenderExtendedDate)} />
                      <MobileField label="Tender/quotation received" value={formatDateCell(p.tenderReceivedDate)} />
                      <MobileField
                        label="Assessment submitted to SBM/DBSO"
                        value={formatDateCell(p.tenderAssessmentSubmittedDate)}
                        span={3}
                      />
                      <MobileField label="Quotation/tender approved" value={formatDateCell(p.tenderApprovedDate)} />
                      <MobileField label="LOA issued" value={formatDateCell(p.tenderLoaDate)} span={2} />
                    </MobileRecordCard>
                  ) : tableLayout === "on-going" ? (
                    <MobileRecordCard key={p.id} href={`/projects/${p.id}`} title={p.title}>
                      <MobileField label="Unit" value={<UnitPill unit={p.unit} />} />
                      <MobileField label="Tender no./quotation no." value={formatTenderQuotationNo(p)} />
                      <MobileField label="Contract sum" value={formatEstimateCell(p.contractSum)} />
                      <MobileField label="Contractor" value={p.contractorName ?? "—"} />
                      <MobileField label="Contract period" value={p.contractPeriod ?? "—"} />
                      <MobileField label="LOA issued" value={formatDateCell(p.loaIssuedDate)} />
                      <MobileField label="Site possession" value={formatDateCell(p.sitePossessionDate)} />
                      <MobileField label="Start date" value={formatDateCell(p.contractStartDate)} />
                      <MobileField label="Finish date" value={formatDateCell(p.contractFinishDate)} />
                      <MobileField label="EOT date" value={formatDateCell(p.latestEotDate)} />
                      <MobileField label="CNC date" value={formatDateCell(p.cncDate)} />
                      <MobileField label="CPC date" value={formatDateCell(p.cpcDate)} />
                      <MobileField label="Physical progress %" value={formatPercent(p.physicalActual)} span={3} />
                    </MobileRecordCard>
                  ) : tableLayout === "completed" ? (
                    <MobileRecordCard key={p.id} href={`/projects/${p.id}`} title={p.title}>
                      <MobileField label="Unit" value={<UnitPill unit={p.unit} />} />
                      <MobileField label="Tender no./quotation no." value={formatTenderQuotationNo(p)} />
                      <MobileField label="Contract sum" value={formatEstimateCell(p.contractSum)} />
                      <MobileField label="Contractor" value={p.contractorName ?? "—"} />
                      <MobileField label="Contract period" value={p.contractPeriod ?? "—"} />
                      <MobileField label="CPC date" value={formatDateCell(p.cpcDate)} />
                      <MobileField label="EDLP date" value={formatDateCell(p.edlpDate)} />
                      <MobileField label="CMGD issued" value={formatDateCell(p.cmgdIssuedDate)} />
                      <MobileField label="Final VO submitted" value={formatDateCell(p.finalVoSubmittedDate)} />
                      <MobileField label="Final VO approved" value={formatDateCell(p.finalVoApprovedDate)} />
                      <MobileField
                        label="Final contract sum"
                        value={formatEstimateCell(p.finalContractSum)}
                        span={3}
                      />
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
                {isConfiguredTableLayout(tableLayout) && (
                  <colgroup>
                    {CONFIGURED_PROJECTS_TABLE_COLUMNS[tableLayout].map((col) => (
                      <col key={col.id} style={{ width: `${col.widthPercent}%` }} />
                    ))}
                  </colgroup>
                )}
                <thead>
                  <tr className="border-b bg-slate-50">
                    {isConfiguredTableLayout(tableLayout) ? (
                      <>
                        {CONFIGURED_PROJECTS_TABLE_COLUMNS[tableLayout].map((col) => (
                          <th key={col.id} className={desktopThClass}>
                            {col.label}
                          </th>
                        ))}
                      </>
                    ) : (
                      <>
                        <th className={desktopThClass}>Unit</th>
                        <th className={desktopThClass}>Project no.</th>
                        <th className={desktopThClass}>Project title</th>
                        <th className={desktopThClass}>Client</th>
                        <th className={desktopThClass}>OIC</th>
                        <th className={desktopThClass}>Physical</th>
                        <th className={desktopThClass}>Budget</th>
                        <th className={desktopThClass}>Status</th>
                        <th className={desktopThClass}>RAG</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      {tableLayout === "all-projects" ? (
                        <>
                          <td className={desktopTdClass}>
                            <UnitPill unit={p.unit} />
                          </td>
                          <td className={desktopTdClass}>
                            <ProjectTitleLink project={p} />
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {p.ministry ?? "—"}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {p.department ?? "—"}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {p.vote ?? "—"}
                          </td>
                          <td className={desktopTdClass}>
                            <StageBadge stage={p.lifecycleStage} />
                          </td>
                        </>
                      ) : tableLayout === "bca" ? (
                        <>
                          <td className={desktopTdClass}>
                            <UnitPill unit={p.unit} />
                          </td>
                          <td className={desktopTdClass}>
                            <ProjectTitleLink project={p} />
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.bcaDateAssigned)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.bcaDateDue)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.bcaDateCompleted)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatEstimateCell(p.bcaEstimate)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.bcaLetterDate)}
                          </td>
                        </>
                      ) : tableLayout === "feasibility" || tableLayout === "keep-in-view" ? (
                        <>
                          <td className={desktopTdClass}>
                            <UnitPill unit={p.unit} />
                          </td>
                          <td className={desktopTdClass}>
                            <ProjectTitleLink project={p} />
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {p.ministry ?? "—"}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {p.department ?? "—"}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.feasibilityRequestDate)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.feasibilitySiteInspection)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatEstimateCell(p.feasibilityEstimate)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {p.feasibilityProposedPeriod ?? "—"}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.feasibilityEstimateSubmitted)}
                          </td>
                          {tableLayout === "feasibility" && (
                            <td className={cn(desktopTdClass, "text-slate-600")}>
                              {formatDateCell(p.feasibilityDateClientConfirm)}
                            </td>
                          )}
                        </>
                      ) : tableLayout === "design" ? (
                        <>
                          <td className={desktopTdClass}>
                            <UnitPill unit={p.unit} />
                          </td>
                          <td className={desktopTdClass}>
                            <ProjectTitleLink project={p} />
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {p.ministry ?? "—"}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {p.department ?? "—"}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.designDateConfirmed)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {p.vote ?? "—"}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatEstimateCell(p.designEstimate)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.designQuotationTenderDueDate)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.designActualQuotationTenderDate)}
                          </td>
                        </>
                      ) : tableLayout === "tender-quotation" ? (
                        <>
                          <td className={desktopTdClass}>
                            <UnitPill unit={p.unit} />
                          </td>
                          <td className={desktopTdClass}>
                            <ProjectTitleLink project={p} />
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {p.department ?? "—"}
                          </td>
                          <td className={cn(desktopTdClass, "font-medium text-slate-800")}>
                            {formatTenderQuotationNo(p)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.tenderOpenDate)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.tenderClosingDate)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.tenderExtendedDate)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.tenderReceivedDate)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.tenderAssessmentSubmittedDate)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.tenderApprovedDate)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.tenderLoaDate)}
                          </td>
                        </>
                      ) : tableLayout === "on-going" ? (
                        <>
                          <td className={desktopTdClass}>
                            <UnitPill unit={p.unit} />
                          </td>
                          <td className={desktopTdClass}>
                            <ProjectTitleLink project={p} />
                          </td>
                          <td className={cn(desktopTdClass, "font-medium text-slate-800")}>
                            {formatTenderQuotationNo(p)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatEstimateCell(p.contractSum)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {p.contractorName ?? "—"}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {p.contractPeriod ?? "—"}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.loaIssuedDate)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.sitePossessionDate)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.contractStartDate)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.contractFinishDate)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.latestEotDate)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.cncDate)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.cpcDate)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatPercent(p.physicalActual)}
                          </td>
                        </>
                      ) : tableLayout === "completed" ? (
                        <>
                          <td className={desktopTdClass}>
                            <UnitPill unit={p.unit} />
                          </td>
                          <td className={desktopTdClass}>
                            <ProjectTitleLink project={p} />
                          </td>
                          <td className={cn(desktopTdClass, "font-medium text-slate-800")}>
                            {formatTenderQuotationNo(p)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatEstimateCell(p.contractSum)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {p.contractorName ?? "—"}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {p.contractPeriod ?? "—"}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.cpcDate)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.edlpDate)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.cmgdIssuedDate)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.finalVoSubmittedDate)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatDateCell(p.finalVoApprovedDate)}
                          </td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {formatEstimateCell(p.finalContractSum)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className={desktopTdClass}>
                            <UnitPill unit={p.unit} />
                          </td>
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
                          <td className={desktopTdClass}>
                            <StageBadge stage={p.lifecycleStage} />
                          </td>
                          <td className={desktopTdClass}>
                            <RagBadge status={p.rag as "green" | "amber" | "red"} />
                          </td>
                        </>
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
