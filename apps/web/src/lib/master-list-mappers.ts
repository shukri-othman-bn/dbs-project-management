import type { getProjectsWithBudget } from "./data";
import { getProjectOicDisplayName } from "./project-people";
import { getUnitLabel } from "./units";
import type { ContractMatterLineRow, ContractMatterProjectRow, ContractMatterVariationOrderRow, ContractMatterEotRow, ContractMatterJobOrderRow, ContractMatterPurchaseOrderRow, ContractMatterRequestRow } from "./contract-matters-filters";
import type { getMatterRequests } from "./data";
import type { ContractorTrackRecordRow } from "./contractor-track-record";
import type { ProjectListRow } from "./project-list-filters";
type ProjectWithBudget = Awaited<ReturnType<typeof getProjectsWithBudget>>[number];
type MatterRequestRecord = Awaited<ReturnType<typeof getMatterRequests>>[number];

function latestApprovedEotDate(
  extensionOfTimes: { approvedDate: Date | null }[]
): string | null {
  let latest: Date | null = null;
  for (const eot of extensionOfTimes) {
    if (eot.approvedDate && (!latest || eot.approvedDate > latest)) {
      latest = eot.approvedDate;
    }
  }
  return latest?.toISOString() ?? null;
}

function latestCmgdIssuedDate(jobOrders: { cmgdIssued: Date | null }[]): string | null {
  let latest: Date | null = null;
  for (const jo of jobOrders) {
    if (jo.cmgdIssued && (!latest || jo.cmgdIssued > latest)) {
      latest = jo.cmgdIssued;
    }
  }
  return latest?.toISOString() ?? null;
}

function latestVoDates(
  variationOrders: {
    submittedToSbmDate: Date | null;
    approvedDate: Date | null;
  }[]
) {
  let latestSubmitted: Date | null = null;
  let latestApproved: Date | null = null;
  for (const vo of variationOrders) {
    if (vo.submittedToSbmDate && (!latestSubmitted || vo.submittedToSbmDate > latestSubmitted)) {
      latestSubmitted = vo.submittedToSbmDate;
    }
    if (vo.approvedDate && (!latestApproved || vo.approvedDate > latestApproved)) {
      latestApproved = vo.approvedDate;
    }
  }
  return {
    submitted: latestSubmitted?.toISOString() ?? null,
    approved: latestApproved?.toISOString() ?? null,
  };
}

