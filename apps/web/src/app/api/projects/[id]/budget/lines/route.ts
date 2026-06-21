import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditProject } from "@/lib/permissions";
import { nextProgressClaimNo } from "@/lib/payment-valuation";
import {
  syncPurchaseOrderForPaymentLine,
  WarrantInsufficientError,
} from "@/lib/purchase-order-sync";
import { BudgetLineType } from "@prisma/client";
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
  const type = body.type as BudgetLineType;

  try {
    const progressClaimNo =
      type === "payment" ? await nextProgressClaimNo(id) : null;

    const line = await prisma.budgetLine.create({
      data: {
        projectId: id,
        financialYearId: body.financialYearId || null,
        type,
        date: body.date ? new Date(body.date) : null,
        claimDate: body.claimDate ? new Date(body.claimDate) : null,
        progressClaimNo,
        description: body.description || null,
        amountApproved: body.amountApproved ?? 0,
        amountCertified: body.amountCertified ?? null,
        amountBalance: body.amountBalance ?? null,
        voucherRef: body.voucherRef || null,
      },
    });

    if (type === "payment") {
      try {
        await syncPurchaseOrderForPaymentLine(line);
      } catch (syncError) {
        await prisma.budgetLine.delete({ where: { id: line.id } });
        throw syncError;
      }
    }

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
    console.error("Failed to create budget line", error);
    return NextResponse.json({ error: "Failed to save budget line" }, { status: 500 });
  }
}
