import { computeDurationPercent } from "@/lib/duration-parse";
import { sortVariationOrdersAsc } from "@/lib/variation-order-calculations";

export type ExtensionOfTimeCalcRecord = {
  id: string;
  createdAt: Date | string;
  eotPeriod: string | null;
};

export const sortExtensionOfTimesAsc = sortVariationOrdersAsc;

export function computeEotPercent(
  eotPeriod: string | null,
  originalContractPeriod: string | null
): number | null {
  return computeDurationPercent(eotPeriod, originalContractPeriod);
}

export function computeExtensionOfTimeFields(
  eotPeriod: string | null,
  originalContractPeriod: string | null
): { eotPercent: number | null } {
  return {
    eotPercent: computeEotPercent(eotPeriod, originalContractPeriod),
  };
}

export function computeAllExtensionOfTimeFields(
  records: ExtensionOfTimeCalcRecord[],
  originalContractPeriod: string | null
): Map<string, { eotPercent: number | null }> {
  const asc = sortExtensionOfTimesAsc(records);
  const result = new Map<string, { eotPercent: number | null }>();
  asc.forEach((eot) => {
    result.set(eot.id, computeExtensionOfTimeFields(eot.eotPeriod, originalContractPeriod));
  });
  return result;
}
