import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditProject } from "@/lib/permissions";
import { syncProjectToFsor } from "@/lib/fsor-sync";
import { syncFsorJobOrdersForProject } from "@/lib/fsor-jo-sync";
import { resolveClientId } from "@/lib/clients";
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
  const clientId = await resolveClientId(body.clientMinistry, body.clientDepartment);

  const updated = await prisma.project.update({
    where: { id },
    data: {
      title: body.title,
      lifecycleStage: body.lifecycleStage,
      sectionId: body.sectionId || null,
      clientId,
      fundingTypeId: body.fundingTypeId || null,
      oicUserId: null,
      oicName: body.oicName?.trim() || null,
      oicEmail: body.oicEmail?.trim() || null,
      toMonitor: !!body.toMonitor,
      quotationOrContractNo: body.quotationOrContractNo || null,
      projectType: body.projectType || null,
      contractCategory: body.contractCategory || null,
    },
  });

  if (updated.contractCategory === "fsor") {
    await syncProjectToFsor(id).catch(() => null);
    await syncFsorJobOrdersForProject(id).catch(() => null);
  }

  return NextResponse.json(updated);
}
