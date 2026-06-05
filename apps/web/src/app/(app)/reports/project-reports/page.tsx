import { auth } from "@/lib/auth";
import { getProjectsWithBudget } from "@/lib/data";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { PROJECT_TYPE_LABELS } from "@/lib/project-labels";
import { getUnitLabel } from "@/lib/units";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RagBadge, StageBadge } from "@/components/ui/badge";
import { ReportsHeader, ReportsViewPills } from "@/components/reports/reports-header";
import Link from "next/link";
import {
  DesktopDataTable,
  desktopTdClass,
  desktopThClass,
  MobileCardList,
  MobileField,
  MobileRecordCard,
  ResponsiveDataView,
} from "@/components/ui/responsive-data";

export default async function ProjectReportsPage() {
  const session = await auth();
  const user = session!.user;
  const projects = await getProjectsWithBudget(user);

  return (
    <div className="space-y-6">
      <ReportsHeader view="project-reports" />
      <ReportsViewPills active="project-reports" />

      <Card>
        <CardHeader>
          <CardTitle>All Projects ({projects.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 lg:p-6">
          {projects.length > 0 ? (
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
                      <MobileField
                        label="Section"
                        value={getUnitLabel(p.section) ?? "—"}
                      />
                      <MobileField
                        label="Client"
                        value={
                          <>
                            {p.client?.ministry}
                            {p.client?.department ? ` · ${p.client.department}` : ""}
                          </>
                        }
                        span={3}
                      />
                      <MobileField label="Stage" value={<StageBadge stage={p.lifecycleStage} />} />
                      <MobileField
                        label="Type"
                        value={p.projectType ? PROJECT_TYPE_LABELS[p.projectType] : "—"}
                      />
                      <MobileField label="OIC" value={p.oic?.name ?? "—"} />
                      <MobileField
                        label="Physical"
                        value={formatPercent(p.latestStatus?.physicalActual ?? 0)}
                      />
                      <MobileField
                        label="Spent / Allocation"
                        value={`${formatCurrency(p.totals.paymentsCertified)} / ${formatCurrency(p.totals.allocation)}`}
                      />
                      <MobileField label="RAG" value={<RagBadge status={p.totals.rag} />} />
                    </MobileRecordCard>
                  ))}
                </MobileCardList>
              }
              desktop={
                <DesktopDataTable dense>
                  <thead>
                    <tr className="border-b">
                      <th className={desktopThClass}>Number</th>
                      <th className={desktopThClass}>Title</th>
                      <th className={desktopThClass}>Section</th>
                      <th className={desktopThClass}>Client</th>
                      <th className={desktopThClass}>Stage</th>
                      <th className={desktopThClass}>Type</th>
                      <th className={desktopThClass}>OIC</th>
                      <th className={desktopThClass}>Physical</th>
                      <th className={desktopThClass}>Spent / Allocation</th>
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
                        </td>
                        <td className={desktopTdClass}>{p.title}</td>
                        <td className={desktopTdClass}>
                          {getUnitLabel(p.section) ?? "—"}
                        </td>
                        <td className={desktopTdClass}>
                          {p.client?.ministry}
                          {p.client?.department ? ` · ${p.client.department}` : ""}
                        </td>
                        <td className={desktopTdClass}>
                          <StageBadge stage={p.lifecycleStage} />
                        </td>
                        <td className={desktopTdClass}>
                          {p.projectType ? PROJECT_TYPE_LABELS[p.projectType] : "—"}
                        </td>
                        <td className={desktopTdClass}>{p.oic?.name ?? "—"}</td>
                        <td className={desktopTdClass}>
                          {formatPercent(p.latestStatus?.physicalActual ?? 0)}
                        </td>
                        <td className={desktopTdClass}>
                          {formatCurrency(p.totals.paymentsCertified)} /{" "}
                          {formatCurrency(p.totals.allocation)}
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
          ) : (
            <p className="px-4 py-8 text-center text-sm text-slate-500 lg:px-6">
              No projects in scope
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
