import { getUnitLabel } from "./units";

export type UpcomingDateType = "open_tender" | "close_tender" | "completion";

export const UPCOMING_DATE_LABELS: Record<UpcomingDateType, string> = {
  open_tender: "Open tender",
  close_tender: "Close tender",
  completion: "Completion date",
};

export type UpcomingDateRow = {
  projectId: string;
  projectNumber: string;
  title: string;
  unit: string | null;
  type: UpcomingDateType;
  label: string;
  date: Date;
};

type ProjectWithDates = {
  id: string;
  projectNumber: string;
  title: string;
  section?: { code?: string | null; unitLabel?: string | null; name: string } | null;
  tendering?: {
    openDate?: Date | null;
    closingDate?: Date | null;
    extendedClosingDate?: Date | null;
  } | null;
  completion?: { completionDate?: Date | null } | null;
};

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0, 23, 59, 59, 999);
}

export function getUpcomingDatesWindow(referenceDate = new Date()) {
  const today = startOfDay(referenceDate);
  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const rangeEnd = endOfMonth(referenceDate.getFullYear(), referenceDate.getMonth() + 1);

  return {
    filterStart: today > monthStart ? today : monthStart,
    rangeEnd,
  };
}

function isWithinWindow(date: Date, filterStart: Date, rangeEnd: Date) {
  const d = startOfDay(date);
  return d >= filterStart && d <= rangeEnd;
}

export function collectUpcomingDates(
  projects: ProjectWithDates[],
  referenceDate = new Date()
): UpcomingDateRow[] {
  const { filterStart, rangeEnd } = getUpcomingDatesWindow(referenceDate);
  const rows: UpcomingDateRow[] = [];

  for (const project of projects) {
    const unit = getUnitLabel(project.section);
    const milestones: { type: UpcomingDateType; date: Date | null | undefined }[] = [
      { type: "open_tender", date: project.tendering?.openDate },
      {
        type: "close_tender",
        date: project.tendering?.extendedClosingDate ?? project.tendering?.closingDate,
      },
      { type: "completion", date: project.completion?.completionDate },
    ];

    for (const milestone of milestones) {
      if (!milestone.date || !isWithinWindow(milestone.date, filterStart, rangeEnd)) continue;
      rows.push({
        projectId: project.id,
        projectNumber: project.projectNumber,
        title: project.title,
        unit,
        type: milestone.type,
        label: UPCOMING_DATE_LABELS[milestone.type],
        date: milestone.date,
      });
    }
  }

  return rows.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function formatUpcomingDatesPeriod(referenceDate = new Date()) {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const end = endOfMonth(referenceDate.getFullYear(), referenceDate.getMonth() + 1);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}
