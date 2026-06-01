import { LifecycleStage, ProjectType } from "@prisma/client";
import { PROJECT_TYPE_LABELS } from "@/lib/project-labels";
import { StageBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

function MetaItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-900">{value || "—"}</p>
    </div>
  );
}

export function ProjectDetailHeader({
  projectNumber,
  unit,
  quotationOrContractNo,
  lifecycleStage,
  projectType,
  title,
  contractorName,
  oicName,
  supervisingOfficer,
  architectName,
  ministry,
  department,
  clientsNotes,
}: {
  projectNumber: string;
  unit?: string | null;
  quotationOrContractNo?: string | null;
  lifecycleStage: LifecycleStage;
  projectType?: ProjectType | null;
  title: string;
  contractorName?: string | null;
  oicName?: string | null;
  supervisingOfficer?: string | null;
  architectName?: string | null;
  ministry?: string | null;
  department?: string | null;
  clientsNotes?: string | null;
}) {
  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold text-slate-700">
                {quotationOrContractNo ?? projectNumber}
              </span>
              <StageBadge stage={lifecycleStage} />
              {projectType && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {PROJECT_TYPE_LABELS[projectType]}
                </span>
              )}
              {unit && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {unit}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold leading-snug text-slate-900">{title}</h1>
          </div>
        </div>

        <div className="grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetaItem label="Contractor" value={contractorName} />
          <MetaItem label="Officer in charge" value={oicName} />
          <MetaItem label="Supervising officer" value={supervisingOfficer} />
          <MetaItem label="Architect" value={architectName} />
          <MetaItem label="Ministry" value={ministry} />
          <MetaItem label="Department" value={department} />
          <MetaItem label="Clients" value={clientsNotes} />
        </div>
      </CardContent>
    </Card>
  );
}
