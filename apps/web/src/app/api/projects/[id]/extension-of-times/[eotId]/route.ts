import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditProject } from "@/lib/permissions";
import { syncExtensionOfTimeCalculatedFields } from "@/lib/extension-of-time-sync";
import { NextResponse } from "next/server";

function parseDate(v: unknown): Date | null {
  if (!v || v === "") return null;
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d;
}

const DATE_FIELDS = [
  "submittedToSbmDate",
  "receivedByDbsoDate",
  "committeeReviewDate",
  "submittedToDgoDate",
  "submittedToClientDate",
  "approvedDate",
  "revisedCompletionDate",
] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; eotId: string }> }
) {
  const { id, eotId } = await params;
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

  const existing = await prisma.extensionOfTime.findFirst({
    where: { id: eotId, projectId: id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const updates: Record<string, Date | string | null> = {};
  for (const field of DATE_FIELDS) {
    if (field in body) {
      updates[field] = parseDate(body[field]);
    }
  }
  if ("eotPeriod" in body) {
    updates.eotPeriod = (body.eotPeriod as string)?.trim() || null;
  }

  await prisma.extensionOfTime.update({
    where: { id: eotId },
    data: { ...updates, isLocked: true },
  });

  await syncExtensionOfTimeCalculatedFields(id);

  const record = await prisma.extensionOfTime.findUnique({ where: { id: eotId } });

  return NextResponse.json(record);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; eotId: string }> }
) {
  const { id, eotId } = await params;
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

  const existing = await prisma.extensionOfTime.findFirst({
    where: { id: eotId, projectId: id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.extensionOfTime.delete({ where: { id: eotId } });
  await syncExtensionOfTimeCalculatedFields(id);

  return NextResponse.json({ ok: true });
}
