import { PrismaClient } from "@prisma/client";
import {
  FUNDING_TYPE_NAMES,
  mapLegacyFundingTypeName,
} from "../src/lib/funding-types";

const prisma = new PrismaClient();

async function main() {
  const fundingTypes: Record<string, { id: string }> = {};

  for (const name of FUNDING_TYPE_NAMES) {
    const code = name.slice(0, 4);
    const fundingType = await prisma.fundingType.upsert({
      where: { name },
      update: { mainCategory: code },
      create: { name, mainCategory: code },
    });
    fundingTypes[name] = fundingType;
  }

  const legacyFunding = await prisma.fundingType.findMany({
    where: { name: { notIn: [...FUNDING_TYPE_NAMES] } },
  });

  for (const legacy of legacyFunding) {
    const mappedName = mapLegacyFundingTypeName(legacy.name);
    if (!mappedName) {
      console.warn(`Skipping unmapped legacy funding type: ${legacy.name}`);
      continue;
    }
    const updated = await prisma.project.updateMany({
      where: { fundingTypeId: legacy.id },
      data: { fundingTypeId: fundingTypes[mappedName].id },
    });
    if (updated.count > 0) {
      console.log(`Migrated ${updated.count} project(s) from "${legacy.name}" to "${mappedName}"`);
    }
  }

  const removed = await prisma.fundingType.deleteMany({
    where: { name: { notIn: [...FUNDING_TYPE_NAMES] } },
  });
  if (removed.count > 0) {
    console.log(`Removed ${removed.count} legacy funding type(s).`);
  }

  console.log("Funding types:");
  for (const name of FUNDING_TYPE_NAMES) {
    console.log(`  ${name}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
