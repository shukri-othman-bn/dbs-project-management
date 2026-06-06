import type { getProjectsWithBudget } from "./data";
import { getUnitLabel } from "./units";
import type { ContractMatterLineRow, ContractMatterProjectRow, ContractMatterVariationOrderRow, ContractMatterEotRow, ContractMatterJobOrderRow, ContractMatterPurchaseOrderRow, ContractMatterRequestRow } from "./contract-matters-filters";
import type { getMatterRequests } from "./data";
import type { ContractorTrackRecordRow } from "./contractor-track-record";
import type { ProjectListRow } from "./project-list-filters";
import {
  derivePaymentNo,
  derivePaymentProcessTab,
  derivePaymentStatus,
  type PaymentMatterRow,
} from "./payment-matters-filters";

type ProjectWithBudget = Awaited<ReturnType<typeof getProjectsWithBudget>>[number];
type MatterRequestRecord = Awaited<ReturnType<typeof getMatterRequests>>[number];

export function toProjectListRow(p: ProjectWithBudget): ProjectListRow {
  return {
    id: p.id,
    projectNumber: p.projectNumber,
    title: p.title,
    lifecycleStage: p.lifecycleStage,
    projectType: p.projectType,
    quotationOrContractNo: p.quotationOrContractNo,
    contractorName: p.contractorName ?? p.contract?.mainContractor ?? null,
    toMonitor: p.toMonitor,
    unit: getUnitLabel(p.section),
    vote: p.design?.vote ?? null,
    tenderNo: p.tendering?.tenderNo ?? null,
    oicName: p.oic?.name ?? null,
    ministry: p.client?.ministry ?? null,
    department: p.client?.department ?? null,
    physicalActual: p.latestStatus?.physicalActual ?? 0,
    utilizationPct: p.totals.utilizationPct,
    paymentsCertified: p.totals.paymentsCertified,
    rag: p.totals.rag,
    completionDate: p.completion?.completionDate?.toISOString() ?? null,
    tenderOpenDate: p.tendering?.openDate?.toISOString() ?? null,
    tenderClosingDate: p.tendering?.closingDate?.toISOString() ?? null,
    tenderExtendedDate: p.tendering?.extendedClosingDate?.toISOString() ?? null,
    tenderApprovedDate: p.tendering?.approvedDate?.toISOString() ?? null,
    tenderRemarks: p.tendering?.adRemarks ?? p.tendering?.tenderValidityRemarks ?? null,
  };
}

export function toContractorTrackRecordRow(p: ProjectWithBudget): ContractorTrackRecordRow {
  const start =
    p.contract?.contractStart ??
    p.tendering?.startDateInLoa ??
    p.tendering?.awardedDate ??
    null;
  const completion =
    p.completion?.completionDate ??
    p.contract?.revisedContractFinish ??
    p.contract?.contractFinish ??
    null;
  const cpc = p.contract?.cpcDate ?? p.contract?.cpcIssued ?? null;

  return {
    id: p.id,
    contractorName: p.contractorName ?? p.contract?.mainContractor ?? null,
    tenderNo: p.tendering?.tenderNo ?? null,
    quotationOrContractNo: p.quotationOrContractNo ?? p.contract?.contractNo ?? null,
    title: p.title,
    contractorRating: null,
    startDate: start?.toISOString() ?? null,
    completionDate: completion?.toISOString() ?? null,
    cpcDate: cpc?.toISOString() ?? null,
    contractSum: p.contract?.revisedContractSum ?? p.contract?.contractSum ?? null,
    lifecycleStage: p.lifecycleStage,
  };
}

