import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditProject } from "@/lib/permissions";
import { NextResponse } from "next/server";

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
  if (!canEditProject(session.user, project)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const fyId =
    body.financialYearId ??
    (await prisma.financialYear.findFirst({ where: { isCurrent: true } }))?.id;

  if (!fyId) {
    return NextResponse.json({ error: "No financial year configured" }, { status: 400 });
  }

  const budget = await prisma.projectBudget.upsert({
    where: {
      projectId_financialYearId: { projectId: id, financialYearId: fyId },
    },
    update: {
      allocation: body.allocation ?? 0,
      encumbranceTotal: body.encumbranceTotal ?? 0,
      encumbranceBalance: body.encumbranceBalance ?? 0,
    },
    create: {
      projectId: id,
      financialYearId: fyId,
      allocation: body.allocation ?? 0,
      encumbranceTotal: body.encumbranceTotal ?? 0,
      encumbranceBalance: body.encumbranceBalance ?? 0,
    },
  });

  return NextResponse.json(budget);
}
