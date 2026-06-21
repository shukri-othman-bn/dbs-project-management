import { auth } from "@/lib/auth";
import { sumPayments } from "@/lib/budget";
import { prisma } from "@/lib/prisma";
import { canEditBudgetAllocation } from "@/lib/permissions";
import { truncateToDecimals } from "@/lib/utils";
import { NextResponse } from "next/server";

function parseAmount(v: unknown): number {
  const n = parseFloat(String(v ?? 0));
  return isNaN(n) ? 0 : truncateToDecimals(n, 2);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canEditBudgetAllocation(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const fyId =
    body.financialYearId ??
    (await prisma.financialYear.findFirst({ where: { isCurrent: true } }))?.id;

  if (!fyId) {
    return NextResponse.json({ error: "No financial year configured" }, { status: 400 });
  }

  const existing = await prisma.projectBudget.findUnique({
    where: {
      projectId_financialYearId: { projectId: id, financialYearId: fyId },
    },
  });

  if (existing?.budgetSummaryLocked) {
    return NextResponse.json(
      { error: "FY Budget Summary is locked and cannot be changed" },
      { status: 403 }
    );
  }

  const allocation = parseAmount(body.allocation);
  const encumbranceTotal = parseAmount(body.encumbranceTotal);

  if (allocation <= 0 || encumbranceTotal <= 0) {
    return NextResponse.json(
      { error: "Allocation and encumbrance total must both be greater than zero" },
      { status: 400 }
    );
  }

  const budgetLines = await prisma.budgetLine.findMany({
    where: {
      projectId: id,
      OR: [{ financialYearId: fyId }, { financialYearId: null }],
    },
    select: { type: true, amountApproved: true, amountCertified: true },
  });
  const paymentsCertified = sumPayments(budgetLines).certified;
  const encumbranceBalance = truncateToDecimals(encumbranceTotal - paymentsCertified, 2);

  const budget = await prisma.projectBudget.upsert({
    where: {
      projectId_financialYearId: { projectId: id, financialYearId: fyId },
    },
    update: {
      allocation,
      encumbranceTotal,
      encumbranceBalance,
      budgetSummaryLocked: true,
    },
    create: {
      projectId: id,
      financialYearId: fyId,
      allocation,
      encumbranceTotal,
      encumbranceBalance,
      budgetSummaryLocked: true,
    },
  });

  return NextResponse.json(budget);
}
