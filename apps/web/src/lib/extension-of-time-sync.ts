import { prisma } from "@/lib/prisma";
import { computeAllExtensionOfTimeFields } from "@/lib/extension-of-time-calculations";
import { truncateToDecimals } from "@/lib/utils";

export async function getOriginalContractPeriod(projectId: string): Promise<string | null> {
  const [contract, tendering] = await Promise.all([
    prisma.contractDetails.findUnique({ where: { projectId } }),
    prisma.projectTendering.findUnique({ where: { projectId } }),
  ]);
  return contract?.contractPeriod ?? tendering?.completionPeriod ?? null;
}

export async function syncExtensionOfTimeCalculatedFields(projectId: string) {
  const [records, originalContractPeriod] = await Promise.all([
    prisma.extensionOfTime.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        createdAt: true,
        eotPeriod: true,
      },
    }),
    getOriginalContractPeriod(projectId),
  ]);

  const computed = computeAllExtensionOfTimeFields(records, originalContractPeriod);

  await Promise.all(
    records.map((eot) => {
      const fields = computed.get(eot.id)!;
      return prisma.extensionOfTime.update({
        where: { id: eot.id },
        data: {
          eotPercent:
            fields.eotPercent != null ? truncateToDecimals(fields.eotPercent, 2) : null,
        },
      });
    })
  );
}
