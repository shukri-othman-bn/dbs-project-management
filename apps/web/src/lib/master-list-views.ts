export const MASTER_LIST_VIEWS = [
  { id: "status", href: "/master-list/status", label: "Status" },
  { id: "jo-valuation-bq", href: "/master-list/jo-valuation-bq", label: "Job Order/Payment Valuation" },
  { id: "payment-claims", href: "/master-list/payment-claims", label: "Payment/Claims" },
  { id: "vo-eot", href: "/master-list/vo-eot", label: "VO/EOT" },
  { id: "request", href: "/master-list/request", label: "Request" },
  { id: "tender-tracking", href: "/master-list/tender-tracking", label: "Tender Tracking" },
  { id: "correspondence", href: "/master-list/correspondence", label: "Correspondence" },
] as const;

export type MasterListViewId = (typeof MASTER_LIST_VIEWS)[number]["id"];

export type MasterListView = MasterListViewId;

export const DEFAULT_MASTER_LIST_VIEW: MasterListViewId = "status";

export const MASTER_LIST_SUBTITLES: Record<MasterListViewId, string> = {
  status: "By status — lifecycle and monitoring views",
  "jo-valuation-bq": "Job orders and payment valuations",
  "payment-claims": "Payments and claims tracking",
  "vo-eot": "Variation orders and extensions of time",
  request: "Requests and approvals",
  "tender-tracking": "Tender progress and key dates",
  correspondence: "Letters, notices, and project correspondence",
};
