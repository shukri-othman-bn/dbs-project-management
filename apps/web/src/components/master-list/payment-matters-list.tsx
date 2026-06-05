"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MoreHorizontal, Tag, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { PROJECT_TYPE_LABELS } from "@/lib/project-labels";
import {
  PAYMENT_MATTER_TABS,
  PAYMENT_MATTER_TAB_IDS,
  DEFAULT_PAYMENT_MATTER_TAB,
  collectPaymentMatterFilterOptions,
  filterPaymentMatterRows,
  getPaymentMatterTabLabel,
  getPaymentMatterStatusLabel,
  type PaymentMatterRow,
  type PaymentMatterTabId,
  type PaymentMatterStatus,
} from "@/lib/payment-matters-filters";
import { cn } from "@/lib/utils";
import { ListTabBar } from "@/components/master-list/list-tab-bar";
import {
  DesktopDataTable,
  desktopTdClass,
  desktopThClass,
  MobileCardList,
  MobileField,
  MobileRecordCard,
  ResponsiveDataView,
} from "@/components/ui/responsive-data";

const selectClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block min-w-[120px] flex-1">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClassName}>
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function parseTab(param: string | null): PaymentMatterTabId {
  if (param && PAYMENT_MATTER_TAB_IDS.has(param as PaymentMatterTabId)) {
    return param as PaymentMatterTabId;
  }
  return DEFAULT_PAYMENT_MATTER_TAB;
}

const UNIT_PILL_COLORS = [
  "bg-violet-100 text-violet-800 ring-violet-200/60",
  "bg-pink-100 text-pink-800 ring-pink-200/60",
  "bg-sky-100 text-sky-800 ring-sky-200/60",
  "bg-emerald-100 text-emerald-800 ring-emerald-200/60",
];

const CONTRACTOR_PILL_COLORS = [
  "bg-purple-100 text-purple-900 ring-purple-200/60",
  "bg-lime-100 text-lime-900 ring-lime-200/60",
  "bg-cyan-100 text-cyan-900 ring-cyan-200/60",
  "bg-amber-100 text-amber-900 ring-amber-200/60",
];

function pillColor(key: string, palette: string[]) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash + key.charCodeAt(i) * (i + 1)) % palette.length;
  return palette[hash];
}

function UnitPill({ unit }: { unit: string | null }) {
  if (!unit) return <span className="text-slate-400">—</span>;
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
        pillColor(unit, UNIT_PILL_COLORS)
      )}
    >
      {unit}
    </span>
  );
}

function ContractorPill({ name }: { name: string | null }) {
  if (!name) return <span className="text-slate-400">—</span>;
  return (
    <span
      className={cn(
        "inline-block max-w-full break-words rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
        pillColor(name, CONTRACTOR_PILL_COLORS)
      )}
      title={name}
    >
      {name}
    </span>
  );
}

function StatusBadge({ status }: { status: PaymentMatterStatus }) {
  const styles: Record<PaymentMatterStatus, string> = {
    "in-process": "bg-orange-500 text-white",
    "claim-received": "bg-red-500 text-white",
    query: "bg-purple-500 text-white",
    paid: "bg-emerald-600 text-white",
  };

  return (
    <span
      className={cn(
        "inline-block rounded-full px-3 py-0.5 text-xs font-medium",
        styles[status]
      )}
    >
      {getPaymentMatterStatusLabel(status)}
    </span>
  );
}

function ColumnHeader({
  label,
  icon,
}: {
  label: string;
  icon: "tag" | "filter";
}) {
  const Icon = icon === "tag" ? Tag : Filter;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 opacity-70" />
      {label}
    </span>
  );
}

