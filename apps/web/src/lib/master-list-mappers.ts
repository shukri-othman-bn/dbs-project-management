import type { getProjectsWithBudget } from "./data";
import type { ContractMatterLineRow, ContractMatterProjectRow } from "./contract-matters-filters";
import type { ContractorTrackRecordRow } from "./contractor-track-record";
import type { ProjectListRow } from "./project-list-filters";
import {
  derivePaymentNo,
  derivePaymentProcessTab,
  derivePaymentStatus,
  type PaymentMatterRow,
} from "./payment-matters-filters";

type ProjectWithBudget = Awaited<ReturnType<typeof getProjectsWithBudget>>[number];

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
    unit: p.section?.unitLabel ?? p.section?.name ?? null,
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
    unit: p.section?.unitLabel ?? p.section?.name ?? null,
    tenderNo: p.tendering?.tenderNo ?? null,
    quotationOrContractNo: p.quotationOrContractNo ?? p.contract?.contractNo ?? null,
    title: p.title,
    contractorName: p.contractorName ?? p.contract?.mainContractor ?? null,
    startDate: start?.toISOString() ?? null,
    completionDate: completion?.toISOString() ?? null,
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
    unit: p.section?.unitLabel ?? p.section?.name ?? null,
    tenderNo: p.tendering?.tenderNo ?? null,
    quotationOrContractNo: p.quotationOrContractNo ?? p.contract?.contractNo ?? null,
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
    description: line.description,
    amountApproved: line.amountApproved,
    amountCertified: line.amountCertified,
    amountBalance: line.amountBalance,
    voucherRef: line.voucherRef,
    ...base,
  }));
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
        unit: p.section?.unitLabel ?? p.section?.name ?? null,
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
