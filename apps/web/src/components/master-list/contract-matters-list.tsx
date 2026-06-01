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
    <span className="inline-block max-w-[200px] truncate rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-100">
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

      <CardContent className="p-0 overflow-x-auto">
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
    <table className="w-full min-w-[1100px] text-sm">
      <thead>
        <tr className="border-b bg-slate-50 text-left text-slate-500">
          <th className="px-6 py-3 font-medium">Unit</th>
          {showContractorFirst && <th className="px-6 py-3 font-medium">Contractor</th>}
          <th className="px-6 py-3 font-medium">Tender no.</th>
          <th className="px-6 py-3 font-medium">Quotation / contract</th>
          <th className="min-w-[240px] px-6 py-3 font-medium">Project title</th>
          {!showContractorFirst && <th className="px-6 py-3 font-medium">Contractor</th>}
          <th className="px-6 py-3 font-medium">Start date</th>
          <th className="px-6 py-3 font-medium">Completion</th>
          <th className="px-6 py-3 font-medium">Contract sum</th>
          <th className="px-6 py-3 font-medium">Project status</th>
          <th className="w-10 px-4 py-3" aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => (
          <tr key={p.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
            <td className="px-6 py-3">
              <UnitPill unit={p.unit} />
            </td>
            {showContractorFirst && (
              <td className="px-6 py-3">
                <ContractorPill name={p.contractorName} />
              </td>
            )}
            <td className="px-6 py-3 text-slate-700">{p.tenderNo ?? "—"}</td>
            <td className="px-6 py-3 text-slate-700">{p.quotationOrContractNo ?? "—"}</td>
            <td className="px-6 py-3">
              <Link href={`/projects/${p.id}`} className="font-medium text-slate-800 hover:underline">
                {p.title}
              </Link>
            </td>
            {!showContractorFirst && (
              <td className="px-6 py-3">
                <ContractorPill name={p.contractorName} />
              </td>
            )}
            <td className="px-6 py-3 text-slate-600">{formatDate(p.startDate)}</td>
            <td className="px-6 py-3 text-slate-600">{formatDate(p.completionDate)}</td>
            <td className="px-6 py-3 text-slate-700">
              {p.contractSum != null ? formatCurrency(p.contractSum) : "—"}
            </td>
            <td className="px-6 py-3">
              <StageBadge stage={p.lifecycleStage} />
            </td>
            <td className="px-4 py-3 text-slate-400">
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
    </table>
  );
}

function PaymentTable({ rows }: { rows: ContractMatterLineRow[] }) {
  if (rows.length === 0) return null;
  return (
    <table className="w-full min-w-[1000px] text-sm">
      <thead>
        <tr className="border-b bg-slate-50 text-left text-slate-500">
          <th className="px-6 py-3 font-medium">Unit</th>
          <th className="px-6 py-3 font-medium">Project</th>
          <th className="px-6 py-3 font-medium">Date</th>
          <th className="px-6 py-3 font-medium">Description</th>
          <th className="px-6 py-3 font-medium">Approved</th>
          <th className="px-6 py-3 font-medium">Certified</th>
          <th className="px-6 py-3 font-medium">Voucher</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.lineId} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="px-6 py-3">
              <UnitPill unit={r.unit} />
            </td>
            <td className="px-6 py-3">
              <Link href={`/projects/${r.projectId}`} className="font-medium text-slate-800 hover:underline">
                {r.title}
              </Link>
            </td>
            <td className="px-6 py-3 text-slate-600">{formatDate(r.date)}</td>
            <td className="px-6 py-3 text-slate-600">{r.description ?? "—"}</td>
            <td className="px-6 py-3">{formatCurrency(r.amountApproved)}</td>
            <td className="px-6 py-3">
              {r.amountCertified != null ? formatCurrency(r.amountCertified) : "—"}
            </td>
            <td className="px-6 py-3 text-slate-600">{r.voucherRef ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function WarrantTable({ rows }: { rows: ContractMatterLineRow[] }) {
  if (rows.length === 0) return null;
  return (
    <table className="w-full min-w-[1000px] text-sm">
      <thead>
        <tr className="border-b bg-slate-50 text-left text-slate-500">
          <th className="px-6 py-3 font-medium">Unit</th>
          <th className="px-6 py-3 font-medium">Project</th>
          <th className="px-6 py-3 font-medium">Date</th>
          <th className="px-6 py-3 font-medium">Description</th>
          <th className="px-6 py-3 font-medium">Approved</th>
          <th className="px-6 py-3 font-medium">Balance</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.lineId} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="px-6 py-3">
              <UnitPill unit={r.unit} />
            </td>
            <td className="px-6 py-3">
              <Link href={`/projects/${r.projectId}`} className="font-medium text-slate-800 hover:underline">
                {r.title}
              </Link>
            </td>
            <td className="px-6 py-3 text-slate-600">{formatDate(r.date)}</td>
            <td className="px-6 py-3 text-slate-600">{r.description ?? "—"}</td>
            <td className="px-6 py-3">{formatCurrency(r.amountApproved)}</td>
            <td className="px-6 py-3">
              {r.amountBalance != null ? formatCurrency(r.amountBalance) : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BudgetTable({ rows }: { rows: ContractMatterProjectRow[] }) {
  if (rows.length === 0) return null;
  return (
    <table className="w-full min-w-[900px] text-sm">
      <thead>
        <tr className="border-b bg-slate-50 text-left text-slate-500">
          <th className="px-6 py-3 font-medium">Unit</th>
          <th className="px-6 py-3 font-medium">Project</th>
          <th className="px-6 py-3 font-medium">Allocation</th>
          <th className="px-6 py-3 font-medium">Warrant approved</th>
          <th className="px-6 py-3 font-medium">Payments certified</th>
          <th className="px-6 py-3 font-medium">Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => (
          <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="px-6 py-3">
              <UnitPill unit={p.unit} />
            </td>
            <td className="px-6 py-3">
              <Link href={`/projects/${p.id}`} className="font-medium text-slate-800 hover:underline">
                {p.title}
              </Link>
            </td>
            <td className="px-6 py-3">{formatCurrency(p.allocation)}</td>
            <td className="px-6 py-3">{formatCurrency(p.warrantApproved)}</td>
            <td className="px-6 py-3">{formatCurrency(p.paymentsCertified)}</td>
            <td className="px-6 py-3">
              <StageBadge stage={p.lifecycleStage} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
