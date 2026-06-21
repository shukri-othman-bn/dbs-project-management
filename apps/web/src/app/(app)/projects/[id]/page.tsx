import { auth } from "@/lib/auth";
import { getProjectById, getCurrentFinancialYear, ensureProjectRelations, getProjectFyAllocation, getUnitBudgetMetrics } from "@/lib/data";
import { canEditProject } from "@/lib/permissions";
import { computeBudgetTotals } from "@/lib/budget";
import {
  PROJECT_TAB_IDS,
  DEFAULT_PROJECT_TAB,
  type ProjectTabId,
} from "@/lib/project-labels";
import { getUnitLabel } from "@/lib/units";
import { getProjectOicDisplayName } from "@/lib/project-people";
import { getFsorAppBaseUrl } from "@/lib/fsor-sync";
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
    : tabParam === "status"
      ? "physical-progress"
      : DEFAULT_PROJECT_TAB;
  const resolvedTab =
    activeTab === "fsor" && project.contractCategory !== "fsor"
      ? DEFAULT_PROJECT_TAB
      : activeTab;

  const fy = await getCurrentFinancialYear();
  const budget = project.budgets[0];
  const allocation = await getProjectFyAllocation(id);
  const unitBudget = await getUnitBudgetMetrics(project.sectionId, project.fundingType);
  const totals = computeBudgetTotals({
    allocation,
    encumbranceTotal: budget?.encumbranceTotal ?? 0,
    budgetLines: project.budgetLines.filter(
      (l) => !fy || l.financialYearId === fy.id || !l.financialYearId
    ),
    fyStart: fy?.startDate,
    fyEnd: fy?.endDate,
  });

  const unit = getUnitLabel(project.section);
  const oicName = getProjectOicDisplayName(project);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          <Link href="/master-list/status" className="hover:text-slate-800 hover:underline">
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
        projectId={id}
        canEdit={canEdit}
        projectNumber={project.projectNumber}
        unit={unit}
        quotationOrContractNo={project.quotationOrContractNo ?? project.projectNumber}
        lifecycleStage={project.lifecycleStage}
        projectType={project.projectType}
        contractCategory={project.contractCategory}
        title={project.title}
        contractorName={project.contractorName ?? project.contract?.mainContractor}
        oicName={oicName}
        fundingTypeName={project.fundingType?.name}
        svAmount={project.design?.svAmount}
        ministry={project.client?.ministry}
        department={project.client?.department}
        fyLabel={fy?.label}
        fyAllocation={allocation}
        totalSpent={totals.paymentsCertified}
        contractStartDate={
          project.contract?.contractStart ?? project.tendering?.startDateInLoa ?? null
        }
        contractFinishDate={
          project.contract?.contractFinish ??
          project.tendering?.completeDateInLoa ??
          project.completion?.completionDate ??
          null
        }
        contractPeriod={
          project.contract?.contractPeriod ?? project.tendering?.completionPeriod ?? null
        }
        contractAmount={
          project.contract?.contractSum ?? project.design?.preliminaryEstimate ?? null
        }
      />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <Suspense fallback={<div className="h-64 rounded-xl border border-slate-200 bg-white" />}>
          <ProjectDetailNav
            projectId={id}
            activeTab={resolvedTab}
            contractCategory={project.contractCategory}
          />
        </Suspense>

        <div className="min-w-0">
          <ProjectTabsContent
            project={project}
            tab={resolvedTab}
            canEdit={canEdit}
            totals={totals}
            unitBudget={unitBudget}
            financialYearId={fy?.id}
            fsorAppUrl={getFsorAppBaseUrl()}
          />
        </div>
      </div>
    </div>
  );
}
