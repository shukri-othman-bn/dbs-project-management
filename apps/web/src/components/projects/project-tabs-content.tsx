import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import { toInputDate } from "@/lib/format-input";
import { ProjectTabForm } from "./project-tab-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusUpdateForm } from "./status-update-form";
import { BudgetPanel } from "./budget-panel";
import { ProjectFsorPanel } from "./project-fsor-panel";
import type { BudgetTotals } from "@/lib/budget";
import type { Prisma } from "@prisma/client";

type ProjectFull = Prisma.ProjectGetPayload<{
  include: {
    section: true;
    client: true;
    oic: true;
    design: true;
    tendering: true;
    contract: true;
    fsorConfig: true;
    completion: true;
    documents: true;
    budgetLines: true;
    statusUpdates: true;
    budgets: { include: { financialYear: true } };
  };
}>;

export function ProjectTabsContent({
  project,
  tab,
  canEdit,
  totals,
  allocation,
  encumbranceTotal,
  encumbranceBalance,
  financialYearId,
  fsorAppUrl,
}: {
  project: ProjectFull;
  tab: string;
  canEdit: boolean;
  totals: BudgetTotals;
  allocation: number;
  encumbranceTotal: number;
  encumbranceBalance: number;
  financialYearId?: string;
  fsorAppUrl: string;
}) {
  const d = project.design;
  const t = project.tendering;
  const c = project.contract;
  const comp = project.completion;
  const docs = project.documents;
  const latest = project.statusUpdates[0];

  switch (tab) {
    case "design":
      return (
        <div className="space-y-4">
          <ProjectTabForm
            projectId={project.id}
            tab="design"
            fields={[
              { name: "vote", label: "Vote" },
              { name: "govtEstimate", label: "Govt Est", type: "number" },
              { name: "contractPeriod", label: "Contract period" },
              { name: "designProjectNo", label: "Project no" },
              { name: "designProgressAsOf", label: "Design progress as of", type: "date" },
              { name: "archProgress", label: "ARCH %", type: "number" },
              { name: "qsProgress", label: "QS %", type: "number" },
              { name: "steProgress", label: "STE %", type: "number" },
              { name: "meProgress", label: "M&E %", type: "number" },
              { name: "estimate", label: "Estimate", type: "number" },
              { name: "svAmount", label: "SV Amount", type: "number" },
              { name: "remarks", label: "Remarks", type: "textarea", colSpan: 3 },
            ]}
            defaultValues={{
              vote: d?.vote,
              govtEstimate: d?.govtEstimate,
              contractPeriod: d?.contractPeriod,
              designProjectNo: d?.designProjectNo ?? project.internalProjectNo,
              designProgressAsOf: toInputDate(d?.designProgressAsOf),
              archProgress: d?.archProgress,
              qsProgress: d?.qsProgress,
              steProgress: d?.steProgress,
              meProgress: d?.meProgress,
              estimate: d?.estimate,
              svAmount: d?.svAmount,
              remarks: d?.remarks,
            }}
            canEdit={canEdit}
          />
        </div>
      );

    case "tendering":
      return (
        <div className="space-y-4">
          <ProjectTabForm
            projectId={project.id}
            tab="tendering"
            title="Tendering Details"
            fields={[
              { name: "tenderNo", label: "Tender no" },
              { name: "openDate", label: "Open date", type: "date" },
              { name: "closingDate", label: "Closing date", type: "date" },
              { name: "extendedClosingDate", label: "Extended closing date", type: "date" },
              { name: "recommendationDate", label: "Recommendation date", type: "date" },
              { name: "awardedDate", label: "Awarded date", type: "date" },
              { name: "approvedDate", label: "Approved date", type: "date" },
              { name: "loaDate", label: "LOA date", type: "date" },
              { name: "startDateInLoa", label: "Start Date in LOA", type: "date" },
              { name: "completeDateInLoa", label: "Complete Date in LOA", type: "date" },
              { name: "adRemarks", label: "Ad remarks", type: "textarea", colSpan: 3 },
              { name: "tenderValidityRemarks", label: "Tender Validity Remarks", type: "textarea", colSpan: 3 },
              { name: "latestQuotationValidityDate", label: "Latest Quotation / Tender Validity Date", type: "date" },
            ]}
            defaultValues={{
              tenderNo: t?.tenderNo ?? project.quotationOrContractNo,
              openDate: toInputDate(t?.openDate),
              closingDate: toInputDate(t?.closingDate),
              extendedClosingDate: toInputDate(t?.extendedClosingDate),
              recommendationDate: toInputDate(t?.recommendationDate),
              awardedDate: toInputDate(t?.awardedDate),
              approvedDate: toInputDate(t?.approvedDate),
              loaDate: toInputDate(t?.loaDate),
              startDateInLoa: toInputDate(t?.startDateInLoa),
              completeDateInLoa: toInputDate(t?.completeDateInLoa),
              adRemarks: t?.adRemarks,
              tenderValidityRemarks: t?.tenderValidityRemarks,
              latestQuotationValidityDate: toInputDate(t?.latestQuotationValidityDate),
            }}
            canEdit={canEdit}
          />
        </div>
      );

    case "documents":
      return (
        <ProjectTabForm
          projectId={project.id}
          tab="documents"
          fields={[
            { name: "otherDocumentNotes", label: "Other documents / notes", type: "textarea", colSpan: 3 },
            { name: "submissionNotes", label: "Submissions (TCP, SEW, DWS, etc.)", type: "textarea", colSpan: 3 },
          ]}
          defaultValues={{
            otherDocumentNotes: docs?.otherDocumentNotes,
            submissionNotes: docs?.submissionNotes,
          }}
          canEdit={canEdit}
        />
      );

    case "contract-details":
      return (
        <ProjectTabForm
          projectId={project.id}
          tab="contract-details"
          fields={[
            { name: "mainContractor", label: "Main Contractor" },
            { name: "contractNo", label: "Contract No" },
            { name: "contractPeriod", label: "Contract Period" },
            { name: "remarks", label: "Remarks", type: "textarea", colSpan: 3 },
          ]}
          defaultValues={{
            mainContractor: c?.mainContractor ?? project.contractorName,
            contractNo: c?.contractNo,
            contractPeriod: c?.contractPeriod ?? d?.contractPeriod,
            remarks: c?.remarks,
          }}
          canEdit={canEdit}
        />
      );

    case "contract-dates":
      return (
        <ProjectTabForm
          projectId={project.id}
          tab="contract-dates"
          fields={[
            { name: "contractStart", label: "Contract Start", type: "date" },
            { name: "contractFinish", label: "Contract Finish", type: "date" },
            { name: "revisedContractFinish", label: "Revised Contract Finish", type: "date" },
            { name: "contractSigned", label: "Contract Signed", type: "date" },
            { name: "loaIssued", label: "LOA Issued", type: "date" },
            { name: "bgExpiry", label: "BG Expiry", type: "date" },
            { name: "performanceBondExpiry", label: "Performance Bond Expiry", type: "date" },
            { name: "insuranceExpiry", label: "Insurance Expiry", type: "date" },
            { name: "cpcDate", label: "CPC Date", type: "date" },
            { name: "cpcIssued", label: "CPC Issued", type: "date" },
            { name: "edlp", label: "EDLP", type: "date" },
          ]}
          defaultValues={{
            contractStart: toInputDate(c?.contractStart ?? t?.startDateInLoa),
            contractFinish: toInputDate(c?.contractFinish ?? t?.completeDateInLoa),
            revisedContractFinish: toInputDate(c?.revisedContractFinish),
            contractSigned: toInputDate(c?.contractSigned),
            loaIssued: toInputDate(c?.loaIssued ?? t?.loaDate),
            bgExpiry: toInputDate(c?.bgExpiry),
            performanceBondExpiry: toInputDate(c?.performanceBondExpiry),
            insuranceExpiry: toInputDate(c?.insuranceExpiry),
            cpcDate: toInputDate(c?.cpcDate),
            cpcIssued: toInputDate(c?.cpcIssued),
            edlp: toInputDate(c?.edlp),
          }}
          canEdit={canEdit}
        />
      );

    case "contract-amounts":
      return (
        <ProjectTabForm
          projectId={project.id}
          tab="contract-amounts"
          fields={[
            { name: "contractSum", label: "Contract Sum", type: "number" },
            { name: "revisedContractSum", label: "Revised Contract Sum", type: "number" },
            { name: "finalAccountSum", label: "Final Account Sum", type: "number" },
            { name: "retentionSum", label: "Retention Sum", type: "number" },
          ]}
          defaultValues={{
            contractSum: c?.contractSum ?? d?.govtEstimate,
            revisedContractSum: c?.revisedContractSum,
            finalAccountSum: c?.finalAccountSum,
            retentionSum: c?.retentionSum,
          }}
          canEdit={canEdit}
          columns={2}
        />
      );

    case "financials":
      return (
        <BudgetPanel
          projectId={project.id}
          financialYearId={financialYearId}
          totals={totals}
          allocation={allocation}
          encumbranceTotal={encumbranceTotal}
          encumbranceBalance={encumbranceBalance}
          lines={project.budgetLines}
          canEdit={canEdit}
        />
      );

    case "completion":
      return (
        <ProjectTabForm
          projectId={project.id}
          tab="completion"
          fields={[
            { name: "progressAsOf", label: "Progress as of", type: "date" },
            { name: "physicalActual", label: "Physical Actual %", type: "number" },
            { name: "physicalScheduled", label: "Physical Scheduled %", type: "number" },
            { name: "paymentActual", label: "Payment Actual %", type: "number" },
            { name: "paymentScheduled", label: "Payment Scheduled %", type: "number" },
            { name: "completionDate", label: "Completion Date", type: "date" },
            { name: "defectsLiabilityEnd", label: "Defects Liability End", type: "date" },
            { name: "finalAccountDate", label: "Final Account Date", type: "date" },
            { name: "remarks", label: "Remarks", type: "textarea", colSpan: 3 },
            { name: "actionsRequired", label: "Actions Required", type: "textarea", colSpan: 3 },
          ]}
          defaultValues={{
            progressAsOf: toInputDate(comp?.progressAsOf ?? latest?.progressAsOf),
            physicalActual: comp?.physicalActual ?? latest?.physicalActual,
            physicalScheduled: comp?.physicalScheduled ?? latest?.physicalScheduled,
            paymentActual: comp?.paymentActual ?? latest?.paymentActual,
            paymentScheduled: comp?.paymentScheduled ?? latest?.paymentScheduled,
            completionDate: toInputDate(comp?.completionDate),
            defectsLiabilityEnd: toInputDate(comp?.defectsLiabilityEnd),
            finalAccountDate: toInputDate(comp?.finalAccountDate),
            remarks: comp?.remarks ?? latest?.remarks,
            actionsRequired: comp?.actionsRequired ?? latest?.actionsRequired,
          }}
          canEdit={canEdit}
        />
      );

    case "fsor":
      return (
        <ProjectFsorPanel
          projectId={project.id}
          fsorAppUrl={fsorAppUrl}
          canEdit={canEdit}
          defaultValues={{
            defaultBidPercent: project.fsorConfig?.defaultBidPercent ?? 5,
            pwdNo: project.fsorConfig?.pwdNo ?? "",
            others: project.fsorConfig?.others ?? "",
            soiRef: project.fsorConfig?.soiRef ?? project.quotationOrContractNo ?? "",
            signatoryName: project.fsorConfig?.signatoryName ?? "",
            signatoryTitle: project.fsorConfig?.signatoryTitle ?? "",
            scopeDescription:
              project.fsorConfig?.scopeDescription ??
              project.contract?.remarks ??
              project.clientsNotes ??
              "",
            buildings: (project.fsorConfig?.buildings ?? []).join("\n"),
            lastSyncedAt: project.fsorConfig?.lastSyncedAt?.toISOString() ?? null,
          }}
        />
      );

    case "history":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Record history</CardTitle>
          </CardHeader>
          <CardContent>
            {project.statusUpdates.length === 0 ? (
              <p className="text-sm text-slate-500">No status records yet</p>
            ) : (
              <ul className="space-y-4">
                {project.statusUpdates.map((u) => (
                  <li key={u.id} className="border-b border-slate-100 pb-4 text-sm last:border-0">
                    <div className="flex flex-wrap gap-4 font-medium text-slate-800">
                      <span>{formatDate(u.progressAsOf)}</span>
                      <span>Physical {formatPercent(u.physicalActual)}</span>
                      <span>Payment {formatPercent(u.paymentActual)}</span>
                    </div>
                    {u.remarks && <p className="mt-2 text-slate-600">{u.remarks}</p>}
                    {u.actionsRequired && (
                      <p className="mt-1 text-amber-700">Action: {u.actionsRequired}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      Recorded {formatDate(u.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      );

    case "status":
      return canEdit ? (
        <StatusUpdateForm projectId={project.id} latest={latest} />
      ) : (
        <p className="text-slate-500">Read-only access</p>
      );

    default:
      return null;
  }
}
