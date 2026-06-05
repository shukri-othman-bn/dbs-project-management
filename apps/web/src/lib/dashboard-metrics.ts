import { LifecycleStage } from "@prisma/client";
import { RagStatus } from "./budget";

export const ACTIVE_LIFECYCLE_STAGES = [
  "pre_contract",
  "contract",
  "ongoing",
] as const satisfies readonly LifecycleStage[];

export const DASHBOARD_METRIC_DEFINITIONS = {
  activeProjects: "Pre-Contract, Contract & Ongoing",
  needsAttention: "FY spend behind pace (amber or red)",
} as const;

type ProjectWithTotals = {
  lifecycleStage: LifecycleStage;
  totals: { rag: RagStatus };
};

const RAG_ATTENTION_ORDER: Record<RagStatus, number> = {
  red: 0,
  amber: 1,
  green: 2,
};

export function isActiveProject(p: { lifecycleStage: LifecycleStage }): boolean {
  return (ACTIVE_LIFECYCLE_STAGES as readonly LifecycleStage[]).includes(p.lifecycleStage);
}

export function projectNeedsAttention(p: { totals: { rag: RagStatus } }): boolean {
  return p.totals.rag === "red" || p.totals.rag === "amber";
}

export function computeDashboardMetrics<T extends ProjectWithTotals>(projects: T[]) {
  const activeProjects = projects.filter(isActiveProject);
  const needsAttentionProjects = projects
    .filter(projectNeedsAttention)
    .sort((a, b) => RAG_ATTENTION_ORDER[a.totals.rag] - RAG_ATTENTION_ORDER[b.totals.rag]);

  return {
    activeCount: activeProjects.length,
    needsAttentionCount: needsAttentionProjects.length,
    needsAttentionProjects,
  };
}
