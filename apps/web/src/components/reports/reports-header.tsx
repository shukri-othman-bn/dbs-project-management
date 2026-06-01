import { cn } from "@/lib/utils";
import { REPORT_SUBTITLES, REPORT_VIEWS, type ReportViewId } from "@/lib/reports";

export function ReportsHeader({ view }: { view: ReportViewId }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
      <p className="text-slate-600">{REPORT_SUBTITLES[view]}</p>
    </div>
  );
}

export function ReportsViewPills({ active }: { active: ReportViewId }) {
  return (
    <div className="flex flex-wrap gap-2">
      {REPORT_VIEWS.map((item) => (
        <a
          key={item.id}
          href={item.href}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            active === item.id
              ? "bg-slate-800 text-white"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          )}
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}
