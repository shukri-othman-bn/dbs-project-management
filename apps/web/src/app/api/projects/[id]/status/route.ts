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
  const kind = body.kind === "financial" ? "financial" : "physical";

  const latest = await prisma.statusUpdate.findFirst({
    where: { projectId: id },
    orderBy: { progressAsOf: "desc" },
  });

  const update = await prisma.statusUpdate.create({
    data: {
      projectId: id,
      progressAsOf: new Date(body.progressAsOf),
      physicalActual:
        kind === "physical"
          ? (body.physicalActual ?? 0)
          : (latest?.physicalActual ?? 0),
      physicalScheduled:
        kind === "physical"
          ? (body.physicalScheduled ?? 0)
          : (latest?.physicalScheduled ?? 0),
      paymentActual:
        kind === "financial"
          ? (body.paymentActual ?? 0)
          : (latest?.paymentActual ?? 0),
      paymentScheduled:
        kind === "financial"
          ? (body.paymentScheduled ?? 0)
          : (latest?.paymentScheduled ?? 0),
      remarks: kind === "physical" ? body.remarks || null : latest?.remarks ?? null,
      actionsRequired:
        kind === "physical" ? body.actionsRequired || null : latest?.actionsRequired ?? null,
      createdById: session.user.id,
    },
  });

  if (kind === "physical" && body.actionsRequired) {
    await prisma.project.update({
      where: { id },
      data: { toMonitor: true },
    });
  }

  return NextResponse.json(update);
}
