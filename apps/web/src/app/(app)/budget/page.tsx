import { auth } from "@/lib/auth";
import { getDepartmentBudgetSummary, getCurrentFinancialYear } from "@/lib/data";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RagBadge } from "@/components/ui/badge";
import Link from "next/link";
import { SpendPieChart } from "@/components/charts/spend-pie-chart";
import { SectionBudgetChart } from "@/components/charts/section-budget-chart";
import {
  DesktopDataTable,
  desktopTdClass,
  desktopThClass,
  MobileCardList,
  MobileField,
  MobileRecordCard,
  ResponsiveDataView,
} from "@/components/ui/responsive-data";
import { getUnitLabel } from "@/lib/units";

export default async function BudgetDashboardPage() {
  const session = await auth();
  const user = session!.user;
  const fy = await getCurrentFinancialYear();
  const { projects, totals, byUnit } = await getDepartmentBudgetSummary(user);

  const utilization =
    totals.allocation > 0 ? (totals.spent / totals.allocation) * 100 : 0;
  const unspent = totals.allocation - totals.spent;

  const pieData = [
    { name: "Spent", value: totals.spent },
    { name: "Unspent", value: Math.max(0, unspent) },
  ];

  const unitChartData = byUnit.map((row) => ({
    section: row.unit,
    allocation: row.allocation,
    spent: row.spent,
  }));

  const fundingBreakdown: Record<string, { allocation: number; spent: number }> = {};
  for (const p of projects) {
    const key = p.fundingType?.name ?? "Unspecified";
    if (!fundingBreakdown[key]) fundingBreakdown[key] = { allocation: 0, spent: 0 };
    fundingBreakdown[key].allocation += p.totals.allocation;
    fundingBreakdown[key].spent += p.totals.paymentsCertified;
  }

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
        <h1 className="text-2xl font-bold text-slate-900">Budget Dashboard</h1>
        <p className="text-slate-600">
          Financial Year {fy?.label ?? "—"} — allocation vs warrant vs spending by unit
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

      <Card>
        <CardHeader>
          <CardTitle>Budget by Unit</CardTitle>
          <p className="text-sm text-slate-500">
            Unit allocation and certified spend · {formatCurrency(unitTotals.allocation)} allocated across{" "}
            {byUnit.length} unit{byUnit.length === 1 ? "" : "s"}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {unitChartData.length > 0 && <SectionBudgetChart data={unitChartData} />}
          <ResponsiveDataView
            mobile={
              <MobileCardList>
                {byUnit.map((row) => (
                  <MobileRecordCard key={row.code} title={row.unit} subtitle={row.leadOfficer ?? "No lead officer"}>
                    <MobileField label="Allocation" value={formatCurrency(row.allocation)} />
                    <MobileField label="Spent" value={formatCurrency(row.spent)} />
                    <MobileField label="Util %" value={formatPercent(row.utilizationPct)} />
                  </MobileRecordCard>
                ))}
              </MobileCardList>
            }
            desktop={
              <DesktopDataTable>
                <thead>
                  <tr className="border-b">
                    <th className={desktopThClass}>Unit</th>
                    <th className={desktopThClass}>Lead Officer</th>
                    <th className={desktopThClass}>Allocation</th>
                    <th className={desktopThClass}>Spent</th>
                    <th className={desktopThClass}>Unspent</th>
                    <th className={desktopThClass}>Util %</th>
                  </tr>
                </thead>
                <tbody>
                  {byUnit.map((row) => (
                    <tr key={row.code} className="border-b border-slate-100">
                      <td className={desktopTdClass}>
                        <span className="font-medium">{row.unit}</span>
                      </td>
                      <td className={desktopTdClass}>{row.leadOfficer ?? "—"}</td>
                      <td className={desktopTdClass}>{formatCurrency(row.allocation)}</td>
                      <td className={desktopTdClass}>{formatCurrency(row.spent)}</td>
                      <td className={desktopTdClass}>
                        {formatCurrency(Math.max(0, row.allocation - row.spent))}
                      </td>
                      <td className={desktopTdClass}>{formatPercent(row.utilizationPct)}</td>
                    </tr>
                  ))}
                </tbody>
              </DesktopDataTable>
            }
          />
        </CardContent>
      </Card>

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
        <CardContent className="p-0 lg:p-6">
          <ResponsiveDataView
            mobile={
              <MobileCardList>
                {projects.map((p) => (
                  <MobileRecordCard
                    key={p.id}
                    href={`/projects/${p.id}`}
                    title={p.projectNumber}
                    subtitle={p.title}
                  >
                    <MobileField label="Unit" value={getUnitLabel(p.section) ?? "—"} />
                    <MobileField label="Allocation" value={formatCurrency(p.totals.allocation)} />
                    <MobileField label="Warrant" value={formatCurrency(p.totals.warrantApproved)} />
                    <MobileField label="Spent" value={formatCurrency(p.totals.paymentsCertified)} />
                    <MobileField label="Unspent" value={formatCurrency(p.totals.unspent)} />
                    <MobileField label="Util %" value={formatPercent(p.totals.utilizationPct)} />
                    <MobileField label="RAG" value={<RagBadge status={p.totals.rag} />} />
                  </MobileRecordCard>
                ))}
              </MobileCardList>
            }
            desktop={
              <DesktopDataTable>
                <thead>
                  <tr className="border-b">
                    <th className={desktopThClass}>Project</th>
                    <th className={desktopThClass}>Unit</th>
                    <th className={desktopThClass}>Allocation</th>
                    <th className={desktopThClass}>Warrant</th>
                    <th className={desktopThClass}>Spent</th>
                    <th className={desktopThClass}>Unspent</th>
                    <th className={desktopThClass}>Util %</th>
                    <th className={desktopThClass}>RAG</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100">
                      <td className={desktopTdClass}>
                        <Link href={`/projects/${p.id}`} className="font-medium hover:underline">
                          {p.projectNumber}
                        </Link>
                        <p className="text-xs text-slate-500">{p.title}</p>
                      </td>
                      <td className={desktopTdClass}>{getUnitLabel(p.section) ?? "—"}</td>
                      <td className={desktopTdClass}>{formatCurrency(p.totals.allocation)}</td>
                      <td className={desktopTdClass}>{formatCurrency(p.totals.warrantApproved)}</td>
                      <td className={desktopTdClass}>{formatCurrency(p.totals.paymentsCertified)}</td>
                      <td className={desktopTdClass}>{formatCurrency(p.totals.unspent)}</td>
                      <td className={desktopTdClass}>{formatPercent(p.totals.utilizationPct)}</td>
                      <td className={desktopTdClass}>
                        <RagBadge status={p.totals.rag} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DesktopDataTable>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
