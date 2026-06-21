import { ContractCategory, LifecycleStage, ProjectType } from "@prisma/client";

export const CONTRACT_CATEGORY_LABELS: Record<ContractCategory, string> = {
  one_off_project: "One Off Project",
  fsor: "FSOR",
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  quotations: "Quotations",
  contract_works: "Contract Works",
  consultancy: "Consultancy",
  maintenance: "Maintenance",
  bca: "BCA",
  other: "Other",
};

export const PROJECT_TYPES: ProjectType[] = [
  "quotations",
  "contract_works",
  "consultancy",
  "maintenance",
  "bca",
  "other",
];

export const STAGE_STATUS_LABELS: Record<LifecycleStage, string> = {
  pre_design: "Pre-Design",
  design: "Design",
  quotation_tender: "Quotation/Tender",
  ongoing: "On-Going",
  completed: "Completed",
  keep_in_view: "Keep In View",
};

export const LIFECYCLE_STAGES: LifecycleStage[] = [
  "pre_design",
  "design",
  "quotation_tender",
  "ongoing",
  "completed",
  "keep_in_view",
];

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
      { id: "variation-orders", label: "Variation order" },
      { id: "extension-of-time", label: "Extension of time" },
    ],
  },
  {
    id: "progress",
    label: "Progress & budget",
    tabs: [
      { id: "physical-progress", label: "Physical progress" },
      { id: "financial-progress", label: "Financial progress" },
      { id: "financials", label: "Financials" },
      { id: "payment-valuation", label: "Payment Valuation" },
    ],
  },
  {
    id: "fsor",
    label: "FSOR",
    tabs: [{ id: "fsor", label: "FSOR app" }],
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
