import { BudgetLineType, LifecycleStage, ProjectType } from "@prisma/client";
import { PROJECT_TYPE_LABELS } from "./project-labels";
import { STAGE_STATUS_LABELS } from "./project-labels";

export type ContractMatterProjectRow = {
  id: string;
  unit: string | null;
  tenderNo: string | null;
  quotationNo: string | null;
  contractNo: string | null;
  title: string;
  contractorName: string | null;
  startDate: string | null;
  completionDate: string | null;
  contractPeriod: string | null;
  contractSum: number | null;
  lifecycleStage: LifecycleStage;
  projectType: ProjectType | null;
  vote: string | null;
  ministry: string | null;
  department: string | null;
  toMonitor: boolean;
  allocation: number;
  warrantApproved: number;
  paymentsCertified: number;
};

export type ContractMatterLineRow = {
  lineId: string;
  projectId: string;
  lineType: BudgetLineType;
  unit: string | null;
  tenderNo: string | null;
  quotationNo: string | null;
  contractNo: string | null;
  title: string;
  contractorName: string | null;
  lifecycleStage: LifecycleStage;
  projectType: ProjectType | null;
  vote: string | null;
  ministry: string | null;
  department: string | null;
  date: string | null;
  claimDate: string | null;
  description: string | null;
  amountApproved: number;
  amountCertified: number | null;
  amountBalance: number | null;
  voucherRef: string | null;
};

export type ContractMatterVariationOrderRow = {
  id: string;
  projectId: string;
  unit: string | null;
  title: string;
  quotationNo: string | null;
  contractNo: string | null;
  contractorName: string | null;
  quotationContractAmount: number | null;
  voNo: string | null;
  voAmount: number;
  submittedDate: string | null;
  approvedDate: string | null;
  lifecycleStage: LifecycleStage;
  projectType: ProjectType | null;
  vote: string | null;
  ministry: string | null;
  department: string | null;
};

export type ContractMatterEotRow = {
  id: string;
  projectId: string;
  unit: string | null;
  title: string;
  quotationNo: string | null;
  contractNo: string | null;
  contractorName: string | null;
  contractPeriod: string | null;
  eotNo: string | null;
  eotPeriod: string | null;
  startDate: string | null;
  completionDate: string | null;
  revisedCompletionDate: string | null;
  submittedDate: string | null;
  approvedDate: string | null;
  lifecycleStage: LifecycleStage;
  projectType: ProjectType | null;
  vote: string | null;
  ministry: string | null;
  department: string | null;
};

export type ContractMatterJobOrderRow = {
  id: string;
  projectId: string;
  unit: string | null;
  title: string;
  quotationNo: string | null;
  contractNo: string | null;
  contractorName: string | null;
  contractAmount: number | null;
  fsorPercent: number | null;
  joNo: string | null;
  joAmount: number;
  joStart: string | null;
  actualJoFinish: string | null;
  joEdlpDue: string | null;
  cmgdIssued: string | null;
  lifecycleStage: LifecycleStage;
  projectType: ProjectType | null;
  vote: string | null;
  ministry: string | null;
  department: string | null;
};

/** Payment/Claims table column widths — adjust widthPercent as needed. */
export const PAYMENT_CLAIMS_TABLE_COLUMNS = [
  { id: "unit", label: "Unit", widthPercent: 5 },
  { id: "project", label: "Project", widthPercent: 13 },
  { id: "quotationContractNo", label: "Quotation / contract no.", widthPercent: 11 },
  { id: "contractor", label: "Contractor", widthPercent: 12 },
  { id: "contractAmount", label: "Contract amount", widthPercent: 8 },
  { id: "joPaymentDescription", label: "JO No/Payment Description", widthPercent: 8 },
  { id: "claimDate", label: "Claim date", widthPercent: 6.375 },
  { id: "claimCertified", label: "Claim certified", widthPercent: 8 },
  { id: "poId", label: "PO ID", widthPercent: 8 },
  { id: "poAmount", label: "PO amount", widthPercent: 8 },
  { id: "sesDate", label: "SES date", widthPercent: 6.375 },
  { id: "invoiceDate", label: "Invoice date", widthPercent: 6.375 },
  { id: "eDispatchedDate", label: "E-dispatched date", widthPercent: 6.375 },
  { id: "eDispatchRef", label: "E-Dispatch Ref", widthPercent: 8 },
  { id: "paidDate", label: "Paid date", widthPercent: 6.375 },
] as const;

export type PaymentClaimSource = "job-order" | "payment-valuation";

export type ContractMatterPurchaseOrderRow = {
  id: string;
  claimSource?: PaymentClaimSource;
  projectId: string;
  unit: string | null;
  title: string;
  quotationNo: string | null;
  contractNo: string | null;
  contractorName: string | null;
  contractAmount: number | null;
  joNo: string | null;
  paymentDescription: string | null;
  claimDate: string | null;
  claimCertified: number | null;
  poAmount: number;
  poId: string | null;
  sesDate: string | null;
  invoiceDate: string | null;
  eDispatchedDate: string | null;
  eDispatchRef: string | null;
  paidDate: string | null;
  lifecycleStage: LifecycleStage;
  projectType: ProjectType | null;
  vote: string | null;
  ministry: string | null;
  department: string | null;
};

export type ContractMatterRequestRow = {
  id: string;
  unit: string | null;
  ticketNo: string | null;
  complainant: string | null;
  contactNo: string | null;
  address: string | null;
  complaintReceived: string | null;
  receivedMethod: string | null;
  typeOfComplaint: string | null;
  status: string | null;
};

