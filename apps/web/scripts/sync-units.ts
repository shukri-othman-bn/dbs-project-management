import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { defaultUnitAllocation, defaultUnitHead, LEGACY_SECTION_CODES, UNIT_CODES } from "../src/lib/units";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({
    where: { section: { code: { in: [...LEGACY_SECTION_CODES] } } },
    data: { sectionId: null },
  });
  await prisma.sectionBudget.deleteMany({
    where: { section: { code: { in: [...LEGACY_SECTION_CODES] } } },
  });
  await prisma.matterRequest.deleteMany({
    where: { section: { code: { in: [...LEGACY_SECTION_CODES] } } },
  });
  const removed = await prisma.section.deleteMany({
    where: { code: { in: [...LEGACY_SECTION_CODES] } },
  });
  console.log(`Removed ${removed.count} legacy section(s).`);

  const fy = await prisma.financialYear.findFirst({
    where: { isCurrent: true },
    orderBy: { startDate: "desc" },
  });

  const passwordHash = await bcrypt.hash("password123", 10);

  for (const code of UNIT_CODES) {
    const { headName, headEmail } = defaultUnitHead(code);
    const unit = await prisma.section.upsert({
      where: { code },
      update: { name: code, unitLabel: code, headName, headEmail },
      create: { name: code, code, unitLabel: code, headName, headEmail },
    });

    await prisma.user.upsert({
      where: { email: headEmail },
      update: {
        name: headName,
        sectionId: unit.id,
        role: Role.HOS,
      },
      create: {
        email: headEmail,
        name: headName,
        passwordHash,
        role: Role.HOS,
        sectionId: unit.id,
      },
    });

    if (fy) {
      const allocation = defaultUnitAllocation(code);
      await prisma.sectionBudget.upsert({
        where: {
          sectionId_financialYearId: {
            sectionId: unit.id,
            financialYearId: fy.id,
          },
        },
        update: { allocation },
        create: {
          sectionId: unit.id,
          financialYearId: fy.id,
          allocation,
        },
      });
    }
  }

  await prisma.$executeRaw`
    UPDATE "Project" p
    SET "oicName" = u.name, "oicEmail" = u.email, "oicUserId" = NULL
    FROM "User" u
    WHERE p."oicUserId" = u.id
      AND (p."oicName" IS NULL OR p."oicName" = '')
  `;

  const units = await prisma.section.findMany({
    where: { code: { in: [...UNIT_CODES] } },
    select: { code: true, headName: true, headEmail: true },
    orderBy: { code: "asc" },
  });
  console.log(`Active units (${units.length})`);
  for (const unit of units) {
    console.log(`  ${unit.code}: ${unit.headName} <${unit.headEmail}>`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
