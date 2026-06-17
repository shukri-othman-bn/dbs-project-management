import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCreateProject } from "@/lib/permissions";
import { ensureProjectRelations } from "@/lib/data";
import { syncProjectToFsor } from "@/lib/fsor-sync";
import { syncFsorJobOrdersForProject } from "@/lib/fsor-jo-sync";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !canCreateProject(session.user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const {
    projectNumber,
    title,
    lifecycleStage,
    sectionId,
    clientId,
    fundingTypeId,
    oicUserId,
    toMonitor,
    team,
    allocation,
    financialYearId,
    quotationOrContractNo,
    projectType,
    contractCategory,
    contractorName,
    supervisingOfficer,
  } = body;

  if (!projectNumber || !title) {
    return NextResponse.json({ error: "Project number and title required" }, { status: 400 });
  }

  if (!contractCategory) {
    return NextResponse.json({ error: "Contract category required" }, { status: 400 });
  }

  const existing = await prisma.project.findUnique({ where: { projectNumber } });
  if (existing) {
    return NextResponse.json({ error: "Project number already exists" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      projectNumber,
      title,
      lifecycleStage: lifecycleStage ?? "planning",
      sectionId: sectionId || null,
      clientId: clientId || null,
      fundingTypeId: fundingTypeId || null,
      oicUserId: oicUserId || session.user.id,
      toMonitor: !!toMonitor,
      team: team || null,
      quotationOrContractNo: quotationOrContractNo || projectNumber,
      projectType: projectType || null,
      contractCategory: contractCategory || null,
      contractorName: contractorName || null,
      supervisingOfficer: supervisingOfficer || null,
    },
  });

  await ensureProjectRelations(project.id);

  const fyId =
    financialYearId ??
    (await prisma.financialYear.findFirst({ where: { isCurrent: true } }))?.id;

  if (fyId && allocation) {
    await prisma.projectBudget.create({
      data: {
        projectId: project.id,
        financialYearId: fyId,
        allocation: parseFloat(allocation) || 0,
      },
    });
  }

  if (project.contractCategory === "fsor") {
    await syncProjectToFsor(project.id).catch(() => null);
    await syncFsorJobOrdersForProject(project.id).catch(() => null);
  }

  return NextResponse.json(project);
}
