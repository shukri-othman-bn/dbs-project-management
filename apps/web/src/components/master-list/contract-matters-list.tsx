import Link from "next/link";
import { StageBadge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  PAYMENT_CLAIMS_TABLE_COLUMNS,
  type ContractMatterLineRow,
  type ContractMatterVariationOrderRow,
  type ContractMatterEotRow,
  type ContractMatterJobOrderRow,
  type ContractMatterPurchaseOrderRow,
  type ContractMatterRequestRow,
} from "@/lib/contract-matters-filters";
import { cn } from "@/lib/utils";
import { formatProgressClaimNo } from "@/lib/payment-valuation";
import {
  DesktopDataTable,
  desktopTdClass,
  desktopThClass,
  MobileCardList,
  MobileField,
  MobileRecordCard,
  ResponsiveDataView,
} from "@/components/ui/responsive-data";

function UnitPill({ unit }: { unit: string | null }) {
  if (!unit) return <span className="text-slate-400">—</span>;
  return (
    <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      {unit}
    </span>
  );
}

function ContractorPill({ name }: { name: string | null }) {
  if (!name) return <span className="text-slate-400">—</span>;
  return (
    <span className="inline-block max-w-full break-words rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-100">
      {name}
    </span>
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function RefNumbersCell({
  tenderNo,
  quotationNo,
  contractNo,
}: {
  tenderNo: string | null;
  quotationNo: string | null;
  contractNo: string | null;
}) {
  const items = [
    tenderNo ? { label: "Tender", value: tenderNo } : null,
    quotationNo ? { label: "Quotation", value: quotationNo } : null,
    contractNo ? { label: "Contract", value: contractNo } : null,
  ].filter((item): item is { label: string; value: string } => item != null);

  if (items.length === 0) return <span className="text-slate-400">—</span>;

  return (
    <div className="space-y-0.5 text-slate-700">
      {items.map(({ label, value }) => (
        <div key={label}>
          <span className="text-slate-500">{label}: </span>
          {value}
        </div>
      ))}
    </div>
  );
}

function QuotationContractCell({
  quotationNo,
  contractNo,
}: {
  quotationNo: string | null;
  contractNo: string | null;
}) {
  return (
    <RefNumbersCell tenderNo={null} quotationNo={quotationNo} contractNo={contractNo} />
  );
}

function JoPaymentDescriptionCell({
  joNo,
  paymentDescription,
}: {
  joNo: string | null;
  paymentDescription: string | null;
}) {
  const label = joNo ?? paymentDescription;
  if (!label) return <span className="text-slate-400">—</span>;

  return <span className="text-slate-700">{label}</span>;
}

const sharedUnitThClass = cn(desktopThClass, "w-[5%]");
const sharedUnitTdClass = cn(desktopTdClass, "w-[5%] whitespace-nowrap");
const sharedProjectThClass = cn(desktopThClass, "w-[18%]");
const sharedProjectTdClass = cn(desktopTdClass, "w-[18%]");
const sharedRefsThClass = cn(desktopThClass, "w-[13%]");
const sharedRefsTdClass = cn(desktopTdClass, "w-[13%]");
const sharedContractorThClass = cn(desktopThClass, "w-[13%]");
const sharedContractorTdClass = cn(desktopTdClass, "w-[13%]");
const paymentTrailingThClass = cn(desktopThClass, "w-[12.75%]");
const paymentTrailingTdClass = cn(desktopTdClass, "w-[12.75%]");
const matterRecordTrailingThClass = cn(desktopThClass, "w-[10.2%]");
const matterRecordTrailingTdClass = cn(desktopTdClass, "w-[10.2%]");
const eotTrailingThClass = cn(desktopThClass, "w-[6.375%]");
const eotTrailingTdClass = cn(desktopTdClass, "w-[6.375%]");
const joTrailingThClass = cn(desktopThClass, "w-[6.375%]");
const joTrailingTdClass = cn(desktopTdClass, "w-[6.375%]");
const poTrailingThClass = joTrailingThClass;
const poTrailingTdClass = joTrailingTdClass;
const requestTrailingThClass = cn(desktopThClass, "w-[11.875%]");
const requestTrailingTdClass = cn(desktopTdClass, "w-[11.875%]");

function RequestStatusPill({ status }: { status: string | null }) {
  if (!status) return <span className="text-slate-400">—</span>;
  const tone =
    status.toLowerCase() === "closed"
      ? "bg-slate-100 text-slate-700"
      : status.toLowerCase() === "in progress"
        ? "bg-amber-50 text-amber-900 ring-1 ring-amber-100"
        : "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100";
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", tone)}>
      {status}
    </span>
  );
}

function paymentReferenceValue(r: ContractMatterLineRow) {
  return r.description ?? "—";
}

export function PaymentTable({
  rows,
  descriptionLabel = "Description",
  showProgressClaimNo = false,
}: {
  rows: ContractMatterLineRow[];
  descriptionLabel?: string;
  showProgressClaimNo?: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <ResponsiveDataView
      mobile={
        <MobileCardList>
          {rows.map((r) => (
            <MobileRecordCard key={r.lineId} href={`/projects/${r.projectId}`} title={r.title}>
              <MobileField label="Unit" value={<UnitPill unit={r.unit} />} />
              <MobileField
                label="Quotation / contract no."
                value={
                  <QuotationContractCell quotationNo={r.quotationNo} contractNo={r.contractNo} />
                }
                span={3}
              />
              <MobileField label="Contractor" value={<ContractorPill name={r.contractorName} />} />
              {showProgressClaimNo && (
                <MobileField
                  label="Progress Claim No."
                  value={formatProgressClaimNo(r.progressClaimNo)}
                />
              )}
              <MobileField label={descriptionLabel} value={paymentReferenceValue(r)} span={3} />
              <MobileField label="Date claim" value={formatDate(r.claimDate)} />
              <MobileField label="Date certified" value={formatDate(r.date)} />
              <MobileField
                label="Amount certified"
                value={r.amountCertified != null ? formatCurrency(r.amountCertified) : "—"}
              />
            </MobileRecordCard>
          ))}
        </MobileCardList>
      }
      desktop={
    <DesktopDataTable dense>
      <thead>
        <tr className="border-b bg-slate-50 text-left text-slate-500">
          <th className={sharedUnitThClass}>Unit</th>
          <th className={sharedProjectThClass}>Project</th>
          <th className={sharedRefsThClass}>Quotation / contract no.</th>
          <th className={sharedContractorThClass}>Contractor</th>
          {showProgressClaimNo && (
            <th className={paymentTrailingThClass}>Progress Claim No.</th>
          )}
          <th className={paymentTrailingThClass}>{descriptionLabel}</th>
          <th className={paymentTrailingThClass}>Date Claim</th>
          <th className={paymentTrailingThClass}>Date Certified</th>
          <th className={paymentTrailingThClass}>Amount Certified</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.lineId} className="border-b border-slate-100 hover:bg-slate-50">
            <td className={sharedUnitTdClass}>
              <UnitPill unit={r.unit} />
            </td>
            <td className={sharedProjectTdClass}>
              <Link href={`/projects/${r.projectId}`} className="font-medium text-slate-800 hover:underline">
                {r.title}
              </Link>
            </td>
            <td className={sharedRefsTdClass}>
              <QuotationContractCell quotationNo={r.quotationNo} contractNo={r.contractNo} />
            </td>
            <td className={sharedContractorTdClass}>
              <ContractorPill name={r.contractorName} />
            </td>
            {showProgressClaimNo && (
              <td className={cn(paymentTrailingTdClass, "text-slate-600")}>
                {formatProgressClaimNo(r.progressClaimNo)}
              </td>
            )}
            <td className={cn(paymentTrailingTdClass, "text-slate-600")}>
              {paymentReferenceValue(r)}
            </td>
            <td className={cn(paymentTrailingTdClass, "text-slate-600")}>{formatDate(r.claimDate)}</td>
            <td className={cn(paymentTrailingTdClass, "text-slate-600")}>{formatDate(r.date)}</td>
            <td className={paymentTrailingTdClass}>
              {r.amountCertified != null ? formatCurrency(r.amountCertified) : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </DesktopDataTable>
      }
    />
  );
}

export function VariationOrderTable({ rows }: { rows: ContractMatterVariationOrderRow[] }) {
  if (rows.length === 0) return null;

  return (
    <ResponsiveDataView
      mobile={
        <MobileCardList>
          {rows.map((r) => (
            <MobileRecordCard key={r.id} href={`/projects/${r.projectId}`} title={r.title}>
              <MobileField label="Unit" value={<UnitPill unit={r.unit} />} />
              <MobileField
                label="Quotation / contract no."
                value={
                  <QuotationContractCell quotationNo={r.quotationNo} contractNo={r.contractNo} />
                }
                span={3}
              />
              <MobileField label="Contractor" value={<ContractorPill name={r.contractorName} />} />
              <MobileField
                label="Quotation / contract amount"
                value={
                  r.quotationContractAmount != null
                    ? formatCurrency(r.quotationContractAmount)
                    : "—"
                }
              />
              <MobileField label="Variation order no." value={r.voNo ?? "—"} />
              <MobileField label="Variation order amount" value={formatCurrency(r.voAmount)} />
              <MobileField label="Variation order submitted" value={formatDate(r.submittedDate)} />
              <MobileField label="Variation order approved" value={formatDate(r.approvedDate)} />
            </MobileRecordCard>
          ))}
        </MobileCardList>
      }
      desktop={
        <DesktopDataTable dense>
          <thead>
            <tr className="border-b bg-slate-50 text-left text-slate-500">
              <th className={sharedUnitThClass}>Unit</th>
              <th className={sharedProjectThClass}>Project</th>
              <th className={sharedRefsThClass}>Quotation / contract no.</th>
              <th className={sharedContractorThClass}>Contractor</th>
              <th className={matterRecordTrailingThClass}>Quotation / contract amount</th>
              <th className={matterRecordTrailingThClass}>Variation order no.</th>
              <th className={matterRecordTrailingThClass}>Variation order amount</th>
              <th className={matterRecordTrailingThClass}>Variation order submitted</th>
              <th className={matterRecordTrailingThClass}>Variation order approved</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                <td className={sharedUnitTdClass}>
                  <UnitPill unit={r.unit} />
                </td>
                <td className={sharedProjectTdClass}>
                  <Link
                    href={`/projects/${r.projectId}`}
                    className="font-medium text-slate-800 hover:underline"
                  >
                    {r.title}
                  </Link>
                </td>
                <td className={sharedRefsTdClass}>
                  <QuotationContractCell quotationNo={r.quotationNo} contractNo={r.contractNo} />
                </td>
                <td className={sharedContractorTdClass}>
                  <ContractorPill name={r.contractorName} />
                </td>
                <td className={cn(matterRecordTrailingTdClass, "text-slate-700")}>
                  {r.quotationContractAmount != null
                    ? formatCurrency(r.quotationContractAmount)
                    : "—"}
                </td>
                <td className={cn(matterRecordTrailingTdClass, "text-slate-700")}>{r.voNo ?? "—"}</td>
                <td className={matterRecordTrailingTdClass}>{formatCurrency(r.voAmount)}</td>
                <td className={cn(matterRecordTrailingTdClass, "text-slate-600")}>
                  {formatDate(r.submittedDate)}
                </td>
                <td className={cn(matterRecordTrailingTdClass, "text-slate-600")}>
                  {formatDate(r.approvedDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </DesktopDataTable>
      }
    />
  );
}

export function ExtensionOfTimeTable({ rows }: { rows: ContractMatterEotRow[] }) {
  if (rows.length === 0) return null;

  return (
    <ResponsiveDataView
      mobile={
        <MobileCardList>
          {rows.map((r) => (
            <MobileRecordCard key={r.id} href={`/projects/${r.projectId}`} title={r.title}>
              <MobileField label="Unit" value={<UnitPill unit={r.unit} />} />
              <MobileField
                label="Quotation / contract no."
                value={
                  <QuotationContractCell quotationNo={r.quotationNo} contractNo={r.contractNo} />
                }
                span={3}
              />
              <MobileField label="Contractor" value={<ContractorPill name={r.contractorName} />} />
              <MobileField label="Contract period" value={r.contractPeriod ?? "—"} />
              <MobileField label="EOT no." value={r.eotNo ?? "—"} />
              <MobileField label="EOT period" value={r.eotPeriod ?? "—"} />
              <MobileField label="Start date" value={formatDate(r.startDate)} />
              <MobileField label="Completion" value={formatDate(r.completionDate)} />
              <MobileField
                label="Revised completion"
                value={formatDate(r.revisedCompletionDate)}
              />
              <MobileField label="EOT submitted" value={formatDate(r.submittedDate)} />
              <MobileField label="EOT approved" value={formatDate(r.approvedDate)} />
            </MobileRecordCard>
          ))}
        </MobileCardList>
      }
      desktop={
        <DesktopDataTable dense>
          <thead>
            <tr className="border-b bg-slate-50 text-left text-slate-500">
              <th className={sharedUnitThClass}>Unit</th>
              <th className={sharedProjectThClass}>Project</th>
              <th className={sharedRefsThClass}>Quotation / contract no.</th>
              <th className={sharedContractorThClass}>Contractor</th>
              <th className={eotTrailingThClass}>Contract period</th>
              <th className={eotTrailingThClass}>EOT no.</th>
              <th className={eotTrailingThClass}>EOT period</th>
              <th className={eotTrailingThClass}>Start date</th>
              <th className={eotTrailingThClass}>Completion</th>
              <th className={eotTrailingThClass}>Revised completion</th>
              <th className={eotTrailingThClass}>EOT submitted</th>
              <th className={eotTrailingThClass}>EOT approved</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                <td className={sharedUnitTdClass}>
                  <UnitPill unit={r.unit} />
                </td>
                <td className={sharedProjectTdClass}>
                  <Link
                    href={`/projects/${r.projectId}`}
                    className="font-medium text-slate-800 hover:underline"
                  >
                    {r.title}
                  </Link>
                </td>
                <td className={sharedRefsTdClass}>
                  <QuotationContractCell quotationNo={r.quotationNo} contractNo={r.contractNo} />
                </td>
                <td className={sharedContractorTdClass}>
                  <ContractorPill name={r.contractorName} />
                </td>
                <td className={cn(eotTrailingTdClass, "text-slate-700")}>
                  {r.contractPeriod ?? "—"}
                </td>
                <td className={cn(eotTrailingTdClass, "text-slate-700")}>{r.eotNo ?? "—"}</td>
                <td className={cn(eotTrailingTdClass, "text-slate-700")}>{r.eotPeriod ?? "—"}</td>
                <td className={cn(eotTrailingTdClass, "text-slate-600")}>
                  {formatDate(r.startDate)}
                </td>
                <td className={cn(eotTrailingTdClass, "text-slate-600")}>
                  {formatDate(r.completionDate)}
                </td>
                <td className={cn(eotTrailingTdClass, "text-slate-600")}>
                  {formatDate(r.revisedCompletionDate)}
                </td>
                <td className={cn(eotTrailingTdClass, "text-slate-600")}>
                  {formatDate(r.submittedDate)}
                </td>
                <td className={cn(eotTrailingTdClass, "text-slate-600")}>
                  {formatDate(r.approvedDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </DesktopDataTable>
      }
    />
  );
}

export function JobOrderTable({ rows }: { rows: ContractMatterJobOrderRow[] }) {
  if (rows.length === 0) return null;

  return (
    <ResponsiveDataView
      mobile={
        <MobileCardList>
          {rows.map((r) => (
            <MobileRecordCard key={r.id} href={`/projects/${r.projectId}`} title={r.title}>
              <MobileField label="Unit" value={<UnitPill unit={r.unit} />} />
              <MobileField
                label="Quotation / contract no."
                value={
                  <QuotationContractCell quotationNo={r.quotationNo} contractNo={r.contractNo} />
                }
                span={3}
              />
              <MobileField label="Contractor" value={<ContractorPill name={r.contractorName} />} />
              <MobileField
                label="Contract amount"
                value={r.contractAmount != null ? formatCurrency(r.contractAmount) : "—"}
              />
              <MobileField
                label="% FSOR"
                value={r.fsorPercent != null ? formatPercent(r.fsorPercent) : "—"}
              />
              <MobileField label="JO no." value={r.joNo ?? "—"} />
              <MobileField label="JO amount" value={formatCurrency(r.joAmount)} />
              <MobileField label="JO start" value={formatDate(r.joStart)} />
              <MobileField label="Actual JO finish" value={formatDate(r.actualJoFinish)} />
              <MobileField label="JO EDLP due" value={formatDate(r.joEdlpDue)} />
              <MobileField label="CMGD issued" value={formatDate(r.cmgdIssued)} />
            </MobileRecordCard>
          ))}
        </MobileCardList>
      }
      desktop={
        <DesktopDataTable dense>
          <thead>
            <tr className="border-b bg-slate-50 text-left text-slate-500">
              <th className={sharedUnitThClass}>Unit</th>
              <th className={sharedProjectThClass}>Project</th>
              <th className={sharedRefsThClass}>Quotation / contract no.</th>
              <th className={sharedContractorThClass}>Contractor</th>
              <th className={joTrailingThClass}>Contract amount</th>
              <th className={joTrailingThClass}>% FSOR</th>
              <th className={joTrailingThClass}>JO no.</th>
              <th className={joTrailingThClass}>JO amount</th>
              <th className={joTrailingThClass}>JO start</th>
              <th className={joTrailingThClass}>Actual JO finish</th>
              <th className={joTrailingThClass}>JO EDLP due</th>
              <th className={joTrailingThClass}>CMGD issued</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                <td className={sharedUnitTdClass}>
                  <UnitPill unit={r.unit} />
                </td>
                <td className={sharedProjectTdClass}>
                  <Link
                    href={`/projects/${r.projectId}`}
                    className="font-medium text-slate-800 hover:underline"
                  >
                    {r.title}
                  </Link>
                </td>
                <td className={sharedRefsTdClass}>
                  <QuotationContractCell quotationNo={r.quotationNo} contractNo={r.contractNo} />
                </td>
                <td className={sharedContractorTdClass}>
                  <ContractorPill name={r.contractorName} />
                </td>
                <td className={cn(joTrailingTdClass, "text-slate-700")}>
                  {r.contractAmount != null ? formatCurrency(r.contractAmount) : "—"}
                </td>
                <td className={cn(joTrailingTdClass, "text-slate-700")}>
                  {r.fsorPercent != null ? formatPercent(r.fsorPercent) : "—"}
                </td>
                <td className={cn(joTrailingTdClass, "text-slate-700")}>{r.joNo ?? "—"}</td>
                <td className={joTrailingTdClass}>{formatCurrency(r.joAmount)}</td>
                <td className={cn(joTrailingTdClass, "text-slate-600")}>{formatDate(r.joStart)}</td>
                <td className={cn(joTrailingTdClass, "text-slate-600")}>
                  {formatDate(r.actualJoFinish)}
                </td>
                <td className={cn(joTrailingTdClass, "text-slate-600")}>
                  {formatDate(r.joEdlpDue)}
                </td>
                <td className={cn(joTrailingTdClass, "text-slate-600")}>
                  {formatDate(r.cmgdIssued)}
                </td>
              </tr>
            ))}
          </tbody>
        </DesktopDataTable>
      }
    />
  );
}

export function PurchaseOrderTable({
  rows,
  showJoPaymentDescriptionColumn = false,
}: {
  rows: ContractMatterPurchaseOrderRow[];
  showJoPaymentDescriptionColumn?: boolean;
}) {
  if (rows.length === 0) return null;

  return (
    <ResponsiveDataView
      mobile={
        <MobileCardList>
          {rows.map((r) => (
            <MobileRecordCard key={r.id} href={`/projects/${r.projectId}`} title={r.title}>
              <MobileField label="Unit" value={<UnitPill unit={r.unit} />} />
              <MobileField
                label="Quotation / contract no."
                value={
                  <QuotationContractCell quotationNo={r.quotationNo} contractNo={r.contractNo} />
                }
                span={3}
              />
              <MobileField label="Contractor" value={<ContractorPill name={r.contractorName} />} />
              <MobileField
                label="Contract amount"
                value={r.contractAmount != null ? formatCurrency(r.contractAmount) : "—"}
              />
              {showJoPaymentDescriptionColumn && (
                <MobileField
                  label="JO No/Payment Description"
                  value={
                    <JoPaymentDescriptionCell
                      joNo={r.joNo}
                      paymentDescription={r.paymentDescription}
                    />
                  }
                  span={3}
                />
              )}
              <MobileField label="Claim date" value={formatDate(r.claimDate)} />
              <MobileField
                label="Claim certified"
                value={r.claimCertified != null ? formatCurrency(r.claimCertified) : "—"}
              />
              <MobileField label="PO ID" value={r.poId ?? "—"} />
              <MobileField label="PO amount" value={formatCurrency(r.poAmount)} />
              <MobileField label="SES date" value={formatDate(r.sesDate)} />
              <MobileField label="Invoice date" value={formatDate(r.invoiceDate)} />
              <MobileField label="E-dispatched date" value={formatDate(r.eDispatchedDate)} />
              <MobileField label="E-Dispatch Ref" value={r.eDispatchRef ?? "—"} />
              <MobileField label="Paid date" value={formatDate(r.paidDate)} />
            </MobileRecordCard>
          ))}
        </MobileCardList>
      }
      desktop={
        <DesktopDataTable dense>
          {showJoPaymentDescriptionColumn && (
            <colgroup>
              {PAYMENT_CLAIMS_TABLE_COLUMNS.map((col) => (
                <col key={col.id} style={{ width: `${col.widthPercent}%` }} />
              ))}
            </colgroup>
          )}
          <thead>
            <tr className="border-b bg-slate-50 text-left text-slate-500">
              <th className={showJoPaymentDescriptionColumn ? desktopThClass : sharedUnitThClass}>
                Unit
              </th>
              <th className={showJoPaymentDescriptionColumn ? desktopThClass : sharedProjectThClass}>
                Project
              </th>
              <th className={showJoPaymentDescriptionColumn ? desktopThClass : sharedRefsThClass}>
                Quotation / contract no.
              </th>
              <th
                className={showJoPaymentDescriptionColumn ? desktopThClass : sharedContractorThClass}
              >
                Contractor
              </th>
              <th className={showJoPaymentDescriptionColumn ? desktopThClass : poTrailingThClass}>
                Contract amount
              </th>
              {showJoPaymentDescriptionColumn && (
                <th className={desktopThClass}>JO No/Payment Description</th>
              )}
              <th className={showJoPaymentDescriptionColumn ? desktopThClass : poTrailingThClass}>
                Claim date
              </th>
              <th className={showJoPaymentDescriptionColumn ? desktopThClass : poTrailingThClass}>
                Claim certified
              </th>
              <th className={showJoPaymentDescriptionColumn ? desktopThClass : poTrailingThClass}>
                PO ID
              </th>
              <th className={showJoPaymentDescriptionColumn ? desktopThClass : poTrailingThClass}>
                PO amount
              </th>
              <th className={showJoPaymentDescriptionColumn ? desktopThClass : poTrailingThClass}>
                SES date
              </th>
              <th className={showJoPaymentDescriptionColumn ? desktopThClass : poTrailingThClass}>
                Invoice date
              </th>
              <th className={showJoPaymentDescriptionColumn ? desktopThClass : poTrailingThClass}>
                E-dispatched date
              </th>
              <th className={showJoPaymentDescriptionColumn ? desktopThClass : poTrailingThClass}>
                E-Dispatch Ref
              </th>
              <th className={showJoPaymentDescriptionColumn ? desktopThClass : poTrailingThClass}>
                Paid date
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                <td className={showJoPaymentDescriptionColumn ? desktopTdClass : sharedUnitTdClass}>
                  <UnitPill unit={r.unit} />
                </td>
                <td className={showJoPaymentDescriptionColumn ? desktopTdClass : sharedProjectTdClass}>
                  <Link
                    href={`/projects/${r.projectId}`}
                    className="font-medium text-slate-800 hover:underline"
                  >
                    {r.title}
                  </Link>
                </td>
                <td className={showJoPaymentDescriptionColumn ? desktopTdClass : sharedRefsTdClass}>
                  <QuotationContractCell quotationNo={r.quotationNo} contractNo={r.contractNo} />
                </td>
                <td
                  className={showJoPaymentDescriptionColumn ? desktopTdClass : sharedContractorTdClass}
                >
                  <ContractorPill name={r.contractorName} />
                </td>
                <td
                  className={cn(
                    showJoPaymentDescriptionColumn ? desktopTdClass : poTrailingTdClass,
                    "text-slate-700"
                  )}
                >
                  {r.contractAmount != null ? formatCurrency(r.contractAmount) : "—"}
                </td>
                {showJoPaymentDescriptionColumn && (
                  <td className={desktopTdClass}>
                    <JoPaymentDescriptionCell
                      joNo={r.joNo}
                      paymentDescription={r.paymentDescription}
                    />
                  </td>
                )}
                <td
                  className={cn(
                    showJoPaymentDescriptionColumn ? desktopTdClass : poTrailingTdClass,
                    "text-slate-600"
                  )}
                >
                  {formatDate(r.claimDate)}
                </td>
                <td className={showJoPaymentDescriptionColumn ? desktopTdClass : poTrailingTdClass}>
                  {r.claimCertified != null ? formatCurrency(r.claimCertified) : "—"}
                </td>
                <td
                  className={cn(
                    showJoPaymentDescriptionColumn ? desktopTdClass : poTrailingTdClass,
                    "text-slate-700"
                  )}
                >
                  {r.poId ?? "—"}
                </td>
                <td className={showJoPaymentDescriptionColumn ? desktopTdClass : poTrailingTdClass}>
                  {formatCurrency(r.poAmount)}
                </td>
                <td
                  className={cn(
                    showJoPaymentDescriptionColumn ? desktopTdClass : poTrailingTdClass,
                    "text-slate-600"
                  )}
                >
                  {formatDate(r.sesDate)}
                </td>
                <td
                  className={cn(
                    showJoPaymentDescriptionColumn ? desktopTdClass : poTrailingTdClass,
                    "text-slate-600"
                  )}
                >
                  {formatDate(r.invoiceDate)}
                </td>
                <td
                  className={cn(
                    showJoPaymentDescriptionColumn ? desktopTdClass : poTrailingTdClass,
                    "text-slate-600"
                  )}
                >
                  {formatDate(r.eDispatchedDate)}
                </td>
                <td
                  className={cn(
                    showJoPaymentDescriptionColumn ? desktopTdClass : poTrailingTdClass,
                    "text-slate-700"
                  )}
                >
                  {r.eDispatchRef ?? "—"}
                </td>
                <td
                  className={cn(
                    showJoPaymentDescriptionColumn ? desktopTdClass : poTrailingTdClass,
                    "text-slate-600"
                  )}
                >
                  {formatDate(r.paidDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </DesktopDataTable>
      }
    />
  );
}

export function RequestTable({ rows }: { rows: ContractMatterRequestRow[] }) {
  if (rows.length === 0) return null;

  return (
    <ResponsiveDataView
      mobile={
        <MobileCardList>
          {rows.map((r) => (
            <MobileRecordCard key={r.id} title={r.ticketNo ?? "Request"} subtitle={r.complainant ?? undefined}>
              <MobileField label="Unit" value={<UnitPill unit={r.unit} />} />
              <MobileField label="Contact no." value={r.contactNo ?? "—"} />
              <MobileField label="Address" value={r.address ?? "—"} span={3} />
              <MobileField label="Complaint received" value={formatDate(r.complaintReceived)} />
              <MobileField label="Received method" value={r.receivedMethod ?? "—"} />
              <MobileField label="Type of complaint" value={r.typeOfComplaint ?? "—"} />
              <MobileField label="Status" value={<RequestStatusPill status={r.status} />} />
            </MobileRecordCard>
          ))}
        </MobileCardList>
      }
      desktop={
        <DesktopDataTable dense>
          <thead>
            <tr className="border-b bg-slate-50 text-left text-slate-500">
              <th className={sharedUnitThClass}>Unit</th>
              <th className={requestTrailingThClass}>Ticket no.</th>
              <th className={requestTrailingThClass}>Complainant</th>
              <th className={requestTrailingThClass}>Contact no.</th>
              <th className={requestTrailingThClass}>Address</th>
              <th className={requestTrailingThClass}>Complaint received</th>
              <th className={requestTrailingThClass}>Received method</th>
              <th className={requestTrailingThClass}>Type of complaint</th>
              <th className={requestTrailingThClass}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                <td className={sharedUnitTdClass}>
                  <UnitPill unit={r.unit} />
                </td>
                <td className={cn(requestTrailingTdClass, "font-medium text-slate-800")}>
                  {r.ticketNo ?? "—"}
                </td>
                <td className={cn(requestTrailingTdClass, "text-slate-700")}>{r.complainant ?? "—"}</td>
                <td className={cn(requestTrailingTdClass, "text-slate-700")}>{r.contactNo ?? "—"}</td>
                <td className={cn(requestTrailingTdClass, "text-slate-600")}>{r.address ?? "—"}</td>
                <td className={cn(requestTrailingTdClass, "text-slate-600")}>
                  {formatDate(r.complaintReceived)}
                </td>
                <td className={cn(requestTrailingTdClass, "text-slate-700")}>{r.receivedMethod ?? "—"}</td>
                <td className={cn(requestTrailingTdClass, "text-slate-700")}>{r.typeOfComplaint ?? "—"}</td>
                <td className={requestTrailingTdClass}>
                  <RequestStatusPill status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </DesktopDataTable>
      }
    />
  );
}
