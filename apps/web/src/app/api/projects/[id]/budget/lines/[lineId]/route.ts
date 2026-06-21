import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditProject } from "@/lib/permissions";
import {
  syncPurchaseOrderForPaymentLine,
  WarrantInsufficientError,
} from "@/lib/purchase-order-sync";
import { truncateToDecimals } from "@/lib/utils";
import { NextResponse } from "next/server";

function parseDate(v: unknown): Date | null {
  if (!v || v === "") return null;
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d;
}

function parseAmountOrNull(v: unknown): number | null {
  if (v === "" || v == null) return null;
  const n = parseFloat(String(v));
  return isNaN(n) ? null : truncateToDecimals(n, 2);
}

async function getPaymentLine(projectId: string, lineId: string) {
  return prisma.budgetLine.findFirst({
    where: { id: lineId, projectId, type: "payment" },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  const { id, lineId } = await params;
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

  const existing = await getPaymentLine(id, lineId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  try {
    const line = await prisma.budgetLine.update({
      where: { id: lineId },
      data: {
        claimDate: "claimDate" in body ? parseDate(body.claimDate) : undefined,
        date: "date" in body ? parseDate(body.date) : undefined,
        description:
          "description" in body ? (body.description as string)?.trim() || null : undefined,
        amountApproved:
          "amountApproved" in body ? (parseAmountOrNull(body.amountApproved) ?? 0) : undefined,
        amountCertified:
          "amountCertified" in body ? parseAmountOrNull(body.amountCertified) : undefined,
      },
    });

    await syncPurchaseOrderForPaymentLine(line);

    return NextResponse.json(line);
  } catch (error) {
    if (error instanceof WarrantInsufficientError) {
      return NextResponse.json(
        {
          error: "Insufficient warrant to certify this payment",
          warrantApproved: error.warrantApproved,
          paymentsCertified: error.paymentsCertified,
        },
        { status: 400 }
      );
    }
    console.error("Failed to update payment line", error);
    return NextResponse.json({ error: "Failed to save payment line" }, { status: 500 });
  }
}
