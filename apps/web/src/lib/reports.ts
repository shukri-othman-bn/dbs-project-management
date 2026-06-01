export const REPORT_VIEWS = [
  { id: "statistics", href: "/reports/statistics", label: "Statistics" },
  { id: "project-reports", href: "/reports/project-reports", label: "Project Reports" },
  { id: "expenditure", href: "/reports/expenditure", label: "Expenditure Report" },
  { id: "tender-status", href: "/reports/tender-status", label: "Tender Status Report" },
] as const;

export type ReportViewId = (typeof REPORT_VIEWS)[number]["id"];

export const DEFAULT_REPORT_VIEW: ReportViewId = "statistics";

export const REPORT_SUBTITLES: Record<ReportViewId, string> = {
  statistics: "Portfolio counts, budget totals, and stage breakdown",
  "project-reports": "Full project listing with status, client, and budget position",
  expenditure: "Financial year allocation, warrant, and certified payments by project",
  "tender-status": "Open and in-progress tenders with key dates and remarks",
};
