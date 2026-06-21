/**
 * Backfill PurchaseOrder rows for certified payment BudgetLines that have no linked PO.
 * Run: npx tsx scripts/backfill-purchase-orders.ts
 */
import { prisma } from "../src/lib/prisma";
import { syncPurchaseOrderForPaymentLine } from "../src/lib/purchase-order-sync";

async function main() {
  const lines = await prisma.budgetLine.findMany({
    where: {
      type: "payment",
      amountCertified: { not: null },
      date: { not: null },
      purchaseOrder: null,
    },
  });

  let upserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const line of lines) {
    try {
      const result = await syncPurchaseOrderForPaymentLine(line);
      if (result.action === "upserted") upserted++;
      else skipped++;
    } catch (error) {
      failed++;
      console.warn(`Skipped line ${line.id} (project ${line.projectId}):`, error);
    }
  }

  console.log(`Done. Upserted: ${upserted}, skipped: ${skipped}, failed: ${failed}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
