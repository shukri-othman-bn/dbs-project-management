import { auth } from "@/lib/auth";
import { getProjectById, getCurrentFinancialYear, ensureProjectRelations } from "@/lib/data";
import { canEditProject } from "@/lib/permissions";
import { computeBudgetTotals } from "@/lib/budget";
import {
  PROJECT_TAB_IDS,
  DEFAULT_PROJECT_TAB,
  type ProjectTabId,
} from "@/lib/project-labels";
import { getUnitLabel } from "@/lib/units";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { RagBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectDetailHeader } from "@/components/projects/project-detail-header";
import { ProjectDetailNav } from "@/components/projects/project-detail-nav";
import { ProjectTabsContent } from "@/components/projects/project-tabs-content";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const session = await auth();
  const user = session!.user;

  await ensureProjectRelations(id);
  const project = await getProjectById(id);
  if (!project) notFound();

  const canEdit = canEditProject(user, project);
  const activeTab: ProjectTabId = PROJECT_TAB_IDS.has(tabParam as ProjectTabId)
    ? (tabParam as ProjectTabId)
    : DEFAULT_PROJECT_TAB;

  const fy = await getCurrentFinancialYear();
  const budget = project.budgets[0];
  const allocation = budget?.allocation ?? 0;
  const totals = computeBudgetTotals({
    allocation,
    encumbranceTotal: budget?.encumbranceTotal ?? 0,
    encumbranceBalance: budget?.encumbranceBalance ?? 0,
    budgetLines: project.budgetLines.filter(
      (l) => !fy || l.financialYearId === fy.id || !l.financialYearId
    ),
    fyStart: fy?.startDate,
    fyEnd: fy?.endDate,
  });

  const unit = getUnitLabel(project.section);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          <Link href="/master-list/by-status" className="hover:text-slate-800 hover:underline">
            Master list
          </Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-slate-700">{project.projectNumber}</span>
        </p>
        <div className="flex items-center gap-2">
          <RagBadge status={totals.rag} />
          {canEdit && (
            <Link href={`/projects/${id}/edit`}>
              <Button variant="secondary" size="sm">
                Edit project
              </Button>
            </Link>
          )}
        </div>
      </div>

      <ProjectDetailHeader
        projectNumber={project.projectNumber}
        unit={unit}
        quotationOrContractNo={project.quotationOrContractNo ?? project.projectNumber}
        lifecycleStage={project.lifecycleStage}
        projectType={project.projectType}
        title={project.title}
        contractorName={project.contractorName ?? project.contract?.mainContractor}
        oicName={project.oic?.name}
        supervisingOfficer={project.supervisingOfficer}
        architectName={project.architectName}
        ministry={project.client?.ministry}
        department={project.client?.department}
        clientsNotes={project.clientsNotes}
      />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <Suspense fallback={<div className="h-64 rounded-xl border border-slate-200 bg-white" />}>
          <ProjectDetailNav projectId={id} activeTab={activeTab} />
        </Suspense>

        <div className="min-w-0">
          <ProjectTabsContent
            project={project}
            tab={activeTab}
            canEdit={canEdit}
            totals={totals}
            allocation={allocation}
            encumbranceTotal={budget?.encumbranceTotal ?? 0}
            encumbranceBalance={budget?.encumbranceBalance ?? 0}
            financialYearId={fy?.id}
          />
        </div>
      </div>
    </div>
  );
}
