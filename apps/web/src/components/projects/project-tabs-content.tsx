import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import { toInputDate } from "@/lib/format-input";
import { ProjectTabForm } from "./project-tab-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialProgressPanel, PhysicalProgressPanel } from "./progress-panels";
import { BudgetPanel } from "./budget-panel";
import { ProjectPaymentValuationPanel } from "./project-payment-valuation-panel";
import { ProjectFsorPanel } from "./project-fsor-panel";
import { ProjectVariationOrdersPanel } from "./project-variation-orders-panel";
import { ProjectExtensionOfTimePanel } from "./project-extension-of-time-panel";
import type { BudgetTotals } from "@/lib/budget";
import type { UnitBudgetMetrics } from "@/lib/data";
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
    purchaseOrders: { include: { budgetLine: true } };
    variationOrders: true;
    extensionOfTimes: true;
    statusUpdates: true;
    budgets: { include: { financialYear: true } };
  };
}>;

export function ProjectTabsContent({
  project,
  tab,
  canEdit,
  totals,
  unitBudget,
  financialYearId,
  fsorAppUrl,
}: {
  project: ProjectFull;
  tab: string;
  canEdit: boolean;
  totals: BudgetTotals;
  unitBudget: UnitBudgetMetrics | null;
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
              { name: "preliminaryEstimate", label: "Preliminary estimate", type: "number" },
              { name: "designProjectNo", label: "Project no" },
              { name: "designProgressAsOf", label: "Design progress as of", type: "date" },
              { name: "dateDrawingsCompleted", label: "Date drawings completed", type: "date" },
              { name: "dateMeBqReceived", label: "Date M&E BQ received", type: "date" },
              { name: "dateBqCompleted", label: "Date BQ completed", type: "date" },
              { name: "dateOtherDocumentsReceived", label: "Date other documents received", type: "date" },
              { name: "remarks", label: "Remarks", type: "textarea", colSpan: 3 },
            ]}
            defaultValues={{
              preliminaryEstimate: d?.preliminaryEstimate,
              designProjectNo: d?.designProjectNo ?? project.internalProjectNo,
              designProgressAsOf: toInputDate(d?.designProgressAsOf),
              dateDrawingsCompleted: toInputDate(d?.dateDrawingsCompleted),
              dateMeBqReceived: toInputDate(d?.dateMeBqReceived),
              dateBqCompleted: toInputDate(d?.dateBqCompleted),
              dateOtherDocumentsReceived: toInputDate(d?.dateOtherDocumentsReceived),
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
              { name: "receivedDate", label: "Documents received date", type: "date" },
              { name: "loaDate", label: "LOA date", type: "date" },
              { name: "openDate", label: "Open date", type: "date" },
              {
                name: "recommendationDate",
                label: "Recommendation submitted to DBSO date",
                type: "date",
              },
              { name: "startDateInLoa", label: "Start Date in LOA", type: "date" },
              { name: "closingDate", label: "Closing date", type: "date" },
              {
                name: "recommendationFromDbsoDate",
                label: "Recommendation submitted from DBSO",
                type: "date",
              },
              { name: "completeDateInLoa", label: "Complete Date in LOA", type: "date" },
              { name: "extendedClosingDate", label: "Extended closing date", type: "date" },
              { name: "approvedDate", label: "Approved date", type: "date" },
              { name: "completionPeriod", label: "Completion period" },
              { name: "adRemarks", label: "Ad remarks", type: "textarea", colSpan: 3 },
              { name: "tenderValidityRemarks", label: "Tender Validity Remarks", type: "textarea", colSpan: 3 },
              { name: "latestQuotationValidityDate", label: "Latest Quotation / Tender Validity Date", type: "date" },
            ]}
            defaultValues={{
              tenderNo: t?.tenderNo ?? project.quotationOrContractNo,
              receivedDate: toInputDate(t?.receivedDate),
              loaDate: toInputDate(t?.loaDate),
              openDate: toInputDate(t?.openDate),
              recommendationDate: toInputDate(t?.recommendationDate),
              startDateInLoa: toInputDate(t?.startDateInLoa),
              closingDate: toInputDate(t?.closingDate),
              recommendationFromDbsoDate: toInputDate(t?.recommendationFromDbsoDate),
              completeDateInLoa: toInputDate(t?.completeDateInLoa),
              extendedClosingDate: toInputDate(t?.extendedClosingDate),
              approvedDate: toInputDate(t?.approvedDate),
              completionPeriod: t?.completionPeriod ?? c?.contractPeriod,
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
            contractPeriod: c?.contractPeriod ?? t?.completionPeriod,
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
            { name: "loaIssued", label: "LOA date", type: "date" },
            { name: "contractStart", label: "Contract start date", type: "date" },
            { name: "sitePossessionDate", label: "Site possession date", type: "date" },
            { name: "bgStartDate", label: "BG start date", type: "date" },
            { name: "contractFinish", label: "Contract finish", type: "date" },
            { name: "cpcIssued", label: "CPC issued date", type: "date" },
            { name: "bgExpiry", label: "BG expiry date", type: "date" },
            { name: "revisedContractFinish", label: "Revised completion date", type: "date" },
            { name: "cncDate", label: "CNC issued date", type: "date" },
            { name: "insuranceStartDate", label: "Insurance start date", type: "date" },
            { name: "edlp", label: "EDLP date", type: "date" },
            { name: "cmgdIssuedDate", label: "CMGD issued date", type: "date" },
            { name: "insuranceExpiry", label: "Insurance expiry date", type: "date" },
            { name: "revisedEdlpDate", label: "Revised EDLP date", type: "date" },
          ]}
          defaultValues={{
            loaIssued: toInputDate(c?.loaIssued ?? t?.loaDate),
            contractStart: toInputDate(c?.contractStart ?? t?.startDateInLoa),
            sitePossessionDate: toInputDate(c?.sitePossessionDate),
            bgStartDate: toInputDate(c?.bgStartDate),
            contractFinish: toInputDate(c?.contractFinish ?? t?.completeDateInLoa),
            cpcIssued: toInputDate(c?.cpcIssued ?? c?.cpcDate),
            bgExpiry: toInputDate(c?.bgExpiry),
            revisedContractFinish: toInputDate(c?.revisedContractFinish),
            cncDate: toInputDate(c?.cncDate),
            insuranceStartDate: toInputDate(c?.insuranceStartDate),
            edlp: toInputDate(c?.edlp),
            cmgdIssuedDate: toInputDate(c?.cmgdIssuedDate),
            insuranceExpiry: toInputDate(c?.insuranceExpiry),
            revisedEdlpDate: toInputDate(c?.revisedEdlpDate),
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
            contractSum: c?.contractSum ?? d?.preliminaryEstimate,
            revisedContractSum: c?.revisedContractSum,
            finalAccountSum: c?.finalAccountSum,
            retentionSum: c?.retentionSum,
          }}
          canEdit={canEdit}
          columns={2}
        />
      );

    case "variation-orders":
      return (
        <ProjectVariationOrdersPanel
          projectId={project.id}
          records={project.variationOrders}
          originalContractSum={c?.contractSum ?? d?.preliminaryEstimate ?? null}
          canEdit={canEdit}
        />
      );

    case "extension-of-time":
      return (
        <ProjectExtensionOfTimePanel
          projectId={project.id}
          records={project.extensionOfTimes}
          originalContractPeriod={c?.contractPeriod ?? t?.completionPeriod ?? null}
          canEdit={canEdit}
        />
      );

    case "financials":
      return (
        <BudgetPanel
          projectId={project.id}
          financialYearId={financialYearId}
          totals={totals}
          unitBudget={unitBudget}
          lines={project.budgetLines.filter((line) => line.type === "warrant")}
          purchaseOrders={project.purchaseOrders}
          canEdit={canEdit}
        />
      );

    case "payment-valuation":
      return (
        <ProjectPaymentValuationPanel
          projectId={project.id}
          financialYearId={financialYearId}
          lines={project.budgetLines.filter((line) => line.type === "payment")}
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
              project.title ??
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

    case "physical-progress":
      return (
        <PhysicalProgressPanel
          projectId={project.id}
          records={project.statusUpdates}
          latest={latest ?? null}
          canEdit={canEdit}
        />
      );

    case "financial-progress":
      return (
        <FinancialProgressPanel
          projectId={project.id}
          records={project.statusUpdates}
          latest={latest ?? null}
          canEdit={canEdit}
        />
      );

    default:
      return null;
  }
}
