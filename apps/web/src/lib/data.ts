import { prisma } from "./prisma";
import { computeBudgetTotals, sumPayments } from "./budget";
import { DEPARTMENT_FUNDING_TYPE_NAMES, EQUAL_SPLIT_UNIT_FUNDING_TYPE_CODES, fundingTypeCode, fundingTypeLabel } from "./funding-types";
import { sumPoEncumbrance, sumPoPaid } from "./purchase-order-sync";
import { projectFilterForUser, matterRequestFilterForUser, SessionUser, canViewAllProjects } from "./permissions";
import { getUnitLabel, UNIT_CODES } from "./units";
import { truncateToDecimals } from "./utils";

const projectAllocationInclude = {
  section: true,
  client: true,
  fundingType: true,
  oic: true,
  design: true,
  bca: true,
  feasibility: true,
  tendering: true,
  contract: true,
  budgets: true,
  budgetLines: true,
  statusUpdates: { orderBy: { progressAsOf: "desc" as const }, take: 1 },
  completion: true,
  variationOrders: { orderBy: { createdAt: "asc" as const } },
  extensionOfTimes: { orderBy: { createdAt: "asc" as const } },
  jobOrders: { orderBy: { joStart: "desc" as const } },
  purchaseOrders: { orderBy: { claimDate: "desc" as const } },
};

type ProjectRollupSource = Awaited<
  ReturnType<typeof loadProjectsForAllocationRollup>
>[number];

