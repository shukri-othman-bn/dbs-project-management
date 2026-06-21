import { prisma } from "./prisma";

export const PROGRESS_CLAIM_NO_LABEL = "Progress Claim No.";
export const CONTRACTOR_CLAIM_REF_LETTER_LABEL = "Contractor's Claim Ref Letter";

export type PaymentValuationLineRecord = {
  progressClaimNo: number | null;
  claimDate: Date | null;
  date: Date | null;
  createdAt?: Date;
};

export function paymentValuationSortKey(line: PaymentValuationLineRecord) {
  return line.claimDate?.getTime() ?? line.date?.getTime() ?? line.createdAt?.getTime() ?? 0;
}

export function sortPaymentValuationsNewestFirst<T extends PaymentValuationLineRecord>(
  lines: T[]
) {
  return [...lines].sort(
    (a, b) => paymentValuationSortKey(b) - paymentValuationSortKey(a)
  );
}

export function formatProgressClaimNo(no: number | null | undefined) {
  return no != null ? String(no) : "—";
}

export async function nextProgressClaimNo(projectId: string) {
  const rows = await prisma.$queryRaw<{ max: number | null }[]>`
    SELECT MAX("progressClaimNo") AS max
    FROM "BudgetLine"
    WHERE "projectId" = ${projectId} AND type = 'payment'
  `;
  return (rows[0]?.max ?? 0) + 1;
}

export function assignDisplayProgressClaimNumbers<
  T extends PaymentValuationLineRecord & { id: string },
>(lines: T[]) {
  const ascending = [...lines].sort(
    (a, b) => paymentValuationSortKey(a) - paymentValuationSortKey(b)
  );
  const fallbackById = new Map(
    ascending.map((line, index) => [line.id, index + 1] as const)
  );

  return lines.map((line) => ({
    ...line,
    displayProgressClaimNo: line.progressClaimNo ?? fallbackById.get(line.id) ?? null,
  }));
}
