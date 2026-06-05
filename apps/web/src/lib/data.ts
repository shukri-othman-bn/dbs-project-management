import { prisma } from "./prisma";
import { computeBudgetTotals } from "./budget";
import { projectFilterForUser, SessionUser, canViewAllProjects } from "./permissions";
import { getUnitLabel, UNIT_CODES } from "./units";

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
      variationOrders: { orderBy: { submittedDate: "desc" } },
      extensionOfTimes: { orderBy: { submittedDate: "desc" } },
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

export type UnitBudgetRow = {
  unit: string;
  code: string;
  leadOfficer: string | null;
  allocation: number;
  spent: number;
  warrant: number;
  utilizationPct: number;
};

type ProjectWithBudget = Awaited<ReturnType<typeof getProjectsWithBudget>>[number];

function aggregateProjectsBySectionId(projects: ProjectWithBudget[]) {
  const bySectionId: Record<string, ProjectWithBudget[]> = {};
  for (const project of projects) {
    if (!project.sectionId) continue;
    if (!bySectionId[project.sectionId]) bySectionId[project.sectionId] = [];
    bySectionId[project.sectionId].push(project);
  }
  return bySectionId;
}

export async function getUnitBudgetBreakdown(
  user: SessionUser,
  projects: ProjectWithBudget[]
): Promise<UnitBudgetRow[]> {
  const fy = await getCurrentFinancialYear();
  const sectionFilter = canViewAllProjects(user)
    ? { code: { in: [...UNIT_CODES] } }
    : user.sectionId
      ? { id: user.sectionId }
      : { id: "impossible" };

  const sections = await prisma.section.findMany({
    where: sectionFilter,
    include: {
      users: {
        where: { role: "OFFICER" },
        orderBy: { name: "asc" },
        take: 1,
      },
      budgets: fy ? { where: { financialYearId: fy.id }, take: 1 } : { take: 1 },
    },
  });

  const projectsBySectionId = aggregateProjectsBySectionId(projects);
  const rows = sections.map((section) => {
    const code = getUnitLabel(section) ?? section.name;
    const sectionProjects = projectsBySectionId[section.id] ?? [];
    const spent = sectionProjects.reduce((sum, p) => sum + p.totals.paymentsCertified, 0);
    const warrant = sectionProjects.reduce((sum, p) => sum + p.totals.warrantApproved, 0);
    const projectAllocation = sectionProjects.reduce((sum, p) => sum + p.totals.allocation, 0);
    const allocation = section.budgets[0]?.allocation ?? projectAllocation;
    const utilizationPct = allocation > 0 ? (spent / allocation) * 100 : 0;

    return {
      unit: code,
      code,
      leadOfficer: section.users[0]?.name ?? null,
      allocation,
      spent,
      warrant,
      utilizationPct,
    };
  });

  const order = new Map<string, number>(UNIT_CODES.map((code, index) => [code, index]));
  return rows.sort((a, b) => (order.get(a.code) ?? 999) - (order.get(b.code) ?? 999));
}

export async function getDepartmentBudgetSummary(user: SessionUser) {
  const projects = await getProjectsWithBudget(user);
  const byUnit = await getUnitBudgetBreakdown(user, projects);

  const bySection: Record<string, typeof projects> = {};
  for (const p of projects) {
    const key = getUnitLabel(p.section) ?? "Unassigned";
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

  return { projects, bySection, byUnit, totals };
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
