import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditProject } from "@/lib/permissions";
import { NextResponse } from "next/server";

function parseDate(v: unknown): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === "" || v == null) return null;
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d;
}

const WORKFLOW_FIELDS = [
  "sesDate",
  "invoiceDate",
  "eDispatchedDate",
  "eDispatchRef",
  "paidDate",
] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; poId: string }> }
) {
  const { id, poId } = await params;
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

  const existing = await prisma.purchaseOrder.findFirst({
    where: { id: poId, projectId: id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const nextPoId =
    "poId" in body ? ((body.poId as string)?.trim() || null) : existing.poId;

  const updatingWorkflow = WORKFLOW_FIELDS.some((field) => field in body);
  if (updatingWorkflow && !nextPoId) {
    return NextResponse.json(
      { error: "PO ID is required before updating payment workflow fields" },
      { status: 400 }
    );
  }

  if ("paidDate" in body && body.paidDate && !nextPoId) {
    return NextResponse.json(
      { error: "PO ID is required before recording paid date" },
      { status: 400 }
    );
  }

  const purchaseOrder = await prisma.purchaseOrder.update({
    where: { id: poId },
    data: {
      poId: "poId" in body ? nextPoId : undefined,
      sesDate: "sesDate" in body ? parseDate(body.sesDate) : undefined,
      invoiceDate: "invoiceDate" in body ? parseDate(body.invoiceDate) : undefined,
      eDispatchedDate:
        "eDispatchedDate" in body ? parseDate(body.eDispatchedDate) : undefined,
      eDispatchRef:
        "eDispatchRef" in body
          ? ((body.eDispatchRef as string)?.trim() || null)
          : undefined,
      paidDate: "paidDate" in body ? parseDate(body.paidDate) : undefined,
    },
  });

  return NextResponse.json(purchaseOrder);
}
