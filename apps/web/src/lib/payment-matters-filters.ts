import { LifecycleStage, ProjectType } from "@prisma/client";
import { PROJECT_TYPE_LABELS, STAGE_STATUS_LABELS } from "./project-labels";
import { projectMatchesContractMatterSearch } from "./contract-matters-filters";

export const PAYMENT_MATTER_TABS = [
  { id: "pre-certified", label: "Pre-certified" },
  { id: "ses-e-invoice", label: "SES & E-invoice" },
  { id: "release-retention", label: "Release of Retention Money" },
  { id: "e-dispatched", label: "E-Dispatched" },
  { id: "paid", label: "Paid" },
  { id: "direct-invoice", label: "Direct Invoice & Inter Government Bill" },
  { id: "po-invoice", label: "PO - Invoice" },
  { id: "all", label: "All payment" },
] as const;

export type PaymentMatterTabId = (typeof PAYMENT_MATTER_TABS)[number]["id"];

export const PAYMENT_MATTER_TAB_IDS = new Set(PAYMENT_MATTER_TABS.map((t) => t.id));

export const DEFAULT_PAYMENT_MATTER_TAB: PaymentMatterTabId = "pre-certified";

export type PaymentMatterStatus =
  | "in-process"
  | "claim-received"
  | "query"
  | "paid";

export type PaymentMatterRow = {
  lineId: string;
  projectId: string;
  unit: string | null;
  tenderNo: string | null;
  projectReference: string | null;
  projectTitle: string;
  paymentNo: string;
  certifiedAmount: number | null;
  contractorName: string | null;
  lifecycleStage: LifecycleStage;
  projectType: ProjectType | null;
  vote: string | null;
  ministry: string | null;
  department: string | null;
  status: PaymentMatterStatus;
  processTab: PaymentMatterTabId;
};

const PROGRESS_LABELS = [
  "1st Progress",
  "2nd Progress",
  "3rd Progress",
  "4th Progress",
  "5th Progress",
];

export function getPaymentMatterTabLabel(tab: PaymentMatterTabId) {
  return PAYMENT_MATTER_TABS.find((t) => t.id === tab)?.label ?? tab;
}

export function getPaymentMatterStatusLabel(status: PaymentMatterStatus) {
  switch (status) {
    case "in-process":
      return "In process";
    case "claim-received":
      return "Claim received";
    case "query":
      return "Query";
    case "paid":
      return "Paid";
  }
}

function descriptionMatches(desc: string | null, patterns: RegExp[]) {
  if (!desc) return false;
  const lower = desc.toLowerCase();
  return patterns.some((p) => p.test(lower));
}

export function derivePaymentProcessTab(row: {
  description: string | null;
  amountApproved: number;
  amountCertified: number | null;
  voucherRef: string | null;
}): PaymentMatterTabId {
  const desc = row.description;

  if (descriptionMatches(desc, [/retention/])) return "release-retention";
  if (descriptionMatches(desc, [/ses/, /e-?invoice/, /einvoice/])) return "ses-e-invoice";
  if (descriptionMatches(desc, [/direct invoice/, /inter government/, /\bigb\b/])) {
    return "direct-invoice";
  }
  if (descriptionMatches(desc, [/\bpo\b/, /purchase order/, /po invoice/])) {
    return "po-invoice";
  }

  if (row.voucherRef) return "paid";

  if (
    row.amountCertified != null &&
    Math.abs(row.amountCertified - row.amountApproved) > 0.01
  ) {
    return "e-dispatched";
  }

  if (row.amountCertified != null) return "pre-certified";

  return "pre-certified";
}

export function derivePaymentStatus(row: {
  amountApproved: number;
  amountCertified: number | null;
  voucherRef: string | null;
}): PaymentMatterStatus {
  if (row.voucherRef) return "paid";
  if (row.amountCertified == null) return "claim-received";
  if (Math.abs(row.amountCertified - row.amountApproved) > 0.01) return "query";
  return "in-process";
}

export function derivePaymentNo(description: string | null, index: number) {
  if (description) {
    const trimmed = description.trim();
    if (/progress payment/i.test(trimmed)) {
      return PROGRESS_LABELS[index] ?? `${index + 1}th Progress`;
    }
    if (trimmed.length <= 40) return trimmed;
  }
  return PROGRESS_LABELS[index] ?? `${index + 1}th Progress`;
}

export function paymentMatterMatchesSearch(row: PaymentMatterRow, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  if (
    projectMatchesContractMatterSearch(
      {
        title: row.projectTitle,
        tenderNo: row.tenderNo,
        quotationNo: row.projectReference,
        contractNo: row.projectReference,
        contractorName: row.contractorName,
        unit: row.unit,
        vote: row.vote,
        ministry: row.ministry,
        department: row.department,
        projectType: row.projectType,
      },
      query
    )
  ) {
    return true;
  }

  return [
    row.paymentNo,
    getPaymentMatterStatusLabel(row.status),
    getPaymentMatterTabLabel(row.processTab),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function collectPaymentMatterFilterOptions(rows: PaymentMatterRow[]) {
  const units = new Set<string>();
  const votes = new Set<string>();
  const contractors = new Set<string>();
  const projectTypes = new Set<ProjectType>();
  const statuses = new Set<string>();
  const ministries = new Set<string>();
  const departments = new Set<string>();

  for (const row of rows) {
    if (row.unit) units.add(row.unit);
    if (row.vote) votes.add(row.vote);
    if (row.contractorName) contractors.add(row.contractorName);
    if (row.projectType) projectTypes.add(row.projectType);
    statuses.add(STAGE_STATUS_LABELS[row.lifecycleStage]);
    if (row.ministry) ministries.add(row.ministry);
    if (row.department) departments.add(row.department);
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

export type PaymentMatterDropdownFilters = {
  search: string;
  unit: string;
  vote: string;
  contractor: string;
  projectType: string;
  projectStatus: string;
  ministry: string;
  department: string;
  tab: PaymentMatterTabId;
};

export function filterPaymentMatterRows(
  rows: PaymentMatterRow[],
  filters: PaymentMatterDropdownFilters
) {
  return rows.filter((row) => {
    if (filters.tab !== "all" && row.processTab !== filters.tab) return false;
    if (!paymentMatterMatchesSearch(row, filters.search)) return false;
    if (filters.unit && row.unit !== filters.unit) return false;
    if (filters.vote && row.vote !== filters.vote) return false;
    if (filters.contractor && row.contractorName !== filters.contractor) return false;
    if (filters.projectType && row.projectType !== filters.projectType) return false;
    if (
      filters.projectStatus &&
      STAGE_STATUS_LABELS[row.lifecycleStage] !== filters.projectStatus
    ) {
      return false;
    }
    if (filters.ministry && row.ministry !== filters.ministry) return false;
    if (filters.department && row.department !== filters.department) return false;
    return true;
  });
}
