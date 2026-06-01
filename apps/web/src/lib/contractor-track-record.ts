import { LifecycleStage } from "@prisma/client";
import { STAGE_STATUS_LABELS } from "./project-labels";

export const TRACK_RECORD_VIEW_TABS = [
  { id: "dbs-qage", label: "DBS format QAGe" },
  { id: "dbs-cage", label: "DBS Format CAGe" },
  { id: "pwd", label: "PWD format" },
] as const;

export type TrackRecordViewTabId = (typeof TRACK_RECORD_VIEW_TABS)[number]["id"];

export const TRACK_RECORD_VIEW_TAB_IDS = new Set(
  TRACK_RECORD_VIEW_TABS.map((t) => t.id)
);

export const DEFAULT_TRACK_RECORD_VIEW_TAB: TrackRecordViewTabId = "dbs-qage";

export const TRACK_RECORD_EXPORT_FORMATS = [
  { id: "dbs-qage", label: "DBS format QAGe" },
  { id: "dbs-cage", label: "DBS Format CAGe" },
  { id: "pwd", label: "PWD format" },
] as const;

export type TrackRecordExportFormatId =
  (typeof TRACK_RECORD_EXPORT_FORMATS)[number]["id"];

export type ContractorTrackRecordRow = {
  id: string;
  contractorName: string | null;
  tenderNo: string | null;
  quotationOrContractNo: string | null;
  title: string;
  contractorRating: string | null;
  startDate: string | null;
  completionDate: string | null;
  cpcDate: string | null;
  contractSum: number | null;
  lifecycleStage: LifecycleStage;
};

export function getTrackRecordViewTabLabel(tab: TrackRecordViewTabId) {
  return TRACK_RECORD_VIEW_TABS.find((t) => t.id === tab)?.label ?? tab;
}

export function getTrackRecordStatusLabel(stage: LifecycleStage) {
  return STAGE_STATUS_LABELS[stage];
}

export function collectContractorTrackRecordOptions(rows: ContractorTrackRecordRow[]) {
  const contractors = new Set<string>();
  for (const row of rows) {
    if (row.contractorName) contractors.add(row.contractorName);
  }
  return { contractors: [...contractors].sort() };
}

export function filterContractorTrackRecordRows(
  rows: ContractorTrackRecordRow[],
  contractor: string
) {
  if (!contractor) return [];
  return rows.filter((row) => row.contractorName === contractor);
}
