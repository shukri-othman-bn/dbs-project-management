import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditProject } from "@/lib/permissions";
import { BudgetLineType } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(
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
  if (!canEditProject(session.user, project)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const line = await prisma.budgetLine.create({
    data: {
      projectId: id,
      financialYearId: body.financialYearId || null,
      type: body.type as BudgetLineType,
      date: body.date ? new Date(body.date) : null,
      description: body.description || null,
      amountApproved: body.amountApproved ?? 0,
      amountCertified: body.amountCertified ?? null,
      amountBalance: body.amountBalance ?? null,
      voucherRef: body.voucherRef || null,
    },
  });

  return NextResponse.json(line);
}