export function toProjectListRow(p: ProjectWithBudget): ProjectListRow {
  const voDates = latestVoDates(p.variationOrders);

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
    fundingTypeName: p.fundingType?.name ?? null,
    designProjectNo: p.design?.designProjectNo ?? null,
    tenderNo: p.tendering?.tenderNo ?? null,
    oicName: getProjectOicDisplayName(p),
    ministry: p.client?.ministry ?? null,
    department: p.client?.department ?? null,
    physicalActual: p.latestStatus?.physicalActual ?? 0,
    utilizationPct: p.totals.utilizationPct,
    paymentsCertified: p.totals.paymentsCertified,
    rag: p.totals.rag,
    completionDate: p.completion?.completionDate?.toISOString() ?? null,
    cpcDate: (p.contract?.cpcDate ?? p.contract?.cpcIssued)?.toISOString() ?? null,
    finalAccountDate: p.completion?.finalAccountDate?.toISOString() ?? null,
    defectsLiabilityEnd: p.completion?.defectsLiabilityEnd?.toISOString() ?? null,
    tenderOpenDate: p.tendering?.openDate?.toISOString() ?? null,
    tenderClosingDate: p.tendering?.closingDate?.toISOString() ?? null,
    tenderExtendedDate: p.tendering?.extendedClosingDate?.toISOString() ?? null,
    tenderApprovedDate: p.tendering?.approvedDate?.toISOString() ?? null,
    tenderReceivedDate: p.tendering?.receivedDate?.toISOString() ?? null,
    tenderAssessmentSubmittedDate: p.tendering?.assessmentSubmittedDate?.toISOString() ?? null,
    tenderLoaDate: p.tendering?.loaDate?.toISOString() ?? null,
    tenderRemarks: p.tendering?.adRemarks ?? p.tendering?.tenderValidityRemarks ?? null,
    bcaDateAssigned: p.bca?.dateAssigned?.toISOString() ?? null,
    bcaDateDue: p.bca?.dateDue?.toISOString() ?? null,
    bcaDateCompleted: p.bca?.dateCompleted?.toISOString() ?? null,
    bcaEstimate: p.bca?.estimate ?? p.design?.preliminaryEstimate ?? null,
    bcaLetterDate: p.bca?.letterDate?.toISOString() ?? null,
    feasibilityRequestDate: p.feasibility?.requestDate?.toISOString() ?? null,
    feasibilitySiteInspection: p.feasibility?.siteInspection?.toISOString() ?? null,
    feasibilityEstimate: p.feasibility?.estimate ?? null,
    feasibilityProposedPeriod: p.feasibility?.proposedPeriod ?? null,
    feasibilityEstimateSubmitted: p.feasibility?.estimateSubmitted?.toISOString() ?? null,
    feasibilityDateClientConfirm: p.feasibility?.dateClientConfirm?.toISOString() ?? null,
    designDateConfirmed: p.design?.dateConfirmed?.toISOString() ?? null,
    designEstimate: p.design?.preliminaryEstimate ?? null,
    designQuotationTenderDueDate: p.design?.quotationTenderDueDate?.toISOString() ?? null,
    designActualQuotationTenderDate: p.design?.actualQuotationTenderDate?.toISOString() ?? null,
    contractSum: p.contract?.revisedContractSum ?? p.contract?.contractSum ?? null,
    contractPeriod: p.contract?.contractPeriod ?? p.tendering?.completionPeriod ?? null,
    loaIssuedDate:
      p.tendering?.loaDate?.toISOString() ?? p.contract?.loaIssued?.toISOString() ?? null,
    sitePossessionDate: p.contract?.sitePossessionDate?.toISOString() ?? null,
    contractStartDate: p.contract?.contractStart?.toISOString() ?? null,
    contractFinishDate:
      p.contract?.revisedContractFinish?.toISOString() ??
      p.contract?.contractFinish?.toISOString() ??
      null,
    latestEotDate: latestApprovedEotDate(p.extensionOfTimes),
    cncDate: p.contract?.cncDate?.toISOString() ?? null,
    edlpDate: p.contract?.edlp?.toISOString() ?? null,
    cmgdIssuedDate:
      p.contract?.cmgdIssuedDate?.toISOString() ?? latestCmgdIssuedDate(p.jobOrders),
    finalVoSubmittedDate: voDates.submitted,
    finalVoApprovedDate: voDates.approved,
    finalContractSum:
      p.contract?.finalAccountSum ?? p.contract?.revisedContractSum ?? p.contract?.contractSum ?? null,
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
    contractPeriod: p.contract?.contractPeriod ?? p.tendering?.completionPeriod ?? null,
    contractSum: p.contract?.revisedContractSum ?? p.contract?.contractSum ?? null,
    lifecycleStage: p.lifecycleStage,
    projectType: p.projectType,
    fundingTypeName: p.fundingType?.name ?? null,
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
    fundingTypeName: p.fundingType?.name ?? null,
    ministry: p.client?.ministry ?? null,
    department: p.client?.department ?? null,
  };

  return p.budgetLines.map((line) => ({
    lineId: line.id,
    lineType: line.type,
    date: line.date?.toISOString() ?? null,
    claimDate: line.claimDate?.toISOString() ?? null,
    description: line.description,
    progressClaimNo: line.progressClaimNo,
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
    fundingTypeName: p.fundingType?.name ?? null,
    ministry: p.client?.ministry ?? null,
    department: p.client?.department ?? null,
  };
}

export function toContractMatterVariationOrderRows(
  p: ProjectWithBudget
): ContractMatterVariationOrderRow[] {
  const base = contractMatterRecordBase(p);

  return p.variationOrders.map((vo, index) => ({
    id: vo.id,
    voNo: `VO ${index + 1}`,
    voAmount: vo.voAmount ?? 0,
    submittedDate: vo.submittedToSbmDate?.toISOString() ?? null,
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
    contractPeriod: p.contract?.contractPeriod ?? p.tendering?.completionPeriod ?? null,
    startDate: start?.toISOString() ?? null,
    completionDate: completion?.toISOString() ?? null,
    revisedCompletionDate: revisedCompletion?.toISOString() ?? null,
  };

  return p.extensionOfTimes.map((eot, index) => ({
    id: eot.id,
    eotNo: `EOT ${index + 1}`,
    eotPeriod: eot.eotPeriod,
    submittedDate: eot.submittedToSbmDate?.toISOString() ?? null,
    approvedDate: eot.approvedDate?.toISOString() ?? null,
    ...base,
    ...projectFields,
    revisedCompletionDate:
      eot.revisedCompletionDate?.toISOString() ?? projectFields.revisedCompletionDate,
  }));
}

function amountsClose(a: number, b: number) {
  return Math.abs(a - b) < Math.max(1, Math.abs(a) * 0.02);
}

function datesClose(
  a: Date | null | undefined,
  b: Date | null | undefined,
  maxDays = 45
) {
  if (!a || !b) return false;
  return Math.abs(a.getTime() - b.getTime()) <= maxDays * 24 * 60 * 60 * 1000;
}

function purchaseOrderWorkflowFields(po: ProjectWithBudget["purchaseOrders"][number]) {
  return {
    poId: po.poId,
    claimDate: po.claimDate?.toISOString() ?? null,
    claimCertified: po.claimCertified,
    poAmount: po.poAmount,
    sesDate: po.sesDate?.toISOString() ?? null,
    invoiceDate: po.invoiceDate?.toISOString() ?? null,
    eDispatchedDate: po.eDispatchedDate?.toISOString() ?? null,
    eDispatchRef: po.eDispatchRef,
    paidDate: po.paidDate?.toISOString() ?? null,
  };
}

function matchPurchaseOrderToJobOrder(
  jo: ProjectWithBudget["jobOrders"][number],
  candidates: ProjectWithBudget["purchaseOrders"]
) {
  const amountMatch = candidates.find((po) => amountsClose(po.poAmount, jo.joAmount));
  if (amountMatch) return amountMatch;
  return candidates.find((po) => datesClose(po.claimDate, jo.joStart));
}

function matchPurchaseOrderToPaymentLine(
  line: ProjectWithBudget["budgetLines"][number],
  candidates: ProjectWithBudget["purchaseOrders"]
) {
  const dateMatch = candidates.find(
    (po) =>
      po.claimDate &&
      line.claimDate &&
      po.claimDate.getTime() === line.claimDate.getTime()
  );
  if (dateMatch) return dateMatch;

  const certified = line.amountCertified ?? line.amountApproved;
  return candidates.find(
    (po) => po.claimCertified != null && amountsClose(po.claimCertified, certified)
  );
}

function purchaseOrderRecordBase(
  p: ProjectWithBudget,
  workflow: ReturnType<typeof purchaseOrderWorkflowFields>,
  refs: {
    id: string;
    claimSource: "job-order" | "payment-valuation";
    joNo: string | null;
    paymentDescription: string | null;
  }
) {
  const base = contractMatterRecordBase(p);

  return {
    ...refs,
    contractAmount: base.quotationContractAmount,
    ...workflow,
    projectId: base.projectId,
    unit: base.unit,
    title: base.title,
    quotationNo: base.quotationNo,
    contractNo: base.contractNo,
    contractorName: base.contractorName,
    lifecycleStage: base.lifecycleStage,
    projectType: base.projectType,
    fundingTypeName: base.fundingTypeName,
    ministry: base.ministry,
    department: base.department,
  };
}

export function toPaymentClaimsRows(p: ProjectWithBudget): ContractMatterPurchaseOrderRow[] {
  const usedPoIds = new Set<string>();

  function takePurchaseOrder(
    matcher: (candidates: ProjectWithBudget["purchaseOrders"]) =>
      | ProjectWithBudget["purchaseOrders"][number]
      | undefined
  ) {
    const po = matcher(p.purchaseOrders.filter((candidate) => !usedPoIds.has(candidate.id)));
    if (!po) return null;
    usedPoIds.add(po.id);
    return po;
  }

  const jobOrderRows = [...p.jobOrders]
    .sort((a, b) => (a.joStart?.getTime() ?? 0) - (b.joStart?.getTime() ?? 0))
    .map((jo) => {
      const po = takePurchaseOrder((candidates) => matchPurchaseOrderToJobOrder(jo, candidates));
      const workflow = po
        ? purchaseOrderWorkflowFields(po)
        : {
            poId: null,
            claimDate: jo.joStart?.toISOString() ?? null,
            claimCertified: jo.joAmount,
            poAmount: jo.joAmount,
            sesDate: null,
            invoiceDate: null,
            eDispatchedDate: null,
            eDispatchRef: null,
            paidDate: null,
          };

      return purchaseOrderRecordBase(p, workflow, {
        id: `job-order-claim-${jo.id}`,
        claimSource: "job-order",
        joNo: jo.joNo,
        paymentDescription: null,
      });
    });

  const paymentValuationRows = p.budgetLines
    .filter((line) => line.type === "payment")
    .sort((a, b) => {
      const aDate = a.claimDate?.getTime() ?? a.date?.getTime() ?? 0;
      const bDate = b.claimDate?.getTime() ?? b.date?.getTime() ?? 0;
      return aDate - bDate;
    })
    .map((line) => {
      let po: ProjectWithBudget["purchaseOrders"][number] | null = null;
      const fkMatch = p.purchaseOrders.find((candidate) => candidate.budgetLineId === line.id);
      if (fkMatch && !usedPoIds.has(fkMatch.id)) {
        usedPoIds.add(fkMatch.id);
        po = fkMatch;
      } else {
        po = takePurchaseOrder((candidates) =>
          matchPurchaseOrderToPaymentLine(line, candidates)
        );
      }
      const workflow = po
        ? purchaseOrderWorkflowFields(po)
        : {
            poId: null,
            claimDate: line.claimDate?.toISOString() ?? line.date?.toISOString() ?? null,
            claimCertified: line.amountCertified,
            poAmount: line.amountApproved,
            sesDate: null,
            invoiceDate: null,
            eDispatchedDate: null,
            eDispatchRef: null,
            paidDate: null,
          };

      return purchaseOrderRecordBase(p, workflow, {
        id: `payment-valuation-claim-${line.id}`,
        claimSource: "payment-valuation",
        joNo: null,
        paymentDescription: line.description,
      });
    });

  return [...jobOrderRows, ...paymentValuationRows].sort((a, b) => {
    const aDate = a.claimDate ? new Date(a.claimDate).getTime() : 0;
    const bDate = b.claimDate ? new Date(b.claimDate).getTime() : 0;
    return aDate - bDate;
  });
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
    fundingTypeName: base.fundingTypeName,
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
