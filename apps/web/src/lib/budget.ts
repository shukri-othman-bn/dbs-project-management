export type RagStatus = "green" | "amber" | "red";

export interface BudgetTotals {
  allocation: number;
  warrantApproved: number;
  warrantBalance: number;
  encumbranceTotal: number;
  encumbranceBalance: number;
  paymentsApproved: number;
  paymentsCertified: number;
  utilizationPct: number;
  unspent: number;
  rag: RagStatus;
}

export function sumWarrant(lines: { type: string; amountApproved: number; amountBalance: number | null }[]) {
  const warrants = lines.filter((l) => l.type === "warrant");
  return {
    approved: warrants.reduce((s, l) => s + l.amountApproved, 0),
    balance: warrants.reduce((s, l) => s + (l.amountBalance ?? 0), 0),
  };
}

export function sumPayments(lines: { type: string; amountApproved: number; amountCertified: number | null }[]) {
  const payments = lines.filter((l) => l.type === "payment");
  return {
    approved: payments.reduce((s, l) => s + l.amountApproved, 0),
    certified: payments.reduce((s, l) => s + (l.amountCertified ?? l.amountApproved), 0),
  };
}

export function computeBudgetTotals(input: {
  allocation: number;
  encumbranceTotal: number;
  encumbranceBalance: number;
  budgetLines: { type: string; amountApproved: number; amountCertified: number | null; amountBalance: number | null }[];
  fyStart?: Date;
  fyEnd?: Date;
}): BudgetTotals {
  const { allocation, encumbranceTotal, encumbranceBalance, budgetLines, fyStart, fyEnd } = input;
  const warrant = sumWarrant(budgetLines);
  const payment = sumPayments(budgetLines);
  const paymentsCertified = payment.certified;
  const utilizationPct = allocation > 0 ? (paymentsCertified / allocation) * 100 : 0;
  const unspent = allocation - paymentsCertified;

  let rag: RagStatus = "green";
  if (allocation > 0) {
    const now = new Date();
    let fyProgress = 0.5;
    if (fyStart && fyEnd) {
      const total = fyEnd.getTime() - fyStart.getTime();
      const elapsed = now.getTime() - fyStart.getTime();
      fyProgress = total > 0 ? Math.min(1, Math.max(0, elapsed / total)) : 0.5;
    }
    const expectedSpend = fyProgress * 100;
    if (utilizationPct < expectedSpend - 25) rag = "red";
    else if (utilizationPct < expectedSpend - 10) rag = "amber";
  }

  return {
    allocation,
    warrantApproved: warrant.approved,
    warrantBalance: warrant.balance,
    encumbranceTotal,
    encumbranceBalance,
    paymentsApproved: payment.approved,
    paymentsCertified,
    utilizationPct,
    unspent,
    rag,
  };
}

export const STAGE_LABELS: Record<string, string> = {
  planning: "Feasibility Study",
  pre_contract: "Pre-Contract",
  contract: "Contract",
  ongoing: "Ongoing",
  closed: "Closed",
};

export const ROLE_LABELS: Record<string, string> = {
  DIRECTOR: "Director",
  HOS: "Head of Section",
  OFFICER: "Officer",
  PROJECT_ADMIN: "Project Admin",
  ADMIN: "Admin",
};
