import { LifecycleStage, ProjectType } from "@prisma/client";

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  quotations: "Quotations",
  contract_works: "Contract Works",
  consultancy: "Consultancy",
  maintenance: "Maintenance",
  other: "Other",
};

export const STAGE_STATUS_LABELS: Record<LifecycleStage, string> = {
  planning: "Feasibility Study",
  pre_contract: "Pre-Contract",
  contract: "Contract",
  ongoing: "Ongoing",
  closed: "Completed",
};

export const PROJECT_TAB_GROUPS = [
  {
    id: "pre-award",
    label: "Pre-award",
    tabs: [
      { id: "design", label: "Design" },
      { id: "tendering", label: "Tendering" },
      { id: "documents", label: "Other documents" },
    ],
  },
  {
    id: "contract",
    label: "Contract",
    tabs: [
      { id: "contract-details", label: "Details" },
      { id: "contract-dates", label: "Dates" },
      { id: "contract-amounts", label: "Amounts" },
    ],
  },
  {
    id: "progress",
    label: "Progress & budget",
    tabs: [
      { id: "completion", label: "Completion" },
      { id: "financials", label: "Financials" },
      { id: "status", label: "Status update" },
    ],
  },
  {
    id: "records",
    label: "Records",
    tabs: [{ id: "history", label: "History" }],
  },
] as const;

export type ProjectTabId =
  (typeof PROJECT_TAB_GROUPS)[number]["tabs"][number]["id"];

export const PROJECT_TAB_IDS = new Set(
  PROJECT_TAB_GROUPS.flatMap((g) => g.tabs.map((t) => t.id))
);

export const DEFAULT_PROJECT_TAB: ProjectTabId = "design";

export function getTabGroupId(tabId: ProjectTabId): string {
  return (
    PROJECT_TAB_GROUPS.find((g) => g.tabs.some((t) => t.id === tabId))?.id ??
    "pre-award"
  );
}
