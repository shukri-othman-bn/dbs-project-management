"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
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
  collectContractMatterFilterOptions,
  getContractMatterTabLabel,
  type ContractMatterLineRow,
  type ContractMatterProjectRow,
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

function parseTab(param: string | null): ContractMatterTabId {
  if (param && CONTRACT_MATTER_TAB_IDS.has(param as ContractMatterTabId)) {
    return param as ContractMatterTabId;
  }
  return DEFAULT_CONTRACT_MATTER_TAB;
}

export function ContractMattersList({
  projects,
  lines,
}: {
  projects: ContractMatterProjectRow[];
  lines: ContractMatterLineRow[];
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
  const warrantLines = useMemo(
    () => lines.filter((l) => l.lineType === "warrant"),
    [lines]
  );

  const filteredPayments = useMemo(
    () => filterContractMatterLines(paymentLines, dropdownFilters),
    [paymentLines, filters]
  );
  const filteredWarrants = useMemo(
    () => filterContractMatterLines(warrantLines, dropdownFilters),
    [warrantLines, filters]
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
  else if (tab === "warrant") rowCount = filteredWarrants.length;
  else if (tab === "budget") rowCount = filteredProjects.length;

  return (
    <Card>
      <div className="px-6 pt-4">
        <ListTabBar
          tabs={CONTRACT_MATTER_TABS}
          activeId={tab}
          onSelect={setTab}
          columns={6}
        />
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
        ) : tab === "warrant" ? (
          <WarrantTable rows={filteredWarrants} />
        ) : tab === "budget" ? (
          <BudgetTable rows={filteredProjects} />
        ) : (
          <ProjectTable
            rows={tab === "contractor" ? contractorProjects : filteredProjects}
            showContractorFirst={tab === "contractor"}
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
        Records for this matter type are not in the system yet. Use the Project, Payment, Warrant, or
        Budget tabs for live data.
      </p>
    </div>
  );
}

function ProjectTable({
  rows,
  showContractorFirst,
}: {
  rows: ContractMatterProjectRow[];
  showContractorFirst?: boolean;
}) {
  if (rows.length === 0) return null;

  return (
    <ResponsiveDataView
      mobile={
        <MobileCardList>
          {rows.map((p) => (
            <MobileRecordCard key={p.id} href={`/projects/${p.id}`} title={p.title}>
              <MobileField label="Unit" value={<UnitPill unit={p.unit} />} />
              {showContractorFirst && (
                <MobileField label="Contractor" value={<ContractorPill name={p.contractorName} />} />
              )}
              <MobileField label="Tender no." value={p.tenderNo ?? "—"} />
              <MobileField label="Quotation / contract" value={p.quotationOrContractNo ?? "—"} />
              {!showContractorFirst && (
                <MobileField label="Contractor" value={<ContractorPill name={p.contractorName} />} />
              )}
              <MobileField label="Start date" value={formatDate(p.startDate)} />
              <MobileField label="Completion" value={formatDate(p.completionDate)} />
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
          <th className={desktopThClass}>Unit</th>
          {showContractorFirst && <th className={desktopThClass}>Contractor</th>}
          <th className={desktopThClass}>Tender no.</th>
          <th className={desktopThClass}>Quotation / contract</th>
          <th className={desktopThClass}>Project title</th>
          {!showContractorFirst && <th className={desktopThClass}>Contractor</th>}
          <th className={desktopThClass}>Start date</th>
          <th className={desktopThClass}>Completion</th>
          <th className={desktopThClass}>Contract sum</th>
          <th className={desktopThClass}>Project status</th>
          <th className={cn(desktopThClass, "w-8")} aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => (
          <tr key={p.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
            <td className={desktopTdClass}>
              <UnitPill unit={p.unit} />
            </td>
            {showContractorFirst && (
              <td className={desktopTdClass}>
                <ContractorPill name={p.contractorName} />
              </td>
            )}
            <td className={cn(desktopTdClass, "text-slate-700")}>{p.tenderNo ?? "—"}</td>
            <td className={cn(desktopTdClass, "text-slate-700")}>{p.quotationOrContractNo ?? "—"}</td>
            <td className={desktopTdClass}>
              <Link href={`/projects/${p.id}`} className="font-medium text-slate-800 hover:underline">
                {p.title}
              </Link>
            </td>
            {!showContractorFirst && (
              <td className={desktopTdClass}>
                <ContractorPill name={p.contractorName} />
              </td>
            )}
            <td className={cn(desktopTdClass, "text-slate-600")}>{formatDate(p.startDate)}</td>
            <td className={cn(desktopTdClass, "text-slate-600")}>{formatDate(p.completionDate)}</td>
            <td className={cn(desktopTdClass, "text-slate-700")}>
              {p.contractSum != null ? formatCurrency(p.contractSum) : "—"}
            </td>
            <td className={desktopTdClass}>
              <StageBadge stage={p.lifecycleStage} />
            </td>
            <td className={cn(desktopTdClass, "w-8 text-slate-400")}>
              <Link
                href={`/projects/${p.id}`}
                className="inline-flex rounded p-1 hover:bg-slate-100 hover:text-slate-600"
                title="Open project"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Link>
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
              <MobileField label="Date" value={formatDate(r.date)} />
              <MobileField label="Description" value={r.description ?? "—"} span={3} />
              <MobileField label="Approved" value={formatCurrency(r.amountApproved)} />
              <MobileField
                label="Certified"
                value={r.amountCertified != null ? formatCurrency(r.amountCertified) : "—"}
              />
              <MobileField label="Voucher" value={r.voucherRef ?? "—"} />
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
          <th className={desktopThClass}>Date</th>
          <th className={desktopThClass}>Description</th>
          <th className={desktopThClass}>Approved</th>
          <th className={desktopThClass}>Certified</th>
          <th className={desktopThClass}>Voucher</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.lineId} className="border-b border-slate-100 hover:bg-slate-50">
            <td className={desktopTdClass}>
              <UnitPill unit={r.unit} />
            </td>
            <td className={desktopTdClass}>
              <Link href={`/projects/${r.projectId}`} className="font-medium text-slate-800 hover:underline">
                {r.title}
              </Link>
            </td>
            <td className={cn(desktopTdClass, "text-slate-600")}>{formatDate(r.date)}</td>
            <td className={cn(desktopTdClass, "text-slate-600")}>{r.description ?? "—"}</td>
            <td className={desktopTdClass}>{formatCurrency(r.amountApproved)}</td>
            <td className={desktopTdClass}>
              {r.amountCertified != null ? formatCurrency(r.amountCertified) : "—"}
            </td>
            <td className={cn(desktopTdClass, "text-slate-600")}>{r.voucherRef ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </DesktopDataTable>
      }
    />
  );
}

function WarrantTable({ rows }: { rows: ContractMatterLineRow[] }) {
  if (rows.length === 0) return null;
  return (
    <ResponsiveDataView
      mobile={
        <MobileCardList>
          {rows.map((r) => (
            <MobileRecordCard key={r.lineId} href={`/projects/${r.projectId}`} title={r.title}>
              <MobileField label="Unit" value={<UnitPill unit={r.unit} />} />
              <MobileField label="Date" value={formatDate(r.date)} />
              <MobileField label="Description" value={r.description ?? "—"} span={3} />
              <MobileField label="Approved" value={formatCurrency(r.amountApproved)} />
              <MobileField
                label="Balance"
                value={r.amountBalance != null ? formatCurrency(r.amountBalance) : "—"}
              />
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
          <th className={desktopThClass}>Date</th>
          <th className={desktopThClass}>Description</th>
          <th className={desktopThClass}>Approved</th>
          <th className={desktopThClass}>Balance</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.lineId} className="border-b border-slate-100 hover:bg-slate-50">
            <td className={desktopTdClass}>
              <UnitPill unit={r.unit} />
            </td>
            <td className={desktopTdClass}>
              <Link href={`/projects/${r.projectId}`} className="font-medium text-slate-800 hover:underline">
                {r.title}
              </Link>
            </td>
            <td className={cn(desktopTdClass, "text-slate-600")}>{formatDate(r.date)}</td>
            <td className={cn(desktopTdClass, "text-slate-600")}>{r.description ?? "—"}</td>
            <td className={desktopTdClass}>{formatCurrency(r.amountApproved)}</td>
            <td className={desktopTdClass}>
              {r.amountBalance != null ? formatCurrency(r.amountBalance) : "—"}
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
