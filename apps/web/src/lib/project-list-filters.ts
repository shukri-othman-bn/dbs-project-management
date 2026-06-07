import { LifecycleStage, ProjectType } from "@prisma/client";
import { PROJECT_TYPE_LABELS, STAGE_STATUS_LABELS } from "./project-labels";
import type { MasterListFilterState } from "@/lib/master-list-filters";

/** All Projects table column widths — must total 100. Adjust widthPercent as needed. */
export const ALL_PROJECTS_TABLE_COLUMNS = [
  { id: "unit", label: "Unit", widthPercent: 8 },
  { id: "projectTitle", label: "Project title", widthPercent: 32 },
  { id: "ministry", label: "Ministry", widthPercent: 18 },
  { id: "department", label: "Department", widthPercent: 18 },
  { id: "vote", label: "Vote", widthPercent: 10 },
  { id: "status", label: "Status", widthPercent: 14 },
] as const;

/** BCA table column widths — must total 100. Adjust widthPercent as needed. */
export const BCA_TABLE_COLUMNS = [
  { id: "unit", label: "Unit", widthPercent: 8 },
  { id: "projectTitle", label: "Project title", widthPercent: 30 },
  { id: "dateAssigned", label: "Date assigned", widthPercent: 12 },
  { id: "dateDue", label: "Date due", widthPercent: 12 },
  { id: "dateCompleted", label: "Date completed", widthPercent: 12 },
  { id: "estimate", label: "Estimate", widthPercent: 14 },
  { id: "letterDate", label: "Letter date", widthPercent: 12 },
] as const;

/** Feasibility table column widths — must total 100. Adjust widthPercent as needed. */
export const FEASIBILITY_TABLE_COLUMNS = [
  { id: "unit", label: "Unit", widthPercent: 7 },
  { id: "projectTitle", label: "Project title", widthPercent: 16 },
  { id: "ministry", label: "Ministry", widthPercent: 10 },
  { id: "department", label: "Department", widthPercent: 10 },
  { id: "requestDate", label: "Request date", widthPercent: 9 },
  { id: "siteInspection", label: "Site inspection", widthPercent: 9 },
  { id: "estimate", label: "Estimate", widthPercent: 9 },
  { id: "proposedPeriod", label: "Proposed period", widthPercent: 10 },
  { id: "estimateSubmitted", label: "Estimate submitted", widthPercent: 10 },
  { id: "dateClientConfirm", label: "Date client confirm", widthPercent: 10 },
] as const;

/** Keep in view table column widths — Feasibility without date client confirm; must total 100. */
export const KEEP_IN_VIEW_TABLE_COLUMNS = [
  { id: "unit", label: "Unit", widthPercent: 8 },
  { id: "projectTitle", label: "Project title", widthPercent: 18 },
  { id: "ministry", label: "Ministry", widthPercent: 11 },
  { id: "department", label: "Department", widthPercent: 11 },
  { id: "requestDate", label: "Request date", widthPercent: 10 },
  { id: "siteInspection", label: "Site inspection", widthPercent: 10 },
  { id: "estimate", label: "Estimate", widthPercent: 10 },
  { id: "proposedPeriod", label: "Proposed period", widthPercent: 11 },
  { id: "estimateSubmitted", label: "Estimate submitted", widthPercent: 11 },
] as const;

/** Design table column widths — must total 100. Adjust widthPercent as needed. */
export const DESIGN_TABLE_COLUMNS = [
  { id: "unit", label: "Unit", widthPercent: 8 },
  { id: "projectTitle", label: "Project title", widthPercent: 18 },
  { id: "ministry", label: "Ministry", widthPercent: 10 },
  { id: "department", label: "Department", widthPercent: 10 },
  { id: "dateConfirmed", label: "Date confirmed", widthPercent: 8 },
  { id: "vote", label: "Vote", widthPercent: 12 },
  { id: "estimate", label: "Estimate", widthPercent: 10 },
  { id: "quotationTenderDueDate", label: "Quotation/tender due date", widthPercent: 12 },
  { id: "actualQuotationTenderDate", label: "Actual quotation/tender date", widthPercent: 12 },
] as const;

