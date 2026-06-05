"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  TRACK_RECORD_EXPORT_FORMATS,
  TRACK_RECORD_VIEW_TABS,
  TRACK_RECORD_VIEW_TAB_IDS,
  DEFAULT_TRACK_RECORD_VIEW_TAB,
  collectContractorTrackRecordOptions,
  filterContractorTrackRecordRows,
  getTrackRecordStatusLabel,
  getTrackRecordViewTabLabel,
  type ContractorTrackRecordRow,
  type TrackRecordExportFormatId,
  type TrackRecordViewTabId,
} from "@/lib/contractor-track-record";
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
  "w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

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

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function parseTab(param: string | null): TrackRecordViewTabId {
  if (param && TRACK_RECORD_VIEW_TAB_IDS.has(param as TrackRecordViewTabId)) {
    return param as TrackRecordViewTabId;
  }
  return DEFAULT_TRACK_RECORD_VIEW_TAB;
}

export function ContractorTrackRecordList({ rows }: { rows: ContractorTrackRecordRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));

  const [contractor, setContractor] = useState("");
  const [selectedFormats, setSelectedFormats] = useState<Set<TrackRecordExportFormatId>>(
    () => new Set(TRACK_RECORD_EXPORT_FORMATS.map((f) => f.id))
  );
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const setTab = useCallback(
    (next: TrackRecordViewTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === DEFAULT_TRACK_RECORD_VIEW_TAB) params.delete("tab");
      else params.set("tab", next);
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router, searchParams]
  );

  const filterOptions = useMemo(() => collectContractorTrackRecordOptions(rows), [rows]);

  const tableRows = useMemo(
    () => filterContractorTrackRecordRows(rows, contractor),
    [rows, contractor]
  );

  function handleContractorChange(value: string) {
    setContractor(value);
    setExportMessage(null);
  }

  function toggleFormat(id: TrackRecordExportFormatId) {
    setSelectedFormats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleExportPdf() {
    if (!contractor || selectedFormats.size === 0) return;

    setExporting(true);
    setExportMessage(null);

    try {
      const params = new URLSearchParams({
        contractor,
        formats: [...selectedFormats].join(","),
        tab,
      });
      const res = await fetch(`/api/export/contractor-track-record?${params.toString()}`);
      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        setExportMessage(data.error ?? "Export failed.");
        return;
      }

      setExportMessage(data.message ?? "Export request received.");
    } catch {
      setExportMessage("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Card>
      <div className="px-6 pt-4">
        <ListTabBar tabs={TRACK_RECORD_VIEW_TABS} activeId={tab} onSelect={setTab} />
      </div>

      <CardContent className="space-y-4 border-b border-slate-100 py-4">
        <label className="block max-w-xs">
          <span className="mb-1 block text-xs font-medium text-slate-500">Contractor</span>
          <select
            value={contractor}
            onChange={(e) => handleContractorChange(e.target.value)}
            className={selectClassName}
          >
            <option value="">Select contractor</option>
            {filterOptions.contractors.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </CardContent>

      <CardContent className="space-y-0 p-0">
        {contractor ? (
          <p className="border-b border-slate-100 bg-slate-50 px-6 py-3 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{tableRows.length}</span>
            {" record"}
            {tableRows.length === 1 ? "" : "s"}
            {" for "}
            <span className="font-medium text-slate-800">{contractor}</span>
            {" · "}
            <span className="font-medium text-slate-800">{getTrackRecordViewTabLabel(tab)}</span>
          </p>
        ) : (
          <p className="border-b border-slate-100 bg-slate-50 px-6 py-3 text-sm text-slate-600">
            Select a contractor to view their track record.
          </p>
        )}

        {contractor && tableRows.length > 0 ? (
          <ResponsiveDataView
            mobile={
              <MobileCardList>
                {tableRows.map((row) => (
                  <MobileRecordCard key={row.id} href={`/projects/${row.id}`} title={row.title}>
                    <MobileField label="Contractor" value={<ContractorPill name={row.contractorName} />} />
                    <MobileField label="Tender no." value={row.tenderNo ?? "—"} />
                    <MobileField label="Quotation / contract" value={row.quotationOrContractNo ?? "—"} />
                    <MobileField label="Contractor rating" value={row.contractorRating ?? "—"} />
                    <MobileField label="Start date" value={formatDate(row.startDate)} />
                    <MobileField label="Completion" value={formatDate(row.completionDate)} />
                    <MobileField label="CPC date" value={formatDate(row.cpcDate)} />
                    <MobileField
                      label="Contract amount"
                      value={row.contractSum != null ? formatCurrency(row.contractSum) : "—"}
                    />
                    <MobileField
                      label="Project status"
                      value={getTrackRecordStatusLabel(row.lifecycleStage)}
                    />
                  </MobileRecordCard>
                ))}
              </MobileCardList>
            }
            desktop={
              <DesktopDataTable dense>
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-slate-500">
                    <th className={desktopThClass}>Contractor</th>
                    <th className={desktopThClass}>Tender no.</th>
                    <th className={desktopThClass}>Quotation / contract</th>
                    <th className={desktopThClass}>Project title</th>
                    <th className={desktopThClass}>Contractor rating</th>
                    <th className={desktopThClass}>Start date</th>
                    <th className={desktopThClass}>Completion</th>
                    <th className={desktopThClass}>CPC date</th>
                    <th className={desktopThClass}>Contract amount</th>
                    <th className={desktopThClass}>Project status</th>
                    <th className={cn(desktopThClass, "w-8")} aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                      <td className={desktopTdClass}>
                        <ContractorPill name={row.contractorName} />
                      </td>
                      <td className={cn(desktopTdClass, "text-slate-700")}>{row.tenderNo ?? "—"}</td>
                      <td className={cn(desktopTdClass, "text-slate-700")}>{row.quotationOrContractNo ?? "—"}</td>
                      <td className={desktopTdClass}>
                        <Link
                          href={`/projects/${row.id}`}
                          className="font-medium text-slate-800 hover:underline"
                        >
                          {row.title}
                        </Link>
                      </td>
                      <td className={cn(desktopTdClass, "text-slate-600")}>{row.contractorRating ?? "—"}</td>
                      <td className={cn(desktopTdClass, "text-slate-600")}>{formatDate(row.startDate)}</td>
                      <td className={cn(desktopTdClass, "text-slate-600")}>{formatDate(row.completionDate)}</td>
                      <td className={cn(desktopTdClass, "text-slate-600")}>{formatDate(row.cpcDate)}</td>
                      <td className={cn(desktopTdClass, "text-slate-700")}>
                        {row.contractSum != null ? formatCurrency(row.contractSum) : "—"}
                      </td>
                      <td className={cn(desktopTdClass, "text-slate-700")}>
                        {getTrackRecordStatusLabel(row.lifecycleStage)}
                      </td>
                      <td className={cn(desktopTdClass, "w-8 text-slate-400")}>
                        <Link
                          href={`/projects/${row.id}`}
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
        ) : contractor ? (
          <p className="px-6 py-10 text-center text-slate-500">
            No projects found for this contractor.
          </p>
        ) : null}

        {contractor && tableRows.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-5">
            <p className="text-sm font-medium text-slate-800">Formats to include in export</p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {TRACK_RECORD_EXPORT_FORMATS.map((format) => (
                <label key={format.id} className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={selectedFormats.has(format.id)}
                    onChange={() => toggleFormat(format.id)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-500"
                  />
                  {format.label}
                </label>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={handleExportPdf}
                disabled={exporting || selectedFormats.size === 0}
              >
                {exporting ? "Exporting…" : "Export as PDF"}
              </Button>
              {selectedFormats.size === 0 && (
                <p className="text-sm text-amber-700">Select at least one format to export.</p>
              )}
              {exportMessage && <p className="text-sm text-slate-600">{exportMessage}</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
