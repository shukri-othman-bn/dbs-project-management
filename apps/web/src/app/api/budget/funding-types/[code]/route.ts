import { auth } from "@/lib/auth";
import { sumPayments } from "@/lib/budget";
import { prisma } from "@/lib/prisma";
import { DEPARTMENT_FUNDING_TYPE_NAMES, fundingTypeCode } from "@/lib/funding-types";
import { canEditBudgetAllocation } from "@/lib/permissions";
import { sumPoEncumbrance } from "@/lib/purchase-order-sync";
import { truncateToDecimals } from "@/lib/utils";
import { NextResponse } from "next/server";

function parseAmount(v: unknown): number {
  const n = parseFloat(String(v ?? 0));
  return isNaN(n) ? 0 : truncateToDecimals(n, 2);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canEditBudgetAllocation(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fundingTypeName = DEPARTMENT_FUNDING_TYPE_NAMES.find(
    (name) => fundingTypeCode(name) === code
  );
  if (!fundingTypeName) {
    return NextResponse.json({ error: "Invalid funding type" }, { status: 400 });
  }

  const fundingType = await prisma.fundingType.findUnique({
    where: { name: fundingTypeName },
  });
  if (!fundingType) {
    return NextResponse.json({ error: "Funding type not found" }, { status: 404 });
  }

  const body = await req.json();
  const fyId =
    body.financialYearId ??
    (await prisma.financialYear.findFirst({ where: { isCurrent: true } }))?.id;

  if (!fyId) {
    return NextResponse.json({ error: "No financial year configured" }, { status: 400 });
  }

  const existing = await prisma.fundingTypeBudget.findUnique({
    where: {
      fundingTypeId_financialYearId: {
        fundingTypeId: fundingType.id,
        financialYearId: fyId,
      },
    },
  });

  if (existing?.budgetSummaryLocked) {
    return NextResponse.json(
      { error: "This funding type budget is locked and cannot be changed" },
      { status: 403 }
    );
  }

  const allocation = parseAmount(body.allocation);

  if (allocation <= 0) {
    return NextResponse.json(
      { error: "Amount approved must be greater than zero" },
      { status: 400 }
    );
  }

  const projects = await prisma.project.findMany({
    where: { fundingTypeId: fundingType.id },
    include: {
      budgetLines: { where: { OR: [{ financialYearId: fyId }, { financialYearId: null }] } },
      purchaseOrders: true,
    },
  });

  const spent = truncateToDecimals(
    projects.reduce(
      (sum, project) => sum + sumPayments(project.budgetLines).certified,
      0
    ),
    2
  );

  const encumbranceTotal = truncateToDecimals(
    projects.reduce((sum, project) => sum + sumPoEncumbrance(project.purchaseOrders), 0),
    2
  );

  const encumbranceBalance = truncateToDecimals(encumbranceTotal - spent, 2);

  const budget = await prisma.fundingTypeBudget.upsert({
    where: {
      fundingTypeId_financialYearId: {
        fundingTypeId: fundingType.id,
        financialYearId: fyId,
      },
    },
    update: {
      allocation,
      encumbranceTotal,
      encumbranceBalance,
      budgetSummaryLocked: true,
    },
    create: {
      fundingTypeId: fundingType.id,
      financialYearId: fyId,
      allocation,
      encumbranceTotal,
      encumbranceBalance,
      budgetSummaryLocked: true,
    },
  });

  return NextResponse.json(budget);
}
