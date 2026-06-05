import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDepartmentBudgetSummary, getProjectsWithBudget } from "@/lib/data";

export const dynamic = "force-dynamic";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RagBadge, StageBadge } from "@/components/ui/badge";
import { STAGE_LABELS } from "@/lib/budget";
import Link from "next/link";
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

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user;
  const projects = await getProjectsWithBudget(user);
  const { totals, bySection } = await getDepartmentBudgetSummary(user);

  const needsAction = projects.filter(
    (p) => p.latestStatus?.actionsRequired || p.toMonitor
  );
  const byStage = Object.entries(STAGE_LABELS).map(([key, label]) => ({
    stage: label,
    count: projects.filter((p) => p.lifecycleStage === key).length,
  }));

  const chartData = Object.entries(bySection).map(([section, items]) => ({
    section: section.replace("Section ", "Sec "),
    allocation: items.reduce((s, p) => s + p.totals.allocation, 0),
    spent: items.reduce((s, p) => s + p.totals.paymentsCertified, 0),
  }));

  const isDirector = user.role === "DIRECTOR" || user.role === "ADMIN";

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
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Active Projects</p>
            <p className="text-3xl font-bold">
              {projects.filter((p) => p.lifecycleStage !== "closed").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Needs Attention</p>
            <p className="text-3xl font-bold text-amber-600">{needsAction.length}</p>
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

      {isDirector && chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget by Section</CardTitle>
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
            <CardTitle>Requires Action</CardTitle>
          </CardHeader>
          <CardContent>
            {needsAction.length === 0 ? (
              <p className="text-sm text-slate-500">No flagged projects</p>
            ) : (
              <ul className="space-y-3">
                {needsAction.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    <Link href={`/projects/${p.id}`} className="font-medium text-slate-800 hover:underline">
                      {p.projectNumber}
                    </Link>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {p.latestStatus?.actionsRequired || "Marked for monitoring"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent className="p-0 lg:p-6">
          <ResponsiveDataView
            mobile={
              <MobileCardList>
                {projects.slice(0, 10).map((p) => (
                  <MobileRecordCard
                    key={p.id}
                    href={`/projects/${p.id}`}
                    title={p.projectNumber}
                    subtitle={p.title}
                  >
                    <MobileField label="Stage" value={<StageBadge stage={p.lifecycleStage} />} />
                    <MobileField
                      label="Physical"
                      value={formatPercent(p.latestStatus?.physicalActual ?? 0)}
                    />
                    <MobileField
                      label="Budget"
                      value={`${formatCurrency(p.totals.paymentsCertified)} / ${formatCurrency(p.totals.allocation)}`}
                    />
                    <MobileField label="RAG" value={<RagBadge status={p.totals.rag} />} />
                  </MobileRecordCard>
                ))}
              </MobileCardList>
            }
            desktop={
              <DesktopDataTable>
                <thead>
                  <tr className="border-b">
                    <th className={desktopThClass}>Number</th>
                    <th className={desktopThClass}>Title</th>
                    <th className={desktopThClass}>Stage</th>
                    <th className={desktopThClass}>Physical</th>
                    <th className={desktopThClass}>Budget</th>
                    <th className={desktopThClass}>RAG</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.slice(0, 10).map((p) => (
                    <tr key={p.id} className="border-b border-slate-100">
                      <td className={desktopTdClass}>
                        <Link href={`/projects/${p.id}`} className="font-medium hover:underline">
                          {p.projectNumber}
                        </Link>
                      </td>
                      <td className={desktopTdClass}>{p.title}</td>
                      <td className={desktopTdClass}>
                        <StageBadge stage={p.lifecycleStage} />
                      </td>
                      <td className={desktopTdClass}>
                        {formatPercent(p.latestStatus?.physicalActual ?? 0)}
                      </td>
                      <td className={desktopTdClass}>
                        {formatCurrency(p.totals.paymentsCertified)} / {formatCurrency(p.totals.allocation)}
                      </td>
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
