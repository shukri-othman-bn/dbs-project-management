import { cn } from "@/lib/utils";
import {
  MASTER_LIST_SUBTITLES,
  MASTER_LIST_VIEWS,
  type MasterListView,
} from "@/lib/master-list-views";

export function MasterListHeader({
  view,
  action,
}: {
  view: MasterListView;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Master list</h1>
        <p className="text-slate-600">{MASTER_LIST_SUBTITLES[view]}</p>
      </div>
      {action}
    </div>
  );
}

export function MasterListViewPills({ active }: { active: MasterListView }) {
  return (
    <div className="flex flex-wrap gap-2">
      {MASTER_LIST_VIEWS.map((item) => (
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
