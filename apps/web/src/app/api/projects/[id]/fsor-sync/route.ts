import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditProject } from "@/lib/permissions";
import { ensureProjectRelations } from "@/lib/data";
import { parseBuildings, syncProjectToFsor } from "@/lib/fsor-sync";
import { syncFsorJobOrdersForProject } from "@/lib/fsor-jo-sync";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEditProject(session.user, project)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureProjectRelations(id);
  const result = await syncProjectToFsor(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.errors?.join(" ") ?? "Sync failed" }, { status: 400 });
  }

  const joResult = await syncFsorJobOrdersForProject(id);

  return NextResponse.json({ ok: true, syncedAt: result.syncedAt, jobOrders: joResult });
}