export function toContractMatterProjectRow(p: ProjectWithBudget): ContractMatterProjectRow {
  const start =
    p.contract?.contractStart ??
    p.tendering?.startDateInLoa ??
    p.tendering?.awardedDate ??
    null;
  const completion =
    p.completion?.completionDate ??
    p.contract?.revisedContractFinish ??
    p.contract?.contractFinish ??
    null;

  return {
    id: p.id,
    unit: getUnitLabel(p.section),
    tenderNo: p.tendering?.tenderNo ?? null,
    quotationNo: p.quotationOrContractNo ?? null,
    contractNo: p.contract?.contractNo ?? null,
    title: p.title,
    contractorName: p.contractorName ?? p.contract?.mainContractor ?? null,
    startDate: start?.toISOString() ?? null,
    completionDate: completion?.toISOString() ?? null,
    contractPeriod: p.contract?.contractPeriod ?? p.design?.contractPeriod ?? null,
    contractSum: p.contract?.revisedContractSum ?? p.contract?.contractSum ?? null,
    lifecycleStage: p.lifecycleStage,
    projectType: p.projectType,
    vote: p.design?.vote ?? null,
    ministry: p.client?.ministry ?? null,
    department: p.client?.department ?? null,
    toMonitor: p.toMonitor,
    allocation: p.totals.allocation,
    warrantApproved: p.totals.warrantApproved,
    paymentsCertified: p.totals.paymentsCertified,
  };
}

export function toContractMatterLineRows(p: ProjectWithBudget): ContractMatterLineRow[] {
  const base = {
    projectId: p.id,
    unit: getUnitLabel(p.section),
    tenderNo: p.tendering?.tenderNo ?? null,
    quotationNo: p.quotationOrContractNo ?? null,
    contractNo: p.contract?.contractNo ?? null,
    title: p.title,
    contractorName: p.contractorName ?? p.contract?.mainContractor ?? null,
    lifecycleStage: p.lifecycleStage,
    projectType: p.projectType,
    vote: p.design?.vote ?? null,
    ministry: p.client?.ministry ?? null,
    department: p.client?.department ?? null,
  };

  return p.budgetLines.map((line) => ({
    lineId: line.id,
    lineType: line.type,
    date: line.date?.toISOString() ?? null,
    claimDate: line.claimDate?.toISOString() ?? null,
    description: line.description,
    amountApproved: line.amountApproved,
    amountCertified: line.amountCertified,
    amountBalance: line.amountBalance,
    voucherRef: line.voucherRef,
    ...base,
  }));
}

function contractMatterRecordBase(p: ProjectWithBudget) {
  const quotationContractAmount =
    p.contract?.revisedContractSum ?? p.contract?.contractSum ?? null;

  return {
    projectId: p.id,
    unit: getUnitLabel(p.section),
    title: p.title,
    quotationNo: p.quotationOrContractNo ?? null,
    contractNo: p.contract?.contractNo ?? null,
    contractorName: p.contractorName ?? p.contract?.mainContractor ?? null,
    quotationContractAmount,
    lifecycleStage: p.lifecycleStage,
    projectType: p.projectType,
    vote: p.design?.vote ?? null,
    ministry: p.client?.ministry ?? null,
    department: p.client?.department ?? null,
  };
}

export function toContractMatterVariationOrderRows(
  p: ProjectWithBudget
): ContractMatterVariationOrderRow[] {
  const base = contractMatterRecordBase(p);

  return p.variationOrders.map((vo) => ({
    id: vo.id,
    voNo: vo.voNo,
    voAmount: vo.amount,
    submittedDate: vo.submittedDate?.toISOString() ?? null,
    approvedDate: vo.approvedDate?.toISOString() ?? null,
    ...base,
  }));
}

export function toContractMatterEotRows(p: ProjectWithBudget): ContractMatterEotRow[] {
  const {
    quotationContractAmount: _omit,
    ...base
  } = contractMatterRecordBase(p);

  const start =
    p.contract?.contractStart ??
    p.tendering?.startDateInLoa ??
    p.tendering?.awardedDate ??
    null;
  const completion =
    p.completion?.completionDate ??
    p.contract?.contractFinish ??
    null;
  const revisedCompletion = p.contract?.revisedContractFinish ?? null;

  const projectFields = {
    contractPeriod: p.contract?.contractPeriod ?? p.design?.contractPeriod ?? null,
    startDate: start?.toISOString() ?? null,
    completionDate: completion?.toISOString() ?? null,
    revisedCompletionDate: revisedCompletion?.toISOString() ?? null,
  };

  return p.extensionOfTimes.map((eot) => ({
    id: eot.id,
    eotNo: eot.eotNo,
    eotPeriod: eot.eotPeriod,
    submittedDate: eot.submittedDate?.toISOString() ?? null,
    approvedDate: eot.approvedDate?.toISOString() ?? null,
    ...base,
    ...projectFields,
  }));
}

