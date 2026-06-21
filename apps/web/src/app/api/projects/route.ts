import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCreateProject } from "@/lib/permissions";
import { ensureProjectRelations } from "@/lib/data";
import { resolveClientId } from "@/lib/clients";
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
    clientMinistry,
    clientDepartment,
    fundingTypeId,
    oicName,
    oicEmail,
    toMonitor,
    quotationOrContractNo,
    projectType,
    contractCategory,
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

  const clientId = await resolveClientId(clientMinistry, clientDepartment);

  const project = await prisma.project.create({
    data: {
      projectNumber,
      title,
      lifecycleStage: lifecycleStage ?? "pre_design",
      sectionId: sectionId || null,
      clientId: clientId || null,
      fundingTypeId: fundingTypeId || null,
      oicUserId: null,
      oicName: oicName?.trim() || null,
      oicEmail: oicEmail?.trim() || null,
      toMonitor: !!toMonitor,
      quotationOrContractNo: quotationOrContractNo || projectNumber,
      projectType: projectType || null,
      contractCategory: contractCategory || null,
    },
  });

  await ensureProjectRelations(project.id);

  if (project.contractCategory === "fsor") {
    await syncProjectToFsor(project.id).catch(() => null);
    await syncFsorJobOrdersForProject(project.id).catch(() => null);
  }

  return NextResponse.json(project);
}
