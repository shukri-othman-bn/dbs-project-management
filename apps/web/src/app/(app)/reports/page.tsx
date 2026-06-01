import { redirect } from "next/navigation";
import { DEFAULT_REPORT_VIEW } from "@/lib/reports";

export default function ReportsPage() {
  redirect(`/reports/${DEFAULT_REPORT_VIEW}`);
}