export function toContractMatterJobOrderRows(p: ProjectWithBudget): ContractMatterJobOrderRow[] {
  const base = contractMatterRecordBase(p);

  return p.jobOrders.map((jo) => ({
    id: jo.id,
    contractAmount: base.quotationContractAmount,
    fsorPercent: jo.fsorPercent,
    joNo: jo.joNo,
    joAmount: jo.joAmount,
    joStart: jo.joStart?.toISOString() ?? null,
    actualJoFinish: jo.actualJoFinish?.toISOString() ?? null,
    joEdlpDue: jo.joEdlpDue?.toISOString() ?? null,
    cmgdIssued: jo.cmgdIssued?.toISOString() ?? null,
    projectId: base.projectId,
    unit: base.unit,
    title: base.title,
    quotationNo: base.quotationNo,
    contractNo: base.contractNo,
    contractorName: base.contractorName,
    lifecycleStage: base.lifecycleStage,
    projectType: base.projectType,
    vote: base.vote,
    ministry: base.ministry,
    department: base.department,
  }));
}

export function toContractMatterPurchaseOrderRows(
  p: ProjectWithBudget
): ContractMatterPurchaseOrderRow[] {
  const base = contractMatterRecordBase(p);

  return p.purchaseOrders.map((po) => ({
    id: po.id,
    contractAmount: base.quotationContractAmount,
    claimDate: po.claimDate?.toISOString() ?? null,
    claimCertified: po.claimCertified,
    poAmount: po.poAmount,
    sesDate: po.sesDate?.toISOString() ?? null,
    invoiceDate: po.invoiceDate?.toISOString() ?? null,
    eDispatchedDate: po.eDispatchedDate?.toISOString() ?? null,
    paidDate: po.paidDate?.toISOString() ?? null,
    projectId: base.projectId,
    unit: base.unit,
    title: base.title,
    quotationNo: base.quotationNo,
    contractNo: base.contractNo,
    contractorName: base.contractorName,
    lifecycleStage: base.lifecycleStage,
    projectType: base.projectType,
    vote: base.vote,
    ministry: base.ministry,
    department: base.department,
  }));
}

export function toContractMatterRequestRow(r: MatterRequestRecord): ContractMatterRequestRow {
  return {
    id: r.id,
    unit: getUnitLabel(r.section),
    ticketNo: r.ticketNo,
    complainant: r.complainant,
    contactNo: r.contactNo,
    address: r.address,
    complaintReceived: r.complaintReceived?.toISOString() ?? null,
    receivedMethod: r.receivedMethod,
    typeOfComplaint: r.typeOfComplaint,
    status: r.status,
  };
}

export function toPaymentMatterRows(projects: ProjectWithBudget[]): PaymentMatterRow[] {
  const rows: PaymentMatterRow[] = [];

  for (const p of projects) {
    const paymentLines = p.budgetLines
      .filter((l) => l.type === "payment")
      .sort((a, b) => {
        const da = a.date?.getTime() ?? 0;
        const db = b.date?.getTime() ?? 0;
        return da - db;
      });

    paymentLines.forEach((line, index) => {
      const base = {
        description: line.description,
        amountApproved: line.amountApproved,
        amountCertified: line.amountCertified,
        voucherRef: line.voucherRef,
      };

      rows.push({
        lineId: line.id,
        projectId: p.id,
        unit: getUnitLabel(p.section),
        tenderNo: p.tendering?.tenderNo ?? null,
        projectReference: p.quotationOrContractNo ?? p.contract?.contractNo ?? p.projectNumber,
        projectTitle: p.title,
        paymentNo: derivePaymentNo(line.description, index),
        certifiedAmount: line.amountCertified,
        contractorName: p.contractorName ?? p.contract?.mainContractor ?? null,
        lifecycleStage: p.lifecycleStage,
        projectType: p.projectType,
        vote: p.design?.vote ?? null,
        ministry: p.client?.ministry ?? null,
        department: p.client?.department ?? null,
        status: derivePaymentStatus(base),
        processTab: derivePaymentProcessTab(base),
      });
    });
  }

  return rows;
}