export function projectMatchesContractMatterSearch(
  p: Pick<
    ContractMatterProjectRow,
    | "title"
    | "tenderNo"
    | "quotationNo"
    | "contractNo"
    | "contractorName"
    | "unit"
    | "vote"
    | "ministry"
    | "department"
    | "projectType"
  >,
  query: string
) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    p.title,
    p.tenderNo,
    p.quotationNo,
    p.contractNo,
    p.contractorName,
    p.unit,
    p.vote,
    p.ministry,
    p.department,
    p.projectType ? PROJECT_TYPE_LABELS[p.projectType] : null,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function collectContractMatterFilterOptions(
  projects: ContractMatterProjectRow[]
) {
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

export function filterContractMatterProjects(
  projects: ContractMatterProjectRow[],
  filters: {
    search: string;
    unit: string;
    vote: string;
    contractor: string;
    projectType: string;
    projectStatus: string;
    ministry: string;
    department: string;
  }
) {
  return projects.filter((p) => {
    if (!projectMatchesContractMatterSearch(p, filters.search)) return false;
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
  });
}

export function filterContractMatterLines(
  lines: ContractMatterLineRow[],
  filters: {
    search: string;
    unit: string;
    vote: string;
    contractor: string;
    projectType: string;
    projectStatus: string;
    ministry: string;
    department: string;
  }
) {
  return lines.filter((row) => {
    const pseudo: ContractMatterProjectRow = {
      id: row.projectId,
      unit: row.unit,
      tenderNo: row.tenderNo,
      quotationNo: row.quotationNo,
      contractNo: row.contractNo,
      title: row.title,
      contractorName: row.contractorName,
      startDate: null,
      completionDate: null,
      contractPeriod: null,
      contractSum: null,
      lifecycleStage: row.lifecycleStage,
      projectType: row.projectType,
      vote: row.vote,
      ministry: row.ministry,
      department: row.department,
      toMonitor: false,
      allocation: 0,
      warrantApproved: 0,
      paymentsCertified: 0,
    };
    if (!projectMatchesContractMatterSearch(pseudo, filters.search)) return false;
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

export function filterVariationOrderRows(
  rows: ContractMatterVariationOrderRow[],
  filters: {
    search: string;
    unit: string;
    vote: string;
    contractor: string;
    projectType: string;
    projectStatus: string;
    ministry: string;
    department: string;
  }
) {
  return rows.filter((row) => {
    const q = filters.search.trim().toLowerCase();
    if (q) {
      const haystack = [
        row.title,
        row.quotationNo,
        row.contractNo,
        row.contractorName,
        row.unit,
        row.voNo,
        row.vote,
        row.ministry,
        row.department,
        row.projectType ? PROJECT_TYPE_LABELS[row.projectType] : null,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
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

export function filterEotRows(
  rows: ContractMatterEotRow[],
  filters: {
    search: string;
    unit: string;
    vote: string;
    contractor: string;
    projectType: string;
    projectStatus: string;
    ministry: string;
    department: string;
  }
) {
  return rows.filter((row) => {
    const q = filters.search.trim().toLowerCase();
    if (q) {
      const haystack = [
        row.title,
        row.quotationNo,
        row.contractNo,
        row.contractorName,
        row.unit,
        row.eotNo,
        row.eotPeriod,
        row.contractPeriod,
        row.vote,
        row.ministry,
        row.department,
        row.projectType ? PROJECT_TYPE_LABELS[row.projectType] : null,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
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

export function filterJobOrderRows(
  rows: ContractMatterJobOrderRow[],
  filters: {
    search: string;
    unit: string;
    vote: string;
    contractor: string;
    projectType: string;
    projectStatus: string;
    ministry: string;
    department: string;
  }
) {
  return rows.filter((row) => {
    const q = filters.search.trim().toLowerCase();
    if (q) {
      const haystack = [
        row.title,
        row.quotationNo,
        row.contractNo,
        row.contractorName,
        row.unit,
        row.joNo,
        row.vote,
        row.ministry,
        row.department,
        row.projectType ? PROJECT_TYPE_LABELS[row.projectType] : null,
        row.fsorPercent != null ? `${row.fsorPercent}%` : null,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
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

export function filterPurchaseOrderRows(
  rows: ContractMatterPurchaseOrderRow[],
  filters: {
    search: string;
    unit: string;
    vote: string;
    contractor: string;
    projectType: string;
    projectStatus: string;
    ministry: string;
    department: string;
  }
) {
  return rows.filter((row) => {
    const q = filters.search.trim().toLowerCase();
    if (q) {
      const haystack = [
        row.title,
        row.quotationNo,
        row.contractNo,
        row.contractorName,
        row.unit,
        row.vote,
        row.ministry,
        row.department,
        row.joNo,
        row.paymentDescription,
        row.poId,
        row.eDispatchRef,
        row.projectType ? PROJECT_TYPE_LABELS[row.projectType] : null,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
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

export function filterRequestRows(
  rows: ContractMatterRequestRow[],
  filters: {
    search: string;
    unit: string;
    vote: string;
    contractor: string;
    projectType: string;
    projectStatus: string;
    ministry: string;
    department: string;
  }
) {
  return rows.filter((row) => {
    const q = filters.search.trim().toLowerCase();
    if (q) {
      const haystack = [
        row.ticketNo,
        row.complainant,
        row.contactNo,
        row.address,
        row.unit,
        row.receivedMethod,
        row.typeOfComplaint,
        row.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.unit && row.unit !== filters.unit) return false;
    return true;
  });
}
