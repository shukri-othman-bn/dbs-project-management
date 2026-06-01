import { prisma } from "./prisma";
import { computeBudgetTotals } from "./budget";
import { projectFilterForUser, SessionUser } from "./permissions";

export async function getCurrentFinancialYear() {
  return prisma.financialYear.findFirst({
    where: { isCurrent: true },
    orderBy: { startDate: "desc" },
  });
}

export async function getProjectsWithBudget(user: SessionUser) {
  const filter = projectFilterForUser(user);
  const fy = await getCurrentFinancialYear();

  const projects = await prisma.project.findMany({
    where: filter.id === "none" ? { id: "impossible" } : filter,
    include: {
      section: true,
      client: true,
      fundingType: true,
      oic: true,
      design: true,
      tendering: true,
      contract: true,
      budgets: fy ? { where: { financialYearId: fy.id } } : true,
      budgetLines: fy ? { where: { financialYearId: fy.id } } : true,
      statusUpdates: { orderBy: { progressAsOf: "desc" }, take: 1 },
      completion: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return projects.map((p) => {
    const budget = p.budgets[0];
    const allocation = budget?.allocation ?? 0;
    const totals = computeBudgetTotals({
      allocation,
      encumbranceTotal: budget?.encumbranceTotal ?? 0,
      encumbranceBalance: budget?.encumbranceBalance ?? 0,
      budgetLines: p.budgetLines,
      fyStart: fy?.startDate,
      fyEnd: fy?.endDate,
    });
    const latest = p.statusUpdates[0];
    return { ...p, budget, totals, latestStatus: latest };
  });
}

export async function getDepartmentBudgetSummary(user: SessionUser) {
  const projects = await getProjectsWithBudget(user);
  const bySection: Record<string, typeof projects> = {};
  for (const p of projects) {
    const key = p.section?.name ?? "Unassigned";
    if (!bySection[key]) bySection[key] = [];
    bySection[key].push(p);
  }

  const totals = projects.reduce(
    (acc, p) => ({
      allocation: acc.allocation + p.totals.allocation,
      spent: acc.spent + p.totals.paymentsCertified,
      warrant: acc.warrant + p.totals.warrantApproved,
    }),
    { allocation: 0, spent: 0, warrant: 0 }
  );

  return { projects, bySection, totals };
}

export async function getProjectById(id: string) {
  const fy = await getCurrentFinancialYear();
  return prisma.project.findUnique({
    where: { id },
    include: {
      section: true,
      client: true,
      fundingType: true,
      oic: true,
      design: true,
      tendering: true,
      contract: true,
      completion: true,
      documents: true,
      budgets: fy
        ? { where: { financialYearId: fy.id }, include: { financialYear: true } }
        : { include: { financialYear: true } },
      budgetLines: { orderBy: { date: "desc" } },
      statusUpdates: { orderBy: { progressAsOf: "desc" }, take: 30 },
    },
  });
}

export async function ensureProjectRelations(projectId: string) {
  await Promise.all([
    prisma.projectDesign.upsert({
      where: { projectId },
      update: {},
      create: { projectId },
    }),
    prisma.projectTendering.upsert({
      where: { projectId },
      update: {},
      create: { projectId },
    }),
    prisma.contractDetails.upsert({
      where: { projectId },
      update: {},
      create: { projectId },
    }),
    prisma.projectCompletion.upsert({
      where: { projectId },
      update: {},
      create: { projectId },
    }),
    prisma.projectDocuments.upsert({
      where: { projectId },
      update: {},
      create: { projectId },
    }),
  ]);
}