/** Tender/Quotation table column widths — must total 100. Adjust widthPercent as needed. */
export const TENDER_QUOTATION_TABLE_COLUMNS = [
  { id: "unit", label: "Unit", widthPercent: 6 },
  { id: "projectTitle", label: "Project title", widthPercent: 14 },
  { id: "department", label: "Department", widthPercent: 8 },
  { id: "tenderQuotationNo", label: "Tender no./quotation no.", widthPercent: 10 },
  { id: "openDate", label: "Open date", widthPercent: 8 },
  { id: "closeDate", label: "Close date", widthPercent: 8 },
  { id: "extendedDate", label: "Extended date", widthPercent: 8 },
  { id: "receivedDate", label: "Tender/quotation received", widthPercent: 9 },
  {
    id: "assessmentSubmitted",
    label: "Assessment submitted to SBM/DBSO",
    widthPercent: 11,
  },
  { id: "approvedDate", label: "Quotation/tender approved", widthPercent: 9 },
  { id: "loaIssued", label: "LOA issued", widthPercent: 9 },
] as const;

/** On-Going table column widths — must total 100. Adjust widthPercent as needed. */
export const ON_GOING_TABLE_COLUMNS = [
  { id: "unit", label: "Unit", widthPercent: 5 },
  { id: "projectTitle", label: "Project title", widthPercent: 14 },
  { id: "tenderQuotationNo", label: "Tender no./quotation no.", widthPercent: 7 },
  { id: "contractSum", label: "Contract sum", widthPercent: 7 },
  { id: "contractor", label: "Contractor", widthPercent: 7 },
  { id: "contractPeriod", label: "Contract period", widthPercent: 6 },
  { id: "loaIssued", label: "LOA issued", widthPercent: 6 },
  { id: "sitePossession", label: "Site possession", widthPercent: 6 },
  { id: "startDate", label: "Start date", widthPercent: 6 },
  { id: "finishDate", label: "Finish date", widthPercent: 6 },
  { id: "eotDate", label: "EOT date", widthPercent: 6 },
  { id: "cncDate", label: "CNC date", widthPercent: 6 },
  { id: "cpcDate", label: "CPC date", widthPercent: 6 },
  { id: "physicalProgress", label: "Physical progress %", widthPercent: 6 },
] as const;

/** Completed table column widths — must total 100. Adjust widthPercent as needed. */
export const COMPLETED_TABLE_COLUMNS = [
  { id: "unit", label: "Unit", widthPercent: 8 },
  { id: "projectTitle", label: "Project title", widthPercent: 18 },
  { id: "tenderQuotationNo", label: "Tender no./quotation no.", widthPercent: 12 },
  { id: "contractSum", label: "Contract sum", widthPercent: 10 },
  { id: "contractor", label: "Contractor", widthPercent: 10 },
  { id: "contractPeriod", label: "Contract period", widthPercent: 8 },
  { id: "cpcDate", label: "CPC date", widthPercent: 6 },
  { id: "edlpDate", label: "EDLP date", widthPercent: 6 },
  { id: "cmgdIssued", label: "CMGD issued", widthPercent: 6 },
  { id: "finalVoSubmitted", label: "Final VO submitted", widthPercent: 6 },
  { id: "finalVoApproved", label: "Final VO approved", widthPercent: 5 },
  { id: "finalContractSum", label: "Final contract sum", widthPercent: 5 },
] as const;

export type ConfiguredProjectsTableLayout =
  | "all-projects"
  | "bca"
  | "feasibility"
  | "keep-in-view"
  | "design"
  | "tender-quotation"
  | "on-going"
  | "completed";

export const CONFIGURED_PROJECTS_TABLE_COLUMNS: Record<
  ConfiguredProjectsTableLayout,
  readonly { id: string; label: string; widthPercent: number }[]
