import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchFsorProjectStatus, syncProjectToFsor } from "@/lib/fsor-sync";
import { syncFsorJobOrdersForProject } from "@/lib/fsor-jo-sync";
import { NextResponse } from "next/server";

export async function GET(
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

  if (project.contractCategory === "fsor") {
    await syncFsorJobOrdersForProject(id).catch(() => null);
  }

  const status = await fetchFsorProjectStatus(id);
  return NextResponse.json(status);
}
