"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { StageBadge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  CONTRACT_MATTER_TABS,
  CONTRACT_MATTER_PLACEHOLDER_TABS,
  CONTRACT_MATTER_TAB_IDS,
  DEFAULT_CONTRACT_MATTER_TAB,
  filterContractMatterLines,
  filterContractMatterProjects,
  filterVariationOrderRows,
  filterEotRows,
  filterJobOrderRows,
  filterPurchaseOrderRows,
  filterRequestRows,
  collectContractMatterFilterOptions,
  getContractMatterTabLabel,
  type ContractMatterLineRow,
  type ContractMatterProjectRow,
  type ContractMatterVariationOrderRow,
  type ContractMatterEotRow,
  type ContractMatterJobOrderRow,
  type ContractMatterPurchaseOrderRow,
  type ContractMatterRequestRow,
  type ContractMatterTabId,
} from "@/lib/contract-matters-filters";
import { countActiveMasterListFilters, type MasterListFilterState } from "@/lib/master-list-filters";
import { cn } from "@/lib/utils";
import { ListTabBar } from "@/components/master-list/list-tab-bar";
import { MasterListFiltersBar } from "@/components/master-list/master-list-filters-bar";
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

const sharedUnitThClass = cn(desktopThClass, "w-[5%]");
const sharedUnitTdClass = cn(desktopTdClass, "w-[5%] whitespace-nowrap");
const sharedProjectThClass = cn(desktopThClass, "w-[18%]");
const sharedProjectTdClass = cn(desktopTdClass, "w-[18%]");
const sharedRefsThClass = cn(desktopThClass, "w-[13%]");
const sharedRefsTdClass = cn(desktopTdClass, "w-[13%]");
const sharedContractorThClass = cn(desktopThClass, "w-[13%]");
const sharedContractorTdClass = cn(desktopTdClass, "w-[13%]");
const projectTrailingThClass = cn(desktopThClass, "w-[10.2%]");
const projectTrailingTdClass = cn(desktopTdClass, "w-[10.2%]");
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
const budgetTrailingThClass = cn(desktopThClass, "w-[15.4%]");
const budgetTrailingTdClass = cn(desktopTdClass, "w-[15.4%]");
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

function parseTab(param: string | null): ContractMatterTabId {
  if (param && CONTRACT_MATTER_TAB_IDS.has(param as ContractMatterTabId)) {
    return param as ContractMatterTabId;
  }
  return DEFAULT_CONTRACT_MATTER_TAB;
}