> = {
  "all-projects": ALL_PROJECTS_TABLE_COLUMNS,
  bca: BCA_TABLE_COLUMNS,
  feasibility: FEASIBILITY_TABLE_COLUMNS,
  "keep-in-view": KEEP_IN_VIEW_TABLE_COLUMNS,
  design: DESIGN_TABLE_COLUMNS,
  "tender-quotation": TENDER_QUOTATION_TABLE_COLUMNS,
  "on-going": ON_GOING_TABLE_COLUMNS,
  completed: COMPLETED_TABLE_COLUMNS,
};

export const PROJECT_LIST_TABS = [
  { id: "all", label: "All Projects" },
  { id: "bca", label: "BCA" },
  { id: "feasibility", label: "Feasibility" },
  { id: "design", label: "Design" },
  { id: "tender-quotation", label: "Tender/Quotation" },
  { id: "on-going", label: "On-Going" },
  { id: "completed", label: "Completed" },
  { id: "keep-in-view", label: "Keep in view" },
] as const;

export type ProjectListTabId = (typeof PROJECT_LIST_TABS)[number]["id"];

export type ProjectListRow = {
  id: string;
  projectNumber: string;
  title: string;
  lifecycleStage: LifecycleStage;
  projectType: ProjectType | null;
  quotationOrContractNo: string | null;
  contractorName: string | null;
  toMonitor: boolean;
  unit: string | null;
  vote: string | null;
  designProjectNo: string | null;
  tenderNo: string | null;
  oicName: string | null;
  ministry: string | null;
  department: string | null;
  physicalActual: number;
  utilizationPct: number;
  paymentsCertified: number;
  rag: string;
  completionDate: string | null;
  cpcDate: string | null;
  finalAccountDate: string | null;
  defectsLiabilityEnd: string | null;
  tenderOpenDate: string | null;
  tenderClosingDate: string | null;
  tenderExtendedDate: string | null;
  tenderApprovedDate: string | null;
  tenderRemarks: string | null;
  bcaDateAssigned: string | null;
  bcaDateDue: string | null;
  bcaDateCompleted: string | null;
  bcaEstimate: number | null;
  bcaLetterDate: string | null;
  feasibilityRequestDate: string | null;
  feasibilitySiteInspection: string | null;
  feasibilityEstimate: number | null;
  feasibilityProposedPeriod: string | null;
  feasibilityEstimateSubmitted: string | null;
  feasibilityDateClientConfirm: string | null;
  designDateConfirmed: string | null;
  designEstimate: number | null;
  designQuotationTenderDueDate: string | null;
  designActualQuotationTenderDate: string | null;
  tenderReceivedDate: string | null;
  tenderAssessmentSubmittedDate: string | null;
  tenderLoaDate: string | null;
  contractSum: number | null;
  contractPeriod: string | null;
  loaIssuedDate: string | null;
  sitePossessionDate: string | null;
  contractStartDate: string | null;
  contractFinishDate: string | null;
  latestEotDate: string | null;
  cncDate: string | null;
  edlpDate: string | null;
  cmgdIssuedDate: string | null;
  finalVoSubmittedDate: string | null;
  finalVoApprovedDate: string | null;
  finalContractSum: number | null;
};

export function formatTenderQuotationNo(project: ProjectListRow) {
  return project.tenderNo ?? project.quotationOrContractNo ?? "—";
}

function hasDesignActivity(p: ProjectListRow) {
  return Boolean(p.vote || p.designProjectNo);
}

function hasTenderingActivity(p: ProjectListRow) {
  return Boolean(
    p.tenderNo || p.tenderOpenDate || p.tenderClosingDate || p.tenderApprovedDate
  );
}