export function PaymentMattersList({ rows }: { rows: PaymentMatterRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));
  const [search, setSearch] = useState("");
  const [unit, setUnit] = useState("");
  const [vote, setVote] = useState("");
  const [contractor, setContractor] = useState("");
  const [projectType, setProjectType] = useState("");
  const [projectStatus, setProjectStatus] = useState("");
  const [ministry, setMinistry] = useState("");
  const [department, setDepartment] = useState("");

  const setTab = useCallback(
    (next: PaymentMatterTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === DEFAULT_PAYMENT_MATTER_TAB) params.delete("tab");
      else params.set("tab", next);
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router, searchParams]
  );

  const filterOptions = useMemo(() => collectPaymentMatterFilterOptions(rows), [rows]);

  const dropdownFilters = {
    search,
    unit,
    vote,
    contractor,
    projectType,
    projectStatus,
    ministry,
    department,
    tab,
  };

  const filteredRows = useMemo(
    () => filterPaymentMatterRows(rows, dropdownFilters),
    [rows, search, unit, vote, contractor, projectType, projectStatus, ministry, department, tab]
  );

  const activeFilters = [unit, vote, contractor, projectType, projectStatus, ministry, department].filter(
    Boolean
  ).length;

  return (
    <Card>
      <div className="border-b border-slate-100 px-6 pt-5 pb-1 text-center">
        <h2 className="text-lg font-semibold text-orange-700">
          Payment certification &amp; processes
        </h2>
      </div>

      <div className="px-6 pt-3">
        <ListTabBar
          tabs={PAYMENT_MATTER_TABS}
          activeId={tab}
          onSelect={setTab}
          columns={4}
        />
      </div>

      <CardContent className="space-y-4 border-b border-slate-100 py-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <FilterSelect label="Unit" value={unit} onChange={setUnit} options={filterOptions.units} />
          <FilterSelect label="Vote" value={vote} onChange={setVote} options={filterOptions.votes} />
          <FilterSelect
            label="Contractor"
            value={contractor}
            onChange={setContractor}
            options={filterOptions.contractors}
          />
          <label className="block min-w-[120px] flex-1">
            <span className="mb-1 block text-xs font-medium text-slate-500">Project Type</span>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className={selectClassName}
            >
              <option value="">All</option>
              {filterOptions.projectTypes.map((pt) => (
                <option key={pt} value={pt}>
                  {PROJECT_TYPE_LABELS[pt]}
                </option>
              ))}
            </select>
          </label>
          <FilterSelect
            label="Project Status"
            value={projectStatus}
            onChange={setProjectStatus}
            options={filterOptions.statuses}
          />
          <FilterSelect
            label="Ministry"
            value={ministry}
            onChange={setMinistry}
            options={filterOptions.ministries}
          />
          <FilterSelect
            label="Department"
            value={department}
            onChange={setDepartment}
            options={filterOptions.departments}
          />
        </div>
      </CardContent>

      <CardContent className="space-y-0 p-0">
        <p className="border-b border-slate-100 bg-slate-50 px-6 py-3 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{filteredRows.length}</span>
          {" record"}
          {filteredRows.length === 1 ? "" : "s"}
          {" in "}
          <span className="font-medium text-slate-800">{getPaymentMatterTabLabel(tab)}</span>
          {activeFilters > 0 && (
            <span className="text-slate-500">
              {" "}
              · {activeFilters} filter{activeFilters === 1 ? "" : "s"} applied
            </span>
          )}
          {search.trim() && (
            <span className="text-slate-500"> · matching &ldquo;{search.trim()}&rdquo;</span>
          )}
        </p>

        {filteredRows.length > 0 ? (
          <ResponsiveDataView
            mobile={
              <MobileCardList>
                {filteredRows.map((row) => (
                  <MobileRecordCard
                    key={row.lineId}
                    href={`/projects/${row.projectId}`}
                    title={row.projectReference ?? "—"}
                    subtitle={row.projectTitle}
                  >
                    <MobileField label="Unit" value={<UnitPill unit={row.unit} />} />
                    <MobileField label="Payment No" value={row.paymentNo} />
                    <MobileField
                      label="Certified Amount"
                      value={
                        row.certifiedAmount != null
                          ? formatCurrency(row.certifiedAmount)
                          : "—"
                      }
                    />
                    <MobileField label="Contractor" value={<ContractorPill name={row.contractorName} />} />
                    <MobileField label="Status" value={<StatusBadge status={row.status} />} />
                  </MobileRecordCard>
                ))}
              </MobileCardList>
            }
            desktop={
              <DesktopDataTable dense>
                <thead>
                  <tr className="border-b bg-teal-400/90 text-white">
                    <th className={cn(desktopThClass, "bg-teal-400/90 text-white")}>
                      <ColumnHeader label="Unit" icon="tag" />
                    </th>
                    <th className={cn(desktopThClass, "bg-teal-400/90 text-white")}>
                      <ColumnHeader label="Project Reference" icon="filter" />
                    </th>
                    <th className={cn(desktopThClass, "bg-teal-400/90 text-white")}>
                      <ColumnHeader label="Payment No" icon="filter" />
                    </th>
                    <th className={cn(desktopThClass, "bg-teal-400/90 text-white")}>
                      <ColumnHeader label="Certified Amount" icon="filter" />
                    </th>
                    <th className={cn(desktopThClass, "bg-teal-400/90 text-white")}>
                      <ColumnHeader label="Contractor" icon="tag" />
                    </th>
                    <th className={cn(desktopThClass, "bg-teal-400/90 text-white")}>
                      <ColumnHeader label="Status" icon="tag" />
                    </th>
                    <th className={cn(desktopThClass, "w-8 bg-teal-400/90 text-white")} aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr
                      key={row.lineId}
                      className="border-b border-slate-100 align-top hover:bg-slate-50/80"
                    >
                      <td className={desktopTdClass}>
                        <UnitPill unit={row.unit} />
                      </td>
                      <td className={desktopTdClass}>
                        <Link
                          href={`/projects/${row.projectId}`}
                          className="group block space-y-1"
                        >
                          <span className="font-semibold text-slate-900 group-hover:underline">
                            {row.projectReference ?? "—"}
                          </span>
                          <span className="block text-xs leading-relaxed text-slate-500 uppercase">
                            {row.projectTitle}
                          </span>
                        </Link>
                      </td>
                      <td className={cn(desktopTdClass, "text-slate-700")}>{row.paymentNo}</td>
                      <td className={cn(desktopTdClass, "font-medium text-slate-800")}>
                        {row.certifiedAmount != null
                          ? formatCurrency(row.certifiedAmount)
                          : "—"}
                      </td>
                      <td className={desktopTdClass}>
                        <ContractorPill name={row.contractorName} />
                      </td>
                      <td className={desktopTdClass}>
                        <StatusBadge status={row.status} />
                      </td>
                      <td className={cn(desktopTdClass, "w-8 text-slate-400")}>
                        <Link
                          href={`/projects/${row.projectId}`}
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
        ) : (
          <p className="px-6 py-10 text-center text-slate-500">
            No payment records match the current filters.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
