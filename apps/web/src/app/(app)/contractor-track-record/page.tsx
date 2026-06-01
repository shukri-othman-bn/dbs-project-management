import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getProjectsWithBudget } from "@/lib/data";
import { toContractorTrackRecordRow } from "@/lib/master-list-mappers";
import { ContractorTrackRecordList } from "@/components/contractor-track-record/contractor-track-record-list";

export default async function ContractorTrackRecordPage() {
  const session = await auth();
  const user = session!.user;
  const raw = await getProjectsWithBudget(user);
  const rows = raw.map(toContractorTrackRecordRow);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Contractor Track Record</h1>
        <p className="text-slate-600">
          Project history by contractor — filter, review, and export track record reports
        </p>
      </div>

      <Suspense
        fallback={<div className="h-96 rounded-xl border border-slate-200 bg-white animate-pulse" />}
      >
        <ContractorTrackRecordList rows={rows} />
      </Suspense>
    </div>
  );
}
