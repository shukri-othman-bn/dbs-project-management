"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { StageBadge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  CONTRACT_MATTER_TABS,
  CONTRACT_MATTER_PLACEHOLDER_TABS,
  CONTRACT_MATTER_TAB_IDS,
  DEFAULT_CONTRACT_MATTER_TAB,
  filterContractMatterLines,
  filterContractMatterProjects,
  filterVariationOrderRows,
  filterEotRows,
  collectContractMatterFilterOptions,
  getContractMatterTabLabel,
  type ContractMatterLineRow,
  type ContractMatterProjectRow,
  type ContractMatterVariationOrderRow,
  type ContractMatterEotRow,
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

const masterListUnitThClass = cn(desktopThClass, "w-[5%]");
const masterListUnitTdClass = cn(desktopTdClass, "w-[5%] whitespace-nowrap");
const masterListProjectThClass = cn(desktopThClass, "w-[25%]");
const masterListProjectTdClass = cn(desktopTdClass, "w-[25%]");
const masterListRefsThClass = cn(desktopThClass, "w-[18%]");
const masterListRefsTdClass = cn(desktopTdClass, "w-[18%]");
const masterListContractorThClass = cn(desktopThClass, "w-[15%]");
const masterListContractorTdClass = cn(desktopTdClass, "w-[15%]");
const matterRecordUnitThClass = cn(desktopThClass, "w-[5%]");
const matterRecordUnitTdClass = cn(desktopTdClass, "w-[5%] whitespace-nowrap");
const matterRecordProjectThClass = cn(desktopThClass, "w-[20%]");
const matterRecordProjectTdClass = cn(desktopTdClass, "w-[20%]");
const matterRecordRefsThClass = cn(desktopThClass, "w-[15%]");
const matterRecordRefsTdClass = cn(desktopTdClass, "w-[15%]");
const matterRecordContractorThClass = cn(desktopThClass, "w-[15%]");
const matterRecordContractorTdClass = cn(desktopTdClass, "w-[15%]");
const matterRecordEvenThClass = cn(desktopThClass, "w-[9%]");
const matterRecordEvenTdClass = cn(desktopTdClass, "w-[9%]");
const eotUnitThClass = cn(desktopThClass, "w-[5%]");
const eotUnitTdClass = cn(desktopTdClass, "w-[5%] whitespace-nowrap");
const eotProjectThClass = cn(desktopThClass, "w-[15%]");
const eotProjectTdClass = cn(desktopTdClass, "w-[15%]");
const eotRefsThClass = cn(desktopThClass, "w-[12%]");
const eotRefsTdClass = cn(desktopTdClass, "w-[12%]");
const eotContractorThClass = cn(desktopThClass, "w-[12%]");
const eotContractorTdClass = cn(desktopTdClass, "w-[12%]");
const eotTrailingThClass = cn(desktopThClass, "w-[7%]");
const eotTrailingTdClass = cn(desktopTdClass, "w-[7%]");

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
}: {
  projects: ContractMatterProjectRow[];
  lines: ContractMatterLineRow[];
  variationOrders: ContractMatterVariationOrderRow[];
  extensionOfTimes: ContractMatterEotRow[];
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

  const contractorProjects = useMemo(() => {
    const seen = new Set<string>();
    return filteredProjects.filter((p) => {
      const key = (p.contractorName ?? "").trim().toLowerCase();
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [filteredProjects]);

  const isPlaceholder = CONTRACT_MATTER_PLACEHOLDER_TABS.has(tab);
  const activeFilters = countActiveMasterListFilters(filters);

  function patchFilters(patch: Partial<MasterListFilterState>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  let rowCount = 0;
  if (tab === "project" || tab === "contractor") rowCount = tab === "contractor" ? contractorProjects.length : filteredProjects.length;
  else if (tab === "payment") rowCount = filteredPayments.length;
  else if (tab === "variation-order") rowCount = filteredVariationOrders.length;
  else if (tab === "extension-of-time") rowCount = filteredExtensionOfTimes.length;
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
        ) : tab === "budget" ? (
          <BudgetTable rows={filteredProjects} />
        ) : (
          <ProjectTable
            rows={tab === "contractor" ? contractorProjects : filteredProjects}
          />
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

  const unitColClass = masterListUnitThClass;
  const unitTdClass = masterListUnitTdClass;
  const titleColClass = masterListProjectThClass;
  const titleTdClass = masterListProjectTdClass;
  const refsColClass = masterListRefsThClass;
  const refsTdClass = masterListRefsTdClass;
  const contractorColClass = masterListContractorThClass;
  const contractorTdClass = masterListContractorTdClass;
  const trailingColClass = cn(desktopThClass, "w-[9%]");
  const trailingTdClass = cn(desktopTdClass, "w-[9%]");

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
          <th className={masterListUnitThClass}>Unit</th>
          <th className={masterListProjectThClass}>Project</th>
          <th className={masterListRefsThClass}>Quotation / contract no.</th>
          <th className={masterListContractorThClass}>Contractor</th>
          <th className={desktopThClass}>Description</th>
          <th className={desktopThClass}>Date Claim</th>
          <th className={desktopThClass}>Date Certified</th>
          <th className={desktopThClass}>Amount Certified</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.lineId} className="border-b border-slate-100 hover:bg-slate-50">
            <td className={masterListUnitTdClass}>
              <UnitPill unit={r.unit} />
            </td>
            <td className={masterListProjectTdClass}>
              <Link href={`/projects/${r.projectId}`} className="font-medium text-slate-800 hover:underline">
                {r.title}
              </Link>
            </td>
            <td className={masterListRefsTdClass}>
              <QuotationContractCell quotationNo={r.quotationNo} contractNo={r.contractNo} />
            </td>
            <td className={masterListContractorTdClass}>
              <ContractorPill name={r.contractorName} />
            </td>
            <td className={cn(desktopTdClass, "text-slate-600")}>{r.description ?? "—"}</td>
            <td className={cn(desktopTdClass, "text-slate-600")}>{formatDate(r.claimDate)}</td>
            <td className={cn(desktopTdClass, "text-slate-600")}>{formatDate(r.date)}</td>
            <td className={desktopTdClass}>
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
              <th className={matterRecordUnitThClass}>Unit</th>
              <th className={matterRecordProjectThClass}>Project</th>
              <th className={matterRecordRefsThClass}>Quotation / contract no.</th>
              <th className={matterRecordContractorThClass}>Contractor</th>
              <th className={matterRecordEvenThClass}>Quotation / contract amount</th>
              <th className={matterRecordEvenThClass}>Variation order no.</th>
              <th className={matterRecordEvenThClass}>Variation order amount</th>
              <th className={matterRecordEvenThClass}>Variation order submitted</th>
              <th className={matterRecordEvenThClass}>Variation order approved</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                <td className={matterRecordUnitTdClass}>
                  <UnitPill unit={r.unit} />
                </td>
                <td className={matterRecordProjectTdClass}>
                  <Link
                    href={`/projects/${r.projectId}`}
                    className="font-medium text-slate-800 hover:underline"
                  >
                    {r.title}
                  </Link>
                </td>
                <td className={matterRecordRefsTdClass}>
                  <QuotationContractCell quotationNo={r.quotationNo} contractNo={r.contractNo} />
                </td>
                <td className={matterRecordContractorTdClass}>
                  <ContractorPill name={r.contractorName} />
                </td>
                <td className={cn(matterRecordEvenTdClass, "text-slate-700")}>
                  {r.quotationContractAmount != null
                    ? formatCurrency(r.quotationContractAmount)
                    : "—"}
                </td>
                <td className={cn(matterRecordEvenTdClass, "text-slate-700")}>{r.voNo ?? "—"}</td>
                <td className={matterRecordEvenTdClass}>{formatCurrency(r.voAmount)}</td>
                <td className={cn(matterRecordEvenTdClass, "text-slate-600")}>
                  {formatDate(r.submittedDate)}
                </td>
                <td className={cn(matterRecordEvenTdClass, "text-slate-600")}>
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
              <th className={eotUnitThClass}>Unit</th>
              <th className={eotProjectThClass}>Project</th>
              <th className={eotRefsThClass}>Quotation / contract no.</th>
              <th className={eotContractorThClass}>Contractor</th>
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
                <td className={eotUnitTdClass}>
                  <UnitPill unit={r.unit} />
                </td>
                <td className={eotProjectTdClass}>
                  <Link
                    href={`/projects/${r.projectId}`}
                    className="font-medium text-slate-800 hover:underline"
                  >
                    {r.title}
                  </Link>
                </td>
                <td className={eotRefsTdClass}>
                  <QuotationContractCell quotationNo={r.quotationNo} contractNo={r.contractNo} />
                </td>
                <td className={eotContractorTdClass}>
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

function BudgetTable({ rows }: { rows: ContractMatterProjectRow[] }) {
  if (rows.length === 0) return null;
  return (
    <ResponsiveDataView
      mobile={
        <MobileCardList>
          {rows.map((p) => (
            <MobileRecordCard key={p.id} href={`/projects/${p.id}`} title={p.title}>
              <MobileField label="Unit" value={<UnitPill unit={p.unit} />} />
              <MobileField label="Allocation" value={formatCurrency(p.allocation)} />
              <MobileField label="Warrant approved" value={formatCurrency(p.warrantApproved)} />
              <MobileField label="Payments certified" value={formatCurrency(p.paymentsCertified)} />
              <MobileField label="Status" value={<StageBadge stage={p.lifecycleStage} />} />
            </MobileRecordCard>
          ))}
        </MobileCardList>
      }
      desktop={
    <DesktopDataTable dense>
      <thead>
        <tr className="border-b bg-slate-50 text-left text-slate-500">
          <th className={desktopThClass}>Unit</th>
          <th className={desktopThClass}>Project</th>
          <th className={desktopThClass}>Allocation</th>
          <th className={desktopThClass}>Warrant approved</th>
          <th className={desktopThClass}>Payments certified</th>
          <th className={desktopThClass}>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => (
          <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
            <td className={desktopTdClass}>
              <UnitPill unit={p.unit} />
            </td>
            <td className={desktopTdClass}>
              <Link href={`/projects/${p.id}`} className="font-medium text-slate-800 hover:underline">
                {p.title}
              </Link>
            </td>
            <td className={desktopTdClass}>{formatCurrency(p.allocation)}</td>
            <td className={desktopTdClass}>{formatCurrency(p.warrantApproved)}</td>
            <td className={desktopTdClass}>{formatCurrency(p.paymentsCertified)}</td>
            <td className={desktopTdClass}>
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
