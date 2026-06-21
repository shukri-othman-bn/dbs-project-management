import { prisma } from "@/lib/prisma";
import { truncateToDecimals } from "@/lib/utils";
import { computeAllVariationOrderFields } from "@/lib/variation-order-calculations";

export async function getOriginalContractSum(projectId: string): Promise<number | null> {
  const [contract, design] = await Promise.all([
    prisma.contractDetails.findUnique({ where: { projectId } }),
    prisma.projectDesign.findUnique({ where: { projectId } }),
  ]);
  return contract?.contractSum ?? design?.preliminaryEstimate ?? null;
}

export async function syncVariationOrderCalculatedFields(projectId: string) {
  const [records, originalContractSum] = await Promise.all([
    prisma.variationOrder.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        createdAt: true,
        approvedDate: true,
        voAmount: true,
      },
    }),
    getOriginalContractSum(projectId),
  ]);

  const computed = computeAllVariationOrderFields(records, originalContractSum);

  await Promise.all(
    records.map((vo) => {
      const fields = computed.get(vo.id)!;
      return prisma.variationOrder.update({
        where: { id: vo.id },
        data: {
          voPercent:
            fields.voPercent != null ? truncateToDecimals(fields.voPercent, 2) : null,
          revisedContractSum:
            fields.revisedContractSum != null
              ? truncateToDecimals(fields.revisedContractSum, 2)
              : null,
        },
      });
    })
  );
}
