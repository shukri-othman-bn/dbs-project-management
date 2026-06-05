import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDepartmentBudgetSummary, getProjectsWithBudget } from "@/lib/data";

export const dynamic = "force-dynamic";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RagBadge } from "@/components/ui/badge";
import { STAGE_LABELS } from "@/lib/budget";
import {
  computeDashboardMetrics,
  DASHBOARD_METRIC_DEFINITIONS,
} from "@/lib/dashboard-metrics";
import Link from "next/link";
import { getUnitLabel } from "@/lib/units";
import { collectUpcomingDates, formatUpcomingDatesPeriod } from "@/lib/upcoming-dates";
import { SectionBudgetChart } from "@/components/charts/section-budget-chart";
import { SummaryMetricCard } from "@/components/dashboard/summary-metric-card";
import {
  DesktopDataTable,
  desktopTdClass,
  desktopThClass,
  MobileCardList,
  MobileField,
  MobileRecordCard,
  ResponsiveDataView,
} from "@/components/ui/responsive-data";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user;
  const projects = await getProjectsWithBudget(user);
  const { totals, byUnit } = await getDepartmentBudgetSummary(user);
  const { activeCount, needsAttentionCount, needsAttentionProjects } =
    computeDashboardMetrics(projects);

  const byStage = Object.entries(STAGE_LABELS).map(([key, label]) => ({
    stage: label,
    count: projects.filter((p) => p.lifecycleStage === key).length,
  }));

  const chartData = byUnit.map((row) => ({
    section: row.unit,
    allocation: row.allocation,
    spent: row.spent,
  }));

  const isDirector = user.role === "DIRECTOR" || user.role === "ADMIN";
  const upcomingDates = collectUpcomingDates(projects);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isDirector ? "Department Overview" : "My Dashboard"}
        </h1>
        <p className="text-slate-600">
          Portfolio status and financial year budget performance
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryMetricCard
          label="Active Projects"
          definition={DASHBOARD_METRIC_DEFINITIONS.activeProjects}
          value={activeCount}
        />
        <SummaryMetricCard
          label="Needs Attention"
          definition={DASHBOARD_METRIC_DEFINITIONS.needsAttention}
          value={needsAttentionCount}
          valueClassName="text-amber-600"
        />
        <SummaryMetricCard
          label="FY Allocation"
          value={formatCurrency(totals.allocation)}
        />
        <SummaryMetricCard
          label="FY Spent (Certified)"
          value={formatCurrency(totals.spent)}
          footer={
            <p className="text-xs text-slate-500">
              {totals.allocation > 0
                ? formatPercent((totals.spent / totals.allocation) * 100)
                : "0%"}{" "}
              utilization
            </p>
          }
        />
      </div>

      {isDirector && chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget by Unit</CardTitle>
          </CardHeader>
          <CardContent>
            <SectionBudgetChart data={chartData} />
          </CardContent>
        </Card>
      )}

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
            <CardTitle>Needs Attention</CardTitle>
          </CardHeader>
          <CardContent>
            {needsAttentionProjects.length === 0 ? (
              <p className="text-sm text-slate-500">No projects behind FY spend pace</p>
            ) : (
              <ul className="space-y-3">
                {needsAttentionProjects.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/projects/${p.id}`}
                        className="font-medium text-slate-800 hover:underline"
                      >
                        {p.projectNumber}
                      </Link>
                      <p className="text-xs text-slate-600 line-clamp-2">{p.title}</p>
                      <p className="text-xs text-slate-500">
                        {getUnitLabel(p.section) ?? "Unassigned"} ·{" "}
                        {formatPercent(p.totals.utilizationPct)} spent
                      </p>
                    </div>
                    <RagBadge status={p.totals.rag} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Dates</CardTitle>
          <p className="text-sm text-slate-500">
            Open tender, close tender, and completion dates · {formatUpcomingDatesPeriod()}
          </p>
        </CardHeader>
        <CardContent className="p-0 lg:p-6">
          {upcomingDates.length === 0 ? (
            <p className="px-6 py-4 text-sm text-slate-500 lg:px-0">
              No upcoming dates this month or next month
            </p>
          ) : (
            <ResponsiveDataView
              mobile={
                <MobileCardList>
                  {upcomingDates.map((row) => (
                    <MobileRecordCard
                      key={`${row.projectId}-${row.type}`}
                      href={`/projects/${row.projectId}`}
                      title={row.projectNumber}
                      subtitle={row.title}
                    >
                      <MobileField label="Milestone" value={row.label} />
                      <MobileField label="Date" value={formatDate(row.date)} />
                      <MobileField label="Unit" value={row.unit ?? "—"} />
                    </MobileRecordCard>
                  ))}
                </MobileCardList>
              }
              desktop={
                <DesktopDataTable>
                  <thead>
                    <tr className="border-b">
                      <th className={desktopThClass}>Date</th>
                      <th className={desktopThClass}>Milestone</th>
                      <th className={desktopThClass}>Project</th>
                      <th className={desktopThClass}>Title</th>
                      <th className={desktopThClass}>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingDates.map((row) => (
                      <tr key={`${row.projectId}-${row.type}`} className="border-b border-slate-100">
                        <td className={desktopTdClass}>{formatDate(row.date)}</td>
                        <td className={desktopTdClass}>{row.label}</td>
                        <td className={desktopTdClass}>
                          <Link
                            href={`/projects/${row.projectId}`}
                            className="font-medium hover:underline"
                          >
                            {row.projectNumber}
                          </Link>
                        </td>
                        <td className={desktopTdClass}>{row.title}</td>
                        <td className={desktopTdClass}>{row.unit ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </DesktopDataTable>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
