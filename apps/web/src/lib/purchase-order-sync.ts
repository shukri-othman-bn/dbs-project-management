import { prisma } from "@/lib/prisma";
import { sumPayments, sumWarrant } from "@/lib/budget";
import { truncateToDecimals } from "@/lib/utils";
import type { BudgetLine } from "@prisma/client";

export type PaymentLineForSync = Pick<
  BudgetLine,
  | "id"
  | "projectId"
  | "type"
  | "date"
  | "claimDate"
  | "amountApproved"
  | "amountCertified"
>;

export class WarrantInsufficientError extends Error {
  constructor(
    public warrantApproved: number,
    public paymentsCertified: number
  ) {
    super(
      `Insufficient warrant: approved ${warrantApproved.toFixed(2)}, certified payments ${paymentsCertified.toFixed(2)}`
    );
    this.name = "WarrantInsufficientError";
  }
}

function isCertified(line: PaymentLineForSync): boolean {
  return line.amountCertified != null && line.date != null;
}

export async function checkWarrantCoversCertifiedPayments(
  projectId: string,
  budgetLines: PaymentLineForSync[]
): Promise<void> {
  const lines = budgetLines.length
    ? budgetLines
    : await prisma.budgetLine.findMany({
        where: { projectId },
        select: {
          id: true,
          projectId: true,
          type: true,
          date: true,
          claimDate: true,
          amountApproved: true,
          amountCertified: true,
        },
      });

  const warrant = sumWarrant(lines);
  const payments = sumPayments(lines);

  if (payments.certified > warrant.approved) {
    throw new WarrantInsufficientError(warrant.approved, payments.certified);
  }
}

export async function syncPurchaseOrderForPaymentLine(
  line: PaymentLineForSync
): Promise<{ action: "upserted" | "deleted" | "skipped" }> {
  if (line.type !== "payment") {
    return { action: "skipped" };
  }

  const allLines = await prisma.budgetLine.findMany({
    where: { projectId: line.projectId },
    select: {
      id: true,
      projectId: true,
      type: true,
      date: true,
      claimDate: true,
      amountApproved: true,
      amountCertified: true,
    },
  });

  if (isCertified(line)) {
    await checkWarrantCoversCertifiedPayments(line.projectId, allLines);

    const amount = truncateToDecimals(line.amountCertified!, 2);

    await prisma.purchaseOrder.upsert({
      where: { budgetLineId: line.id },
      create: {
        projectId: line.projectId,
        budgetLineId: line.id,
        poAmount: amount,
        claimCertified: amount,
        claimDate: line.claimDate,
      },
      update: {
        poAmount: amount,
        claimCertified: amount,
        claimDate: line.claimDate,
      },
    });

    return { action: "upserted" };
  }

  const existing = await prisma.purchaseOrder.findUnique({
    where: { budgetLineId: line.id },
  });

  if (!existing) {
    return { action: "skipped" };
  }

  if (!existing.poId) {
    await prisma.purchaseOrder.delete({ where: { id: existing.id } });
    return { action: "deleted" };
  }

  await prisma.purchaseOrder.update({
    where: { id: existing.id },
    data: {
      poAmount: 0,
      claimCertified: null,
    },
  });

  return { action: "deleted" };
}

export function sumPoCommitted(
  purchaseOrders: { poAmount: number; budgetLineId: string | null }[]
): number {
  return purchaseOrders
    .filter((po) => po.budgetLineId != null)
    .reduce((sum, po) => sum + po.poAmount, 0);
}

/** Sum PO amounts where a PO ID has been assigned (department encumbrance). */
export function sumPoEncumbrance(
  purchaseOrders: { poAmount: number; poId: string | null }[]
): number {
  return truncateToDecimals(
    purchaseOrders
      .filter((po) => po.poId != null && po.poId.trim().length > 0)
      .reduce((sum, po) => sum + po.poAmount, 0),
    2
  );
}

/** Sum PO amounts that have been marked paid (PO ID assigned and paid date set). */
export function sumPoPaid(
  purchaseOrders: { poAmount: number; poId: string | null; paidDate: Date | null }[]
): number {
  return truncateToDecimals(
    purchaseOrders
      .filter((po) => po.poId != null && po.poId.trim().length > 0 && po.paidDate != null)
      .reduce((sum, po) => sum + po.poAmount, 0),
    2
  );
}
