import { cn } from "@/lib/utils";
import { RagStatus } from "@/lib/budget";
import { STAGE_STATUS_LABELS } from "@/lib/project-labels";
import { LifecycleStage } from "@prisma/client";

const ragStyles: Record<RagStatus, string> = {
  green: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
};

export function RagBadge({ status }: { status: RagStatus }) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium uppercase", ragStyles[status])}>
      {status}
    </span>
  );
}

export function StageBadge({ stage }: { stage: string }) {
  const styles: Record<string, string> = {
    pre_design: "bg-slate-100 text-slate-700",
    design: "bg-violet-100 text-violet-800",
    quotation_tender: "bg-blue-100 text-blue-800",
    ongoing: "bg-emerald-100 text-emerald-800",
    completed: "bg-gray-100 text-gray-600",
    keep_in_view: "bg-amber-100 text-amber-800",
  };
  const label =
    STAGE_STATUS_LABELS[stage as LifecycleStage] ?? stage.replace("_", " ");
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", styles[stage] ?? styles.pre_design)}>
      {label}
    </span>
  );
}
