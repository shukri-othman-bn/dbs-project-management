import type { ContractMatterEotRow, ContractMatterVariationOrderRow } from "./contract-matters-filters";

export const VO_EOT_TABS = [
  { id: "variation-order", label: "Variation Order" },
  { id: "extension-of-time", label: "Extension of Time" },
] as const;

export type VoEotTabId = (typeof VO_EOT_TABS)[number]["id"];

export const DEFAULT_VO_EOT_TAB: VoEotTabId = "variation-order";

export function getVoEotTabLabel(tab: VoEotTabId) {
  return VO_EOT_TABS.find((t) => t.id === tab)?.label ?? tab;
}

export function countVoEotByTab(
  variationOrders: ContractMatterVariationOrderRow[],
  extensionOfTimes: ContractMatterEotRow[]
) {
  return {
    "variation-order": variationOrders.length,
    "extension-of-time": extensionOfTimes.length,
  } satisfies Record<VoEotTabId, number>;
}
