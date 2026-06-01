import { LifecycleStage, ProjectType } from "@prisma/client";
import { PROJECT_TYPE_LABELS, STAGE_STATUS_LABELS } from "./project-labels";
import type { MasterListFilterState } from "@/lib/master-list-filters";

export const PROJECT_LIST_TABS = [
  { id: "all", label: "All projects" },
  { id: "bca", label: "BCA" },
  { id: "design", label: "Design" },
  { id: "tendering", label: "Tendering" },
  { id: "ongoing", label: "Ongoing" },
  { id: "completed", label: "Completed" },
  { id: "closed", label: "Closed" },
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
  tenderNo: string | null;
  oicName: string | null;
  ministry: string | null;
  department: string | null;
  physicalActual: number;
  utilizationPct: number;
  paymentsCertified: number;
  rag: string;
  completionDate: string | null;
  tenderOpenDate: string | null;
  tenderClosingDate: string | null;
  tenderExtendedDate: string | null;
  tenderApprovedDate: string | null;
  tenderRemarks: string | null;
};

function hasTenderingActivity(p: ProjectListRow) {
  return Boolean(
    p.tenderNo || p.tenderOpenDate || p.tenderClosingDate || p.tenderApprovedDate
  );
}

export function projectMatchesTab(p: ProjectListRow, tab: ProjectListTabId) {
  if (tab === "all") return true;
  if (tab === "keep-in-view") return p.toMonitor;
  if (tab === "bca") return p.lifecycleStage === "planning";
  if (tab === "design") {
    return p.lifecycleStage === "pre_contract" && !hasTenderingActivity(p);
  }
  if (tab === "tendering") {
    return (
      (p.lifecycleStage === "pre_contract" && hasTenderingActivity(p)) ||
      p.lifecycleStage === "contract"
    );
  }
  if (tab === "ongoing") return p.lifecycleStage === "ongoing";
  if (tab === "completed") {
    return p.lifecycleStage === "closed" && Boolean(p.completionDate);
  }
  if (tab === "closed") return p.lifecycleStage === "closed";
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
