import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const stageByProjectNumber = {
  "QBM/46/2026": "ongoing",
  "DBS-2025-001": "ongoing",
  "DBS-2025-002": "quotation_tender",
  "DBS-2025-003": "quotation_tender",
  "DBS-2026-TND-001": "quotation_tender",
  "DBS-2026-TND-002": "quotation_tender",
  "DBS-2024-089": "completed",
  "DBS-2025-004": "ongoing",
  "DBS-2025-005": "quotation_tender",
  "DBS-2026-DES-001": "design",
  "DBS-2026-DES-002": "design",
  "DBS-2026-DES-003": "design",
  "DBS-2026-BCA-001": "design",
  "DBS-2026-BCA-002": "design",
  "DBS-2026-BCA-003": "design",
  "DBS-2026-BCA-004": "design",
  "DBS-2026-FEA-001": "pre_design",
  "DBS-2026-FEA-002": "pre_design",
  "DBS-2026-FEA-003": "pre_design",
  "DBS-2026-FEA-004": "keep_in_view",
  "FSOR-MOD-HOUSING-2026-02": "ongoing",
};

async function main() {
  for (const [projectNumber, lifecycleStage] of Object.entries(stageByProjectNumber)) {
    const result = await prisma.project.updateMany({
      where: { projectNumber },
      data: { lifecycleStage },
    });
    if (result.count > 0) {
      console.log(`${projectNumber} -> ${lifecycleStage}`);
    }
  }

  const counts = await prisma.project.groupBy({
    by: ["lifecycleStage"],
    _count: { _all: true },
    orderBy: { lifecycleStage: "asc" },
  });

  console.log("\nStage distribution:");
  for (const row of counts) {
    console.log(`  ${row.lifecycleStage}: ${row._count._all}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
