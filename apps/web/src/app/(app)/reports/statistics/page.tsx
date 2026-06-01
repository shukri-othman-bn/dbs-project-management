import { auth } from "@/lib/auth";
import { getDepartmentBudgetSummary, getProjectsWithBudget, getCurrentFinancialYear } from "@/lib/data";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { STAGE_LABELS } from "@/lib/budget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportsHeader, ReportsViewPills } from "@/components/reports/reports-header";
import { SectionBudgetChart } from "@/components/charts/section-budget-chart";

export default async function StatisticsReportPage() {
  const session = await auth();
  const user = session!.user;
  const fy = await getCurrentFinancialYear();
  const projects = await getProjectsWithBudget(user);
  const { totals, bySection } = await getDepartmentBudgetSummary(user);

  const activeCount = projects.filter((p) => p.lifecycleStage !== "closed").length;
  const needsAction = projects.filter(
    (p) => p.latestStatus?.actionsRequired || p.toMonitor
  ).length;
  const byStage = Object.entries(STAGE_LABELS).map(([key, label]) => ({
    stage: label,
    count: projects.filter((p) => p.lifecycleStage === key).length,
  }));

  const chartData = Object.entries(bySection).map(([section, items]) => ({
    section: section.replace("Section ", "Sec "),
    allocation: items.reduce((s, p) => s + p.totals.allocation, 0),
    spent: items.reduce((s, p) => s + p.totals.paymentsCertified, 0),
  }));

  const byType: Record<string, number> = {};
  for (const p of projects) {
    const key = p.projectType ?? "unspecified";
    byType[key] = (byType[key] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <ReportsHeader view="statistics" />
      <ReportsViewPills active="statistics" />

      <p className="text-sm text-slate-500">
        Financial year {fy?.label ?? "—"} · {projects.length} projects in scope
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Active Projects</p>
            <p className="text-3xl font-bold">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Needs Attention</p>
            <p className="text-3xl font-bold text-amber-600">{needsAction}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">FY Allocation</p>
            <p className="text-2xl font-bold">{formatCurrency(totals.allocation)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">FY Spent (Certified)</p>
            <p className="text-2xl font-bold">{formatCurrency(totals.spent)}</p>
            <p className="text-xs text-slate-500">
              {totals.allocation > 0
                ? formatPercent((totals.spent / totals.allocation) * 100)
                : "0%"}{" "}
              utilization
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Projects by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {byStage.map((s) => (
                <li key={s.stage} className="flex justify-between text-sm">
                  <span>{s.stage}</span>
                  <span className="font-semibold">{s.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {Object.entries(byType).map(([type, count]) => (
                <li key={type} className="flex justify-between text-sm">
                  <span className="capitalize">{type.replace(/_/g, " ")}</span>
                  <span className="font-semibold">{count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget by Section</CardTitle>
          </CardHeader>
          <CardContent>
            <SectionBudgetChart data={chartData} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
