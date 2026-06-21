import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const projectIds = await prisma.budgetLine.findMany({
    where: { type: "payment" },
    select: { projectId: true },
    distinct: ["projectId"],
  });

  for (const { projectId } of projectIds) {
    const lines = await prisma.budgetLine.findMany({
      where: { projectId, type: "payment" },
      orderBy: [{ claimDate: "asc" }, { date: "asc" }, { createdAt: "asc" }],
    });

    for (const [index, line] of lines.entries()) {
      await prisma.budgetLine.update({
        where: { id: line.id },
        data: {
          progressClaimNo: index + 1,
          description: null,
        },
      });
    }
  }

  console.log(`Backfilled progress claim numbers for ${projectIds.length} project(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