export function ContractMattersList({
  projects,
  lines,
  variationOrders,
  extensionOfTimes,
  jobOrders,
  purchaseOrders,
  requests,
}: {
  projects: ContractMatterProjectRow[];
  lines: ContractMatterLineRow[];
  variationOrders: ContractMatterVariationOrderRow[];
  extensionOfTimes: ContractMatterEotRow[];
  jobOrders: ContractMatterJobOrderRow[];
  purchaseOrders: ContractMatterPurchaseOrderRow[];
  requests: ContractMatterRequestRow[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));

  const [filters, setFilters] = useState<MasterListFilterState>({
    search: "",
    unit: "",
    vote: "",
    contractor: "",
    projectType: "",
    projectStatus: "",
    ministry: "",
    department: "",
  });

  const setTab = useCallback(
    (next: ContractMatterTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === DEFAULT_CONTRACT_MATTER_TAB) params.delete("tab");
      else params.set("tab", next);
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router, searchParams]
  );

  const filterOptions = useMemo(() => collectContractMatterFilterOptions(projects), [projects]);

  const dropdownFilters = filters;

  const filteredProjects = useMemo(
    () => filterContractMatterProjects(projects, dropdownFilters),
    [projects, filters]
  );

  const paymentLines = useMemo(
    () => lines.filter((l) => l.lineType === "payment"),
    [lines]
  );

  const filteredPayments = useMemo(
    () => filterContractMatterLines(paymentLines, dropdownFilters),
    [paymentLines, filters]
  );

  const filteredVariationOrders = useMemo(
    () => filterVariationOrderRows(variationOrders, dropdownFilters),
    [variationOrders, filters]
  );

  const filteredExtensionOfTimes = useMemo(
    () => filterEotRows(extensionOfTimes, dropdownFilters),
    [extensionOfTimes, filters]
  );

  const filteredJobOrders = useMemo(
    () => filterJobOrderRows(jobOrders, dropdownFilters),
    [jobOrders, filters]
  );

  const filteredPurchaseOrders = useMemo(
    () => filterPurchaseOrderRows(purchaseOrders, dropdownFilters),
    [purchaseOrders, filters]
  );

  const filteredRequests = useMemo(
    () => filterRequestRows(requests, dropdownFilters),
    [requests, filters]
  );

  const isPlaceholder = CONTRACT_MATTER_PLACEHOLDER_TABS.has(tab);
  const activeFilters = countActiveMasterListFilters(filters);

  function patchFilters(patch: Partial<MasterListFilterState>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  let rowCount = 0;
  if (tab === "project") rowCount = filteredProjects.length;
  else if (tab === "payment") rowCount = filteredPayments.length;
  else if (tab === "variation-order") rowCount = filteredVariationOrders.length;
  else if (tab === "extension-of-time") rowCount = filteredExtensionOfTimes.length;
  else if (tab === "job-order") rowCount = filteredJobOrders.length;
  else if (tab === "purchase-order") rowCount = filteredPurchaseOrders.length;
  else if (tab === "request") rowCount = filteredRequests.length;
  else if (tab === "budget") rowCount = filteredProjects.length;

  return (
    <Card>
      <div className="px-6 pt-4">
        <ListTabBar tabs={CONTRACT_MATTER_TABS} activeId={tab} onSelect={setTab} />
      </div>

      <CardContent className="space-y-4 border-b border-slate-100 py-4">
        <MasterListFiltersBar
          filters={filters}
          options={filterOptions}
          onSearchChange={(search) => patchFilters({ search })}
          onUnitChange={(unit) => patchFilters({ unit })}
          onVoteChange={(vote) => patchFilters({ vote })}
          onContractorChange={(contractor) => patchFilters({ contractor })}
          onProjectTypeChange={(projectType) => patchFilters({ projectType })}
          onProjectStatusChange={(projectStatus) => patchFilters({ projectStatus })}
          onMinistryChange={(ministry) => patchFilters({ ministry })}
          onDepartmentChange={(department) => patchFilters({ department })}
        />
      </CardContent>

      <CardContent className="p-0">
        {!isPlaceholder && (
          <p className="border-b border-slate-100 bg-slate-50 px-6 py-3 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{rowCount}</span>
            {" record"}
            {rowCount === 1 ? "" : "s"}
            {" in "}
            <span className="font-medium text-slate-800">{getContractMatterTabLabel(tab)}</span>
            {activeFilters > 0 && (
              <span className="text-slate-500">
                {" "}
                · {activeFilters} filter{activeFilters === 1 ? "" : "s"} applied
              </span>
            )}
            {filters.search.trim() && (
              <span className="text-slate-500"> · matching &ldquo;{filters.search.trim()}&rdquo;</span>
            )}
          </p>
        )}
        {isPlaceholder ? (
          <PlaceholderPanel tab={tab} />
        ) : tab === "payment" ? (
          <PaymentTable rows={filteredPayments} />
        ) : tab === "variation-order" ? (
          <VariationOrderTable rows={filteredVariationOrders} />
        ) : tab === "extension-of-time" ? (
          <ExtensionOfTimeTable rows={filteredExtensionOfTimes} />
        ) : tab === "job-order" ? (
          <JobOrderTable rows={filteredJobOrders} />
        ) : tab === "purchase-order" ? (
          <PurchaseOrderTable rows={filteredPurchaseOrders} />
        ) : tab === "request" ? (
          <RequestTable rows={filteredRequests} />
        ) : tab === "budget" ? (
          <BudgetTable rows={filteredProjects} />
        ) : (
          <ProjectTable rows={filteredProjects} />
        )}

        {!isPlaceholder && rowCount === 0 && (
          <p className="px-6 py-10 text-center text-slate-500">
            No records match the current filters.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PlaceholderPanel({ tab }: { tab: ContractMatterTabId }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-sm font-medium text-slate-700">{getContractMatterTabLabel(tab)}</p>
      <p className="mt-2 text-sm text-slate-500">
        Records for this matter type are not in the system yet. Use the Project, Payment, or
        Budget tabs for live data.
      </p>
    </div>
  );
}

function ProjectTable({ rows }: { rows: ContractMatterProjectRow[] }) {
  if (rows.length === 0) return null;

  const unitColClass = sharedUnitThClass;
  const unitTdClass = sharedUnitTdClass;
  const titleColClass = sharedProjectThClass;
  const titleTdClass = sharedProjectTdClass;
  const refsColClass = sharedRefsThClass;
  const refsTdClass = sharedRefsTdClass;
  const contractorColClass = sharedContractorThClass;
  const contractorTdClass = sharedContractorTdClass;
  const trailingColClass = projectTrailingThClass;
  const trailingTdClass = projectTrailingTdClass;

  return (
    <ResponsiveDataView
      mobile={
        <MobileCardList>
          {rows.map((p) => (
            <MobileRecordCard key={p.id} href={`/projects/${p.id}`} title={p.title}>
              <MobileField label="Unit" value={<UnitPill unit={p.unit} />} />
              <MobileField
                label="Tender / quotation / contract"
                value={
                  <RefNumbersCell
                    tenderNo={p.tenderNo}
                    quotationNo={p.quotationNo}
                    contractNo={p.contractNo}
                  />
                }
                span={3}
              />
              <MobileField label="Contractor" value={<ContractorPill name={p.contractorName} />} />
              <MobileField label="Start date" value={formatDate(p.startDate)} />
              <MobileField label="Completion" value={formatDate(p.completionDate)} />
              <MobileField label="Contract period" value={p.contractPeriod ?? "—"} />
              <MobileField
                label="Contract sum"
                value={p.contractSum != null ? formatCurrency(p.contractSum) : "—"}
              />
              <MobileField label="Project status" value={<StageBadge stage={p.lifecycleStage} />} />
            </MobileRecordCard>
          ))}
        </MobileCardList>
      }
      desktop={
    <DesktopDataTable dense>
      <thead>
        <tr className="border-b bg-slate-50 text-left text-slate-500">
          <th className={unitColClass}>Unit</th>
          <th className={titleColClass}>Project title</th>
          <th className={refsColClass}>Tender / quotation / contract</th>
          <th className={contractorColClass}>Contractor</th>
          <th className={trailingColClass}>Start date</th>
          <th className={trailingColClass}>Completion</th>
          <th className={trailingColClass}>Contract period</th>
          <th className={trailingColClass}>Contract sum</th>
          <th className={trailingColClass}>Project status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => (
          <tr key={p.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
            <td className={unitTdClass}>
              <UnitPill unit={p.unit} />
            </td>
            <td className={titleTdClass}>
              <Link href={`/projects/${p.id}`} className="font-medium text-slate-800 hover:underline">
                {p.title}
              </Link>
            </td>
            <td className={refsTdClass}>
              <RefNumbersCell
                tenderNo={p.tenderNo}
                quotationNo={p.quotationNo}
                contractNo={p.contractNo}
              />
            </td>
            <td className={contractorTdClass}>
              <ContractorPill name={p.contractorName} />
            </td>
            <td className={cn(trailingTdClass, "text-slate-600")}>{formatDate(p.startDate)}</td>
            <td className={cn(trailingTdClass, "text-slate-600")}>{formatDate(p.completionDate)}</td>
            <td className={cn(trailingTdClass, "text-slate-700")}>{p.contractPeriod ?? "—"}</td>
            <td className={cn(trailingTdClass, "text-slate-700")}>
              {p.contractSum != null ? formatCurrency(p.contractSum) : "—"}
            </td>
            <td className={trailingTdClass}>
              <StageBadge stage={p.lifecycleStage} />
            </td>
          </tr>
        ))}
      </tbody>
    </DesktopDataTable>
      }
    />
  );
}

function PaymentTable({ rows }: { rows: ContractMatterLineRow[] }) {
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
              <MobileField label="Description" value={r.description ?? "—"} span={3} />
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
          <th className={paymentTrailingThClass}>Description</th>
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
            <td className={cn(paymentTrailingTdClass, "text-slate-600")}>{r.description ?? "—"}</td>
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

function VariationOrderTable({ rows }: { rows: ContractMatterVariationOrderRow[] }) {
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

function ExtensionOfTimeTable({ rows }: { rows: ContractMatterEotRow[] }) {
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

function JobOrderTable({ rows }: { rows: ContractMatterJobOrderRow[] }) {
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

function PurchaseOrderTable({ rows }: { rows: ContractMatterPurchaseOrderRow[] }) {
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
              <MobileField label="Claim date" value={formatDate(r.claimDate)} />
              <MobileField
                label="Claim certified"
                value={r.claimCertified != null ? formatCurrency(r.claimCertified) : "—"}
              />
              <MobileField label="PO amount" value={formatCurrency(r.poAmount)} />
              <MobileField label="SES date" value={formatDate(r.sesDate)} />
              <MobileField label="Invoice date" value={formatDate(r.invoiceDate)} />
              <MobileField label="E-dispatched date" value={formatDate(r.eDispatchedDate)} />
              <MobileField label="Paid date" value={formatDate(r.paidDate)} />
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
              <th className={poTrailingThClass}>Contract amount</th>
              <th className={poTrailingThClass}>Claim date</th>
              <th className={poTrailingThClass}>Claim certified</th>
              <th className={poTrailingThClass}>PO amount</th>
              <th className={poTrailingThClass}>SES date</th>
              <th className={poTrailingThClass}>Invoice date</th>
              <th className={poTrailingThClass}>E-dispatched date</th>
              <th className={poTrailingThClass}>Paid date</th>
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
                <td className={cn(poTrailingTdClass, "text-slate-700")}>
                  {r.contractAmount != null ? formatCurrency(r.contractAmount) : "—"}
                </td>
                <td className={cn(poTrailingTdClass, "text-slate-600")}>{formatDate(r.claimDate)}</td>
                <td className={poTrailingTdClass}>
                  {r.claimCertified != null ? formatCurrency(r.claimCertified) : "—"}
                </td>
                <td className={poTrailingTdClass}>{formatCurrency(r.poAmount)}</td>
                <td className={cn(poTrailingTdClass, "text-slate-600")}>{formatDate(r.sesDate)}</td>
                <td className={cn(poTrailingTdClass, "text-slate-600")}>{formatDate(r.invoiceDate)}</td>
                <td className={cn(poTrailingTdClass, "text-slate-600")}>
                  {formatDate(r.eDispatchedDate)}
                </td>
                <td className={cn(poTrailingTdClass, "text-slate-600")}>{formatDate(r.paidDate)}</td>
              </tr>
            ))}
          </tbody>
        </DesktopDataTable>
      }
    />
  );
}

function RequestTable({ rows }: { rows: ContractMatterRequestRow[] }) {
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

function BudgetTable({ rows }: { rows: ContractMatterProjectRow[] }) {
  if (rows.length === 0) return null;
  return (
    <ResponsiveDataView
      mobile={
        <MobileCardList>
          {rows.map((p) => (
            <MobileRecordCard key={p.id} href={`/projects/${p.id}`} title={p.title}>
              <MobileField label="Unit" value={<UnitPill unit={p.unit} />} />
              <MobileField label="Status" value={<StageBadge stage={p.lifecycleStage} />} />
              <MobileField label="Vote" value={p.vote ?? "—"} />
              <MobileField label="Allocation" value={formatCurrency(p.allocation)} />
              <MobileField label="Warrant" value={formatCurrency(p.warrantApproved)} />
              <MobileField label="Payments certified" value={formatCurrency(p.paymentsCertified)} />
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
              <th className={budgetTrailingThClass}>Status</th>
              <th className={budgetTrailingThClass}>Vote</th>
              <th className={budgetTrailingThClass}>Allocation</th>
              <th className={budgetTrailingThClass}>Warrant</th>
              <th className={budgetTrailingThClass}>Payments certified</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className={sharedUnitTdClass}>
                  <UnitPill unit={p.unit} />
                </td>
                <td className={sharedProjectTdClass}>
                  <Link href={`/projects/${p.id}`} className="font-medium text-slate-800 hover:underline">
                    {p.title}
                  </Link>
                </td>
                <td className={budgetTrailingTdClass}>
                  <StageBadge stage={p.lifecycleStage} />
                </td>
                <td className={cn(budgetTrailingTdClass, "text-slate-700")}>{p.vote ?? "—"}</td>
                <td className={budgetTrailingTdClass}>{formatCurrency(p.allocation)}</td>
                <td className={budgetTrailingTdClass}>{formatCurrency(p.warrantApproved)}</td>
                <td className={budgetTrailingTdClass}>{formatCurrency(p.paymentsCertified)}</td>
              </tr>
            ))}
          </tbody>
        </DesktopDataTable>
      }
    />
  );
}
