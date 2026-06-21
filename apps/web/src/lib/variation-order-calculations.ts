export type VariationOrderCalcRecord = {
  id: string;
  createdAt: Date | string;
  approvedDate: Date | null;
  voAmount: number | null;
};

export function sortVariationOrdersAsc<T extends { createdAt: Date | string }>(
  records: T[]
): T[] {
  return [...records].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function computeVoPercent(
  voAmount: number | null,
  originalContractSum: number | null
): number | null {
  if (voAmount == null || originalContractSum == null || originalContractSum === 0) {
    return null;
  }
  return (voAmount / originalContractSum) * 100;
}

/** Running sum from original contract sum through prior approved VOs only. */
export function computeApprovedRevisedBase(
  recordsAsc: VariationOrderCalcRecord[],
  index: number,
  originalContractSum: number | null
): number | null {
  if (originalContractSum == null) return null;
  let base = originalContractSum;
  for (let i = 0; i < index; i++) {
    const vo = recordsAsc[i];
    if (vo.approvedDate != null && vo.voAmount != null) {
      base += vo.voAmount;
    }
  }
  return base;
}

export function computeRevisedContractSum(
  recordsAsc: VariationOrderCalcRecord[],
  index: number,
  originalContractSum: number | null,
  voAmount: number | null
): number | null {
  const base = computeApprovedRevisedBase(recordsAsc, index, originalContractSum);
  if (base == null || voAmount == null) return null;
  return base + voAmount;
}

export function computeVariationOrderFields(
  recordsAsc: VariationOrderCalcRecord[],
  index: number,
  originalContractSum: number | null,
  voAmount: number | null
): { voPercent: number | null; revisedContractSum: number | null } {
  return {
    voPercent: computeVoPercent(voAmount, originalContractSum),
    revisedContractSum: computeRevisedContractSum(
      recordsAsc,
      index,
      originalContractSum,
      voAmount
    ),
  };
}

export function computeAllVariationOrderFields(
  records: VariationOrderCalcRecord[],
  originalContractSum: number | null
): Map<string, { voPercent: number | null; revisedContractSum: number | null }> {
  const asc = sortVariationOrdersAsc(records);
  const result = new Map<string, { voPercent: number | null; revisedContractSum: number | null }>();
  asc.forEach((vo, index) => {
    result.set(vo.id, computeVariationOrderFields(asc, index, originalContractSum, vo.voAmount));
  });
  return result;
}
