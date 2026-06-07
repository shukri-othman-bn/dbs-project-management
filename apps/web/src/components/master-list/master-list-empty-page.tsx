import { MasterListHeader, MasterListViewPills } from "@/components/master-list/master-list-header";
import type { MasterListViewId } from "@/lib/master-list-views";

export function MasterListEmptyPage({ view }: { view: MasterListViewId }) {
  return (
    <div className="space-y-6">
      <MasterListHeader view={view} />
      <MasterListViewPills active={view} />
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
        <p className="text-sm text-slate-500">Content coming soon.</p>
      </div>
    </div>
  );
}
