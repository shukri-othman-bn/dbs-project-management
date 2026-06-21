import { auth } from "@/lib/auth";
import { getDepartmentBudgetSummary, getCurrentFinancialYear } from "@/lib/data";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RagBadge } from "@/components/ui/badge";
import { ReportsHeader, ReportsViewPills } from "@/components/reports/reports-header";
import { SpendPieChart } from "@/components/charts/spend-pie-chart";
import { fundingTypeLabel } from "@/lib/funding-types";
import Link from "next/link";
import { getUnitLabel } from "@/lib/units";
import {
  DesktopDataTable,
  desktopTdClass,
  desktopThClass,
  MobileCardList,
  MobileField,
  MobileRecordCard,
  ResponsiveDataView,
} from "@/components/ui/responsive-data";

export default async function ExpenditureReportPage() {
  const session = await auth();
  const user = session!.user;
  const fy = await getCurrentFinancialYear();
  const { projects, totals, byFundingType } = await getDepartmentBudgetSummary(user);

  const utilization =
    totals.allocation > 0 ? (totals.spent / totals.allocation) * 100 : 0;
  const unspent = totals.allocation - totals.spent;

  const pieData = [
    { name: "Spent", value: totals.spent },
    { name: "Unspent", value: Math.max(0, unspent) },
  ];

  const fundingBreakdown = byFundingType;

  return (
    <div className="space-y-6">
      <ReportsHeader view="expenditure" />
      <ReportsViewPills active="expenditure" />

      <p className="text-sm text-slate-500">Financial year {fy?.label ?? "—"}</p>

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
            <CardTitle>Expenditure by Funding Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {fundingBreakdown.map((row) => (
                <li key={row.code} className="flex justify-between gap-4 text-sm border-b pb-2">
                  <span>
                    {row.code} · {fundingTypeLabel(row.name)}
                  </span>
                  <span className="text-right">
                    {formatCurrency(row.spent)} / {formatCurrency(row.amountApproved)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expenditure by Project</CardTitle>
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
                    <MobileField label="Funding" value={p.fundingType?.name ?? "—"} />
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
              <DesktopDataTable dense>
                <thead>
                  <tr className="border-b">
                    <th className={desktopThClass}>Project</th>
                    <th className={desktopThClass}>Unit</th>
                    <th className={desktopThClass}>Funding</th>
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
                      <td className={desktopTdClass}>{p.fundingType?.name ?? "—"}</td>
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
