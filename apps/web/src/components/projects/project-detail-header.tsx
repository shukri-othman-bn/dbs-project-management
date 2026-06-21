import { ContractCategory, LifecycleStage, ProjectType } from "@prisma/client";
import { CONTRACT_CATEGORY_LABELS, PROJECT_TYPE_LABELS } from "@/lib/project-labels";
import { StageBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { HeaderSvAmountField } from "./header-sv-amount-field";
import { formatCurrency, formatDate } from "@/lib/utils";

function MetaItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-900">{value || "—"}</p>
    </div>
  );
}

export function ProjectDetailHeader({
  projectId,
  canEdit = false,
  projectNumber,
  unit,
  quotationOrContractNo,
  lifecycleStage,
  projectType,
  contractCategory,
  title,
  contractorName,
  oicName,
  fundingTypeName,
  svAmount,
  ministry,
  department,
  fyLabel,
  fyAllocation,
  totalSpent,
  contractStartDate,
  contractFinishDate,
  contractPeriod,
  contractAmount,
}: {
  projectId: string;
  canEdit?: boolean;
  projectNumber: string;
  unit?: string | null;
  quotationOrContractNo?: string | null;
  lifecycleStage: LifecycleStage;
  projectType?: ProjectType | null;
  contractCategory?: ContractCategory | null;
  title: string;
  contractorName?: string | null;
  oicName?: string | null;
  fundingTypeName?: string | null;
  svAmount?: number | null;
  ministry?: string | null;
  department?: string | null;
  fyLabel?: string | null;
  fyAllocation?: number | null;
  totalSpent?: number | null;
  contractStartDate?: Date | null;
  contractFinishDate?: Date | null;
  contractPeriod?: string | null;
  contractAmount?: number | null;
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
              {contractCategory && (
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  {CONTRACT_CATEGORY_LABELS[contractCategory]}
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

        <div className="grid gap-6 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <MetaItem label="Officer in charge" value={oicName} />
            <MetaItem label="Contractor" value={contractorName} />
            <MetaItem label="Contract start date" value={formatDate(contractStartDate)} />
          </div>
          <div className="space-y-4">
            <MetaItem label="Client ministry" value={ministry} />
            <MetaItem label="Client department" value={department} />
            <MetaItem label="Contract finish date" value={formatDate(contractFinishDate)} />
          </div>
          <div className="space-y-4">
            <MetaItem label="Funding type" value={fundingTypeName} />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">SV amount</p>
              <HeaderSvAmountField projectId={projectId} value={svAmount} canEdit={canEdit} />
            </div>
            <MetaItem label="Contract period" value={contractPeriod} />
          </div>
          <div className="space-y-4">
            <MetaItem
              label={fyLabel ? `FY ${fyLabel} allocation` : "FY allocation"}
              value={fyAllocation != null ? formatCurrency(fyAllocation) : null}
            />
            <MetaItem
              label="Total spent"
              value={totalSpent != null ? formatCurrency(totalSpent) : null}
            />
            <MetaItem
              label="Contract amount"
              value={contractAmount != null ? formatCurrency(contractAmount) : null}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