async function loadProjectsForAllocationRollup(
  fyId: string | undefined,
  allBudgetLines = false
) {
  return prisma.project.findMany({
    where: { sectionId: { not: null } },
    include: {
      ...projectAllocationInclude,
      budgets: fyId ? { where: { financialYearId: fyId } } : true,
      budgetLines: allBudgetLines
        ? { orderBy: { date: "desc" } }
        : fyId
          ? { where: { financialYearId: fyId } }
          : true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

function projectFyBudgetLines(
  project: ProjectRollupSource,
  fy: Awaited<ReturnType<typeof getCurrentFinancialYear>>,
  allBudgetLines: boolean
) {
  if (allBudgetLines && fy) {
    return project.budgetLines.filter((line) => line.financialYearId === fy.id);
  }
  return project.budgetLines;
}

function projectCertifiedSpend(
  project: ProjectRollupSource,
  fy: Awaited<ReturnType<typeof getCurrentFinancialYear>>,
  allBudgetLines: boolean
) {
  return sumPayments(projectFyBudgetLines(project, fy, allBudgetLines)).certified;
}

/** Weight for splitting funding-type budget across units and projects (independent of stored allocation). */
function projectSplitWeight(
  project: ProjectRollupSource,
  fy: Awaited<ReturnType<typeof getCurrentFinancialYear>>,
  allBudgetLines: boolean
) {
  const contractAmount =
    project.contract?.contractSum ??
    project.design?.preliminaryEstimate ??
    project.design?.svAmount ??
    0;
  if (contractAmount > 0) return contractAmount;

  const certified = projectCertifiedSpend(project, fy, allBudgetLines);
  if (certified > 0) return certified;

  return 1;
}

async function computeDepartmentAllocations(options?: { allBudgetLines?: boolean }) {
  const fy = await getCurrentFinancialYear();
  const allBudgetLines = options?.allBudgetLines ?? false;
  const rawProjects = await loadProjectsForAllocationRollup(fy?.id, allBudgetLines);
  const projectsBySectionId = aggregateProjectsBySectionId(rawProjects);

  const sections = await prisma.section.findMany({
    where: { code: { in: [...UNIT_CODES] } },
    select: { id: true },
  });
  const allSectionIds = sections.map((section) => section.id);

  const departmentByFundingType = await buildFundingTypeBudgetBreakdown(
    rawProjects,
    fy?.id,
    allBudgetLines
  );
  const allocationBySection = buildFundingTypeAllocationBySection(
    allSectionIds,
    projectsBySectionId,
    departmentByFundingType,
    fy,
    allBudgetLines
  );
  const allocationByProject = buildProjectAllocationById(
    projectsBySectionId,
    allocationBySection,
    fy,
    allBudgetLines
  );

  return {
    fy,
    allBudgetLines,
    allocationByProject,
    allocationBySection,
    departmentByFundingType,
  };
}

export async function getProjectFyAllocation(projectId: string): Promise<number> {
  const { allocationByProject } = await computeDepartmentAllocations();
  return allocationByProject.get(projectId) ?? 0;
}

export type UnitBudgetMetrics = {
  budgetByUnit: number;
  encumbranceByUnit: number;
  encumbranceBalanceByUnit: number;
};

export async function getUnitBudgetMetrics(
  sectionId: string | null | undefined,
  fundingType: { name: string; mainCategory: string | null } | null | undefined
): Promise<UnitBudgetMetrics | null> {
  if (!sectionId || !fundingType) return null;

  const code = fundingType.mainCategory ?? fundingTypeCode(fundingType.name);
  if (!DEPARTMENT_FUNDING_TYPE_NAMES.some((name) => fundingTypeCode(name) === code)) {
    return null;
  }

  const { allocationBySection, fy } = await computeDepartmentAllocations();
  const rawProjects = await loadProjectsForAllocationRollup(fy?.id, false);
  const sectionProjects = rawProjects.filter(
    (project) => project.sectionId === sectionId && projectFundingTypeCode(project) === code
  );
  const sectionAllocations = allocationBySection.get(sectionId);

  const budgetByUnit = sectionAllocations?.get(code) ?? 0;

  const encumbranceByUnit = truncateToDecimals(
    sectionProjects.reduce(
      (sum, project) => sum + sumPoEncumbrance(project.purchaseOrders),
      0
    ),
    2
  );

  const poPaidByUnit = truncateToDecimals(
    sectionProjects.reduce((sum, project) => sum + sumPoPaid(project.purchaseOrders), 0),
    2
  );

  return {
    budgetByUnit: truncateToDecimals(budgetByUnit, 2),
    encumbranceByUnit,
    encumbranceBalanceByUnit: truncateToDecimals(encumbranceByUnit - poPaidByUnit, 2),
  };
}

export async function getCurrentFinancialYear() {
  return prisma.financialYear.findFirst({
    where: { isCurrent: true },
    orderBy: { startDate: "desc" },
  });
}

export async function getProjectsWithBudget(
  user: SessionUser,
  options?: { allBudgetLines?: boolean }
) {
  const filter = projectFilterForUser(user);
  const allBudgetLines = options?.allBudgetLines ?? false;
  const { fy, allocationByProject } = await computeDepartmentAllocations({ allBudgetLines });

  const projects = await prisma.project.findMany({
    where: filter.id === "none" ? { id: "impossible" } : filter,
    include: {
      ...projectAllocationInclude,
      budgets: fy ? { where: { financialYearId: fy.id } } : true,
      budgetLines: allBudgetLines
        ? { orderBy: { date: "desc" } }
        : fy
          ? { where: { financialYearId: fy.id } }
          : true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return projects.map((p) => {
    const budget = p.budgets[0];
    const allocation = allocationByProject.get(p.id) ?? 0;
    const fyBudgetLines = projectFyBudgetLines(p, fy, allBudgetLines);
    const totals = computeBudgetTotals({
      allocation,
      encumbranceTotal: budget?.encumbranceTotal ?? 0,
      budgetLines: fyBudgetLines,
      fyStart: fy?.startDate,
      fyEnd: fy?.endDate,
    });
    const latest = p.statusUpdates[0];
    return { ...p, budget, totals, latestStatus: latest };
  });
}

export async function getMatterRequests(user: SessionUser) {
  const filter = matterRequestFilterForUser(user);

  return prisma.matterRequest.findMany({
    where: filter.id === "none" ? { id: "impossible" } : filter,
    include: { section: true },
    orderBy: { complaintReceived: "desc" },
  });
}

type ProjectWithBudget = Awaited<ReturnType<typeof getProjectsWithBudget>>[number];

export type FundingTypeBudgetRow = {
  code: string;
  name: string;
  amountApproved: number;
  encumbranceAmount: number;
  encumbranceBalance: number;
  balanceAllocation: number;
  spent: number;
  budgetSummaryLocked: boolean;
};

export type DepartmentBudgetTotals = {
  allocation: number;
  spent: number;
  warrant: number;
  encumbranceTotal: number;
  encumbranceBalance: number;
  balanceAllocation: number;
};


export async function buildFundingTypeBudgetBreakdown(
  projects: ProjectRollupSource[],
  fyId: string | undefined,
  allBudgetLines = false
): Promise<FundingTypeBudgetRow[]> {
  const fy = fyId
    ? await prisma.financialYear.findUnique({ where: { id: fyId } })
    : await getCurrentFinancialYear();

  const fundingTypes = await prisma.fundingType.findMany({
    where: { name: { in: [...DEPARTMENT_FUNDING_TYPE_NAMES] } },
    include: {
      budgets: fyId ? { where: { financialYearId: fyId }, take: 1 } : false,
    },
  });

  const budgetByTypeId = new Map(
    fundingTypes.map((ft) => [ft.id, ft.budgets?.[0] ?? null])
  );
  const typeByCode = new Map(
    fundingTypes.map((ft) => [ft.mainCategory ?? fundingTypeCode(ft.name), ft])
  );

  const byCode = new Map<string, FundingTypeBudgetRow>();
  for (const fullName of DEPARTMENT_FUNDING_TYPE_NAMES) {
    const code = fundingTypeCode(fullName);
    const ft = typeByCode.get(code) ?? fundingTypes.find((t) => t.name === fullName);
    const budget = ft ? budgetByTypeId.get(ft.id) : null;
    byCode.set(code, {
      code,
      name: fullName,
      amountApproved: budget?.allocation ?? 0,
      encumbranceAmount: 0,
      encumbranceBalance: 0,
      balanceAllocation: 0,
      spent: 0,
      budgetSummaryLocked: budget?.budgetSummaryLocked ?? false,
    });
  }

  for (const project of projects) {
    const ft = project.fundingType;
    if (!ft) continue;

    const code = ft.mainCategory ?? fundingTypeCode(ft.name);
    if (!byCode.has(code)) continue;

    const row = byCode.get(code)!;
    row.spent += projectCertifiedSpend(project, fy, allBudgetLines);
    row.encumbranceAmount += sumPoEncumbrance(project.purchaseOrders);
  }

  for (const row of byCode.values()) {
    row.encumbranceBalance = truncateToDecimals(row.encumbranceAmount - row.spent, 2);
    row.balanceAllocation = truncateToDecimals(row.amountApproved - row.encumbranceAmount, 2);
  }

  return DEPARTMENT_FUNDING_TYPE_NAMES.map((fullName) =>
    byCode.get(fundingTypeCode(fullName))!
  );
}

export async function getFundingTypeBudgetBreakdown(
  user: SessionUser
): Promise<FundingTypeBudgetRow[]> {
  const fy = await getCurrentFinancialYear();
  const projects = await getProjectsWithBudget(user);
  return buildFundingTypeBudgetBreakdown(projects, fy?.id);
}

export type UnitFundingTypeSlice = {
  code: string;
  title: string;
  allocation: number;
  spent: number;
  utilizationPct: number;
};

export type UnitBudgetRow = {
  unit: string;
  code: string;
  leadOfficer: string | null;
  allocation: number;
  encumbrance: number;
  balanceAllocation: number;
  spent: number;
  warrant: number;
  utilizationPct: number;
  byFundingType: UnitFundingTypeSlice[];
};

function projectFundingTypeCode(project: Pick<ProjectRollupSource, "fundingType">): string | null {
  const ft = project.fundingType;
  if (!ft) return null;

  const code = ft.mainCategory ?? fundingTypeCode(ft.name);
  if (!DEPARTMENT_FUNDING_TYPE_NAMES.some((name) => fundingTypeCode(name) === code)) {
    return null;
  }
  return code;
}

/** Split approved amount across recipients; last recipient absorbs rounding remainder. */
function distributeApprovedAmount(
  totalApproved: number,
  recipientIds: string[],
  weightsById: Map<string, number>
): Map<string, number> {
  const result = new Map<string, number>();
  for (const id of recipientIds) {
    result.set(id, 0);
  }

  if (totalApproved <= 0 || recipientIds.length === 0) {
    return result;
  }

  const weighted = recipientIds
    .map((id) => ({ id, weight: weightsById.get(id) ?? 0 }))
    .filter((entry) => entry.weight > 0);

  const weightSum = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  const recipients =
    weightSum > 0 ? weighted : recipientIds.map((id) => ({ id, weight: 1 }));

  let assigned = 0;
  recipients.forEach(({ id, weight }, index) => {
    const divisor = weightSum > 0 ? weightSum : recipients.length;
    const share = weightSum > 0 ? weight : 1;
    const isLast = index === recipients.length - 1;
    const amount = isLast
      ? truncateToDecimals(totalApproved - assigned, 2)
      : truncateToDecimals(totalApproved * (share / divisor), 2);

    result.set(id, amount);
    assigned = truncateToDecimals(assigned + amount, 2);
  });

  return result;
}

function buildFundingTypeAllocationBySection(
  allSectionIds: string[],
  projectsBySectionId: Record<string, ProjectRollupSource[]>,
  departmentByFundingType: FundingTypeBudgetRow[],
  fy: Awaited<ReturnType<typeof getCurrentFinancialYear>>,
  allBudgetLines: boolean
): Map<string, Map<string, number>> {
  const allocationBySection = new Map<string, Map<string, number>>();
  for (const sectionId of allSectionIds) {
    allocationBySection.set(sectionId, new Map());
  }

  for (const fullName of DEPARTMENT_FUNDING_TYPE_NAMES) {
    const code = fundingTypeCode(fullName);
    const totalApproved =
      departmentByFundingType.find((row) => row.code === code)?.amountApproved ?? 0;

    const weightsBySectionId = new Map<string, number>();
    if (EQUAL_SPLIT_UNIT_FUNDING_TYPE_CODES.has(code)) {
      for (const sectionId of allSectionIds) {
        weightsBySectionId.set(sectionId, 1);
      }
    } else {
      for (const sectionId of allSectionIds) {
        let weight = 0;
        for (const project of projectsBySectionId[sectionId] ?? []) {
          if (projectFundingTypeCode(project) !== code) continue;
          weight += projectSplitWeight(project, fy, allBudgetLines);
        }
        weightsBySectionId.set(sectionId, weight);
      }
    }

    const distributed = distributeApprovedAmount(
      totalApproved,
      allSectionIds,
      weightsBySectionId
    );

    for (const sectionId of allSectionIds) {
      allocationBySection.get(sectionId)!.set(code, distributed.get(sectionId) ?? 0);
    }
  }

  return allocationBySection;
}

function buildProjectAllocationById(
  projectsBySectionId: Record<string, ProjectRollupSource[]>,
  allocationBySection: Map<string, Map<string, number>>,
  fy: Awaited<ReturnType<typeof getCurrentFinancialYear>>,
  allBudgetLines: boolean
): Map<string, number> {
  const allocationByProject = new Map<string, number>();

  for (const projects of Object.values(projectsBySectionId)) {
    for (const project of projects) {
      allocationByProject.set(project.id, 0);
    }
  }

  for (const [sectionId, projects] of Object.entries(projectsBySectionId)) {
    for (const fullName of DEPARTMENT_FUNDING_TYPE_NAMES) {
      const code = fundingTypeCode(fullName);
      const unitSlice = allocationBySection.get(sectionId)?.get(code) ?? 0;
      const sliceProjects = projects.filter((project) => projectFundingTypeCode(project) === code);
      if (sliceProjects.length === 0) continue;

      const weights = new Map<string, number>();
      for (const project of sliceProjects) {
        weights.set(project.id, projectSplitWeight(project, fy, allBudgetLines));
      }

      const distributed = distributeApprovedAmount(
        unitSlice,
        sliceProjects.map((project) => project.id),
        weights
      );

      for (const project of sliceProjects) {
        allocationByProject.set(project.id, distributed.get(project.id) ?? 0);
      }
    }
  }

  return allocationByProject;
}

function buildUnitFundingTypeBreakdown(
  sectionId: string,
  sectionProjects: ProjectWithBudget[],
  allocationBySection: Map<string, Map<string, number>>
): UnitFundingTypeSlice[] {
  const spentByCode = new Map<string, number>();
  for (const fullName of DEPARTMENT_FUNDING_TYPE_NAMES) {
    spentByCode.set(fundingTypeCode(fullName), 0);
  }

  for (const project of sectionProjects) {
    const code = projectFundingTypeCode(project);
    if (!code) continue;
    spentByCode.set(code, (spentByCode.get(code) ?? 0) + project.totals.paymentsCertified);
  }

  const sectionAllocations = allocationBySection.get(sectionId) ?? new Map();

  return DEPARTMENT_FUNDING_TYPE_NAMES.map((fullName) => {
    const code = fundingTypeCode(fullName);
    const allocation = sectionAllocations.get(code) ?? 0;
    const spent = spentByCode.get(code) ?? 0;

    return {
      code,
      title: fundingTypeLabel(fullName),
      allocation,
      spent,
      utilizationPct: allocation > 0 ? (spent / allocation) * 100 : 0,
    };
  });
}

function aggregateProjectsBySectionId(projects: ProjectRollupSource[]) {
  const bySectionId: Record<string, ProjectRollupSource[]> = {};
  for (const project of projects) {
    if (!project.sectionId) continue;
    if (!bySectionId[project.sectionId]) bySectionId[project.sectionId] = [];
    bySectionId[project.sectionId].push(project);
  }
  return bySectionId;
}

export async function getUnitBudgetBreakdown(
  user: SessionUser,
  projects: ProjectWithBudget[],
  allocationBySection: Map<string, Map<string, number>>
): Promise<UnitBudgetRow[]> {
  const sectionFilter = canViewAllProjects(user)
    ? { code: { in: [...UNIT_CODES] } }
    : user.sectionId
      ? { id: user.sectionId }
      : { id: "impossible" };

  const sections = await prisma.section.findMany({
    where: sectionFilter,
    include: {
      users: {
        where: { role: { in: ["HOS", "OFFICER"] } },
        orderBy: { name: "asc" },
      },
    },
  });

  const projectsBySectionId = aggregateProjectsBySectionId(projects);

  const rows = sections.map((section) => {
    const code = getUnitLabel(section) ?? section.name;
    const sectionProjects = projectsBySectionId[section.id] ?? [];
    const spent = sectionProjects.reduce((sum, p) => sum + p.totals.paymentsCertified, 0);
    const warrant = sectionProjects.reduce((sum, p) => sum + p.totals.warrantApproved, 0);
    const byFundingType = buildUnitFundingTypeBreakdown(
      section.id,
      sectionProjects,
      allocationBySection
    );
    const allocation = truncateToDecimals(
      byFundingType.reduce((sum, slice) => sum + slice.allocation, 0),
      2
    );
    const encumbrance = truncateToDecimals(
      sectionProjects.reduce((sum, project) => sum + sumPoEncumbrance(project.purchaseOrders), 0),
      2
    );
    const balanceAllocation = truncateToDecimals(allocation - encumbrance, 2);
    const utilizationPct = allocation > 0 ? (spent / allocation) * 100 : 0;

    return {
      unit: code,
      code,
      leadOfficer: section.headName ?? section.users.find((u) => u.role === "HOS")?.name ?? section.users[0]?.name ?? null,
      allocation,
      encumbrance,
      balanceAllocation,
      spent,
      warrant,
      utilizationPct,
      byFundingType,
    };
  });

  const order = new Map<string, number>(UNIT_CODES.map((code, index) => [code, index]));
  return rows.sort((a, b) => (order.get(a.code) ?? 999) - (order.get(b.code) ?? 999));
}

export async function getDepartmentBudgetSummary(user: SessionUser) {
  const { allocationBySection, departmentByFundingType } =
    await computeDepartmentAllocations();
  const projects = await getProjectsWithBudget(user);

  const bySection: Record<string, typeof projects> = {};
  for (const p of projects) {
    const key = getUnitLabel(p.section) ?? "Unassigned";
    if (!bySection[key]) bySection[key] = [];
    bySection[key].push(p);
  }

  const byUnit = await getUnitBudgetBreakdown(user, projects, allocationBySection);

  const fundingTotals = departmentByFundingType.reduce<DepartmentBudgetTotals>(
    (acc, row) => ({
      allocation: acc.allocation + row.amountApproved,
      spent: acc.spent + row.spent,
      warrant: acc.warrant,
      encumbranceTotal: acc.encumbranceTotal + row.encumbranceAmount,
      encumbranceBalance: acc.encumbranceBalance + row.encumbranceBalance,
      balanceAllocation: acc.balanceAllocation + row.balanceAllocation,
    }),
    {
      allocation: 0,
      spent: 0,
      warrant: 0,
      encumbranceTotal: 0,
      encumbranceBalance: 0,
      balanceAllocation: 0,
    }
  );

  const warrant = projects.reduce((sum, p) => sum + p.totals.warrantApproved, 0);

  const totals: DepartmentBudgetTotals = {
    ...fundingTotals,
    warrant,
  };

  return { projects, bySection, byUnit, totals, byFundingType: departmentByFundingType };
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
      bca: true,
      feasibility: true,
      tendering: true,
      contract: true,
      fsorConfig: true,
      completion: true,
      documents: true,
      budgets: fy
        ? { where: { financialYearId: fy.id }, include: { financialYear: true } }
        : { include: { financialYear: true } },
      budgetLines: { orderBy: { date: "desc" } },
      purchaseOrders: {
        include: { budgetLine: true },
        orderBy: { claimDate: "desc" },
      },
      variationOrders: { orderBy: { createdAt: "asc" } },
      extensionOfTimes: { orderBy: { createdAt: "asc" } },
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
    prisma.projectFsorConfig.upsert({
      where: { projectId },
      update: {},
      create: { projectId },
    }),
  ]);
}
