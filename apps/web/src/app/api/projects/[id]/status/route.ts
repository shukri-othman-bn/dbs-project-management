import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditProject } from "@/lib/permissions";
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
  const update = await prisma.statusUpdate.create({
    data: {
      projectId: id,
      progressAsOf: new Date(body.progressAsOf),
      physicalActual: body.physicalActual ?? 0,
      physicalScheduled: body.physicalScheduled ?? 0,
      paymentActual: body.paymentActual ?? 0,
      paymentScheduled: body.paymentScheduled ?? 0,
      remarks: body.remarks || null,
      actionsRequired: body.actionsRequired || null,
      createdById: session.user.id,
    },
  });

  if (body.actionsRequired) {
    await prisma.project.update({
      where: { id },
      data: { toMonitor: true },
    });
  }

  return NextResponse.json(update);
}
