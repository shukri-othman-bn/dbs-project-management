import { auth } from "@/lib/auth";
import { getDepartmentBudgetSummary, getCurrentFinancialYear } from "@/lib/data";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RagBadge } from "@/components/ui/badge";
import Link from "next/link";
import { SpendPieChart } from "@/components/charts/spend-pie-chart";

export default async function BudgetDashboardPage() {
  const session = await auth();
  const user = session!.user;
  const fy = await getCurrentFinancialYear();
  const { projects, totals } = await getDepartmentBudgetSummary(user);

  const utilization =
    totals.allocation > 0 ? (totals.spent / totals.allocation) * 100 : 0;
  const unspent = totals.allocation - totals.spent;

  const pieData = [
    { name: "Spent", value: totals.spent },
    { name: "Unspent", value: Math.max(0, unspent) },
  ];

  const fundingBreakdown: Record<string, { allocation: number; spent: number }> = {};
  for (const p of projects) {
    const key = p.fundingType?.name ?? "Unspecified";
    if (!fundingBreakdown[key]) fundingBreakdown[key] = { allocation: 0, spent: 0 };
    fundingBreakdown[key].allocation += p.totals.allocation;
    fundingBreakdown[key].spent += p.totals.paymentsCertified;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Budget Dashboard</h1>
        <p className="text-slate-600">
          Financial Year {fy?.label ?? "—"} — allocation vs warrant vs spending
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Total Allocation</p>
            <p className="text-2xl font-bold">{formatCurrency(totals.allocation)}</p>
          </CardContent>
        </Card>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spend vs Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendPieChart data={pieData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Funding Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {Object.entries(fundingBreakdown).map(([name, data]) => (
                <li key={name} className="flex justify-between text-sm border-b pb-2">
                  <span>{name}</span>
                  <span>
                    {formatCurrency(data.spent)} / {formatCurrency(data.allocation)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Budget Positions</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-2 pr-4">Project</th>
                <th className="pb-2 pr-4">Allocation</th>
                <th className="pb-2 pr-4">Warrant</th>
                <th className="pb-2 pr-4">Spent</th>
                <th className="pb-2 pr-4">Unspent</th>
                <th className="pb-2 pr-4">Util %</th>
                <th className="pb-2">RAG</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4">
                    <Link href={`/projects/${p.id}`} className="font-medium hover:underline">
                      {p.projectNumber}
                    </Link>
                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{p.title}</p>
                  </td>
                  <td className="py-3 pr-4">{formatCurrency(p.totals.allocation)}</td>
                  <td className="py-3 pr-4">{formatCurrency(p.totals.warrantApproved)}</td>
                  <td className="py-3 pr-4">{formatCurrency(p.totals.paymentsCertified)}</td>
                  <td className="py-3 pr-4">{formatCurrency(p.totals.unspent)}</td>
                  <td className="py-3 pr-4">{formatPercent(p.totals.utilizationPct)}</td>
                  <td className="py-3">
                    <RagBadge status={p.totals.rag} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