export function projectMatchesTab(p: ProjectListRow, tab: ProjectListTabId) {
  if (tab === "all") return true;
  if (tab === "keep-in-view") return p.toMonitor;
  if (tab === "feasibility") {
    return p.lifecycleStage === "planning" && !hasDesignActivity(p);
  }
  if (tab === "bca") {
    return p.lifecycleStage === "planning" && hasDesignActivity(p);
  }
  if (tab === "design") {
    return p.lifecycleStage === "pre_contract" && !hasTenderingActivity(p);
  }
  if (tab === "tender-quotation") {
    return (
      (p.lifecycleStage === "pre_contract" && hasTenderingActivity(p)) ||
      p.lifecycleStage === "contract"
    );
  }
  if (tab === "on-going") return p.lifecycleStage === "ongoing";
  if (tab === "completed") return p.lifecycleStage === "closed";
  return true;
}

export function getTabLabel(tab: ProjectListTabId) {
  return PROJECT_LIST_TABS.find((t) => t.id === tab)?.label ?? tab;
}

export function projectMatchesSearch(p: ProjectListRow, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    p.projectNumber,
    p.title,
    p.tenderNo,
    p.quotationOrContractNo,
    p.contractorName,
    p.unit,
    p.vote,
    p.designProjectNo,
    p.ministry,
    p.department,
    p.oicName,
    p.projectType ? PROJECT_TYPE_LABELS[p.projectType] : null,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function collectFilterOptions(projects: ProjectListRow[]) {
  const units = new Set<string>();
  const votes = new Set<string>();
  const contractors = new Set<string>();
  const projectTypes = new Set<ProjectType>();
  const statuses = new Set<string>();
  const ministries = new Set<string>();
  const departments = new Set<string>();

  for (const p of projects) {
    if (p.unit) units.add(p.unit);
    if (p.vote) votes.add(p.vote);
    if (p.contractorName) contractors.add(p.contractorName);
    if (p.projectType) projectTypes.add(p.projectType);
    statuses.add(STAGE_STATUS_LABELS[p.lifecycleStage]);
    if (p.ministry) ministries.add(p.ministry);
    if (p.department) departments.add(p.department);
  }

  return {
    units: [...units].sort(),
    votes: [...votes].sort(),
    contractors: [...contractors].sort(),
    projectTypes: [...projectTypes].sort((a, b) =>
      PROJECT_TYPE_LABELS[a].localeCompare(PROJECT_TYPE_LABELS[b])
    ),
    statuses: [...statuses].sort(),
    ministries: [...ministries].sort(),
    departments: [...departments].sort(),
  };
}

export function projectMatchesDropdownFilters(
  p: ProjectListRow,
  filters: Pick<
    MasterListFilterState,
    "search" | "unit" | "vote" | "contractor" | "projectType" | "projectStatus" | "ministry" | "department"
  >
) {
  if (!projectMatchesSearch(p, filters.search)) return false;
  if (filters.unit && p.unit !== filters.unit) return false;
  if (filters.vote && p.vote !== filters.vote) return false;
  if (filters.contractor && p.contractorName !== filters.contractor) return false;
  if (filters.projectType && p.projectType !== filters.projectType) return false;
  if (
    filters.projectStatus &&
    STAGE_STATUS_LABELS[p.lifecycleStage] !== filters.projectStatus
  ) {
    return false;
  }
  if (filters.ministry && p.ministry !== filters.ministry) return false;
  if (filters.department && p.department !== filters.department) return false;
  return true;
}

export function filterProjects(
  projects: ProjectListRow[],
  {
    tab,
    ...filters
  }: MasterListFilterState & {
    tab: ProjectListTabId;
  }
) {
  return projects.filter((p) => {
    if (!projectMatchesTab(p, tab)) return false;
    return projectMatchesDropdownFilters(p, filters);
  });
}

export function countByTab(projects: ProjectListRow[]) {
  return Object.fromEntries(
    PROJECT_LIST_TABS.map((t) => [
      t.id,
      projects.filter((p) => projectMatchesTab(p, t.id)).length,
    ])
  ) as Record<ProjectListTabId, number>;
}
