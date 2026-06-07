import type { ContractMatterJobOrderRow, ContractMatterLineRow } from "./contract-matters-filters";

export const JO_PAYMENT_VALUATION_TABS = [
  { id: "job-order", label: "Job Order" },
  { id: "payment-valuation", label: "Payment Valuation" },
] as const;

export type JoPaymentValuationTabId = (typeof JO_PAYMENT_VALUATION_TABS)[number]["id"];

export const DEFAULT_JO_PAYMENT_VALUATION_TAB: JoPaymentValuationTabId = "job-order";

export function getJoPaymentValuationTabLabel(tab: JoPaymentValuationTabId) {
  return JO_PAYMENT_VALUATION_TABS.find((t) => t.id === tab)?.label ?? tab;
}

export function countJoPaymentValuationByTab(
  jobOrders: ContractMatterJobOrderRow[],
  paymentLines: ContractMatterLineRow[]
) {
  return {
    "job-order": jobOrders.length,
    "payment-valuation": paymentLines.length,
  } satisfies Record<JoPaymentValuationTabId, number>;
}
