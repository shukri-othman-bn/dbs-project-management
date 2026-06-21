import { auth } from "@/lib/auth";
import { getDepartmentBudgetSummary, getCurrentFinancialYear } from "@/lib/data";
import { canEditBudgetAllocation } from "@/lib/permissions";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FundingTypeAllocationPie } from "@/components/charts/funding-type-allocation-pie";
import { FundingTypeBudgetCard } from "@/components/budget/funding-type-budget-card";
import {
  UnitBudgetByFundingTypeChart,
  UnitBudgetFundingTypeTable,
} from "@/components/budget/unit-budget-funding-type-breakdown";

export default async function BudgetDashboardPage() {
  const session = await auth();
  const user = session!.user;
  const fy = await getCurrentFinancialYear();
  const canEdit = canEditBudgetAllocation(user);
  const { totals, byUnit, byFundingType } = await getDepartmentBudgetSummary(user);

  const utilization =
    totals.allocation > 0 ? (totals.spent / totals.allocation) * 100 : 0;
  const unspent = totals.allocation - totals.spent;

  const unitTotals = byUnit.reduce(
    (acc, row) => ({
      allocation: acc.allocation + row.allocation,
      spent: acc.spent + row.spent,
    }),
    { allocation: 0, spent: 0 }
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Budget</h1>
        <p className="text-slate-600">
          Financial Year {fy?.label ?? "—"} — department budget by funding type (2105–2113)
        </p>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Department overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-500">Amount approved</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.allocation)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-500">Encumbrance amount</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.encumbranceTotal)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-500">Encumbrance balance</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.encumbranceBalance)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-500">Balance Allocation</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.balanceAllocation)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Allocation by funding type</CardTitle>
          <p className="text-sm text-slate-500">
            Amount approved and breakdown by encumbrance amount, encumbrance balance, and balance
            allocation for each funding type
          </p>
        </CardHeader>
        <CardContent>
          <FundingTypeAllocationPie rows={byFundingType} />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Budget by funding type</h2>
        {canEdit && (
          <p className="mb-4 text-sm text-slate-600">
            As Project Admin, enter amount approved on each card, then save to lock that
            funding type budget for the financial year. Encumbrance amount is calculated
            automatically from PO amounts where a PO ID has been assigned on projects.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {byFundingType.map((row) => (
            <FundingTypeBudgetCard
              key={row.code}
              row={row}
              canEdit={canEdit}
              financialYearId={fy?.id}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Warrant Approved</p>
            <p className="text-2xl font-bold">{formatCurrency(totals.warrant)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Payments Certified</p>
            <p className="text-2xl font-bold">{formatCurrency(totals.spent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Utilization</p>
            <p className="text-2xl font-bold">{formatPercent(utilization)}</p>
            <p className="text-xs text-slate-500">Unspent: {formatCurrency(unspent)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget by Unit</CardTitle>
          <p className="text-sm text-slate-500">
            Unit allocation by funding type is derived from each funding type&apos;s amount approved,
            split across units by project activity under that type. Totals per funding type match
            the department budget · {formatCurrency(unitTotals.allocation)} allocated across{" "}
            {byUnit.length} unit{byUnit.length === 1 ? "" : "s"}.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {byUnit.length > 0 && <UnitBudgetByFundingTypeChart units={byUnit} />}
          <UnitBudgetFundingTypeTable units={byUnit} />
        </CardContent>
      </Card>
    </div>
  );
}
