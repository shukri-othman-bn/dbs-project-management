import { auth } from "@/lib/auth";
import { getProjectsWithBudget } from "@/lib/data";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { PROJECT_TYPE_LABELS } from "@/lib/project-labels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RagBadge, StageBadge } from "@/components/ui/badge";
import { ReportsHeader, ReportsViewPills } from "@/components/reports/reports-header";
import Link from "next/link";

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
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-2 pr-4">Number</th>
                <th className="pb-2 pr-4">Title</th>
                <th className="pb-2 pr-4">Section</th>
                <th className="pb-2 pr-4">Client</th>
                <th className="pb-2 pr-4">Stage</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">OIC</th>
                <th className="pb-2 pr-4">Physical</th>
                <th className="pb-2 pr-4">Spent / Allocation</th>
                <th className="pb-2">RAG</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <Link href={`/projects/${p.id}`} className="font-medium hover:underline">
                      {p.projectNumber}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 max-w-[200px] truncate">{p.title}</td>
                  <td className="py-3 pr-4">
                    {p.section?.unitLabel ?? p.section?.name ?? "—"}
                  </td>
                  <td className="py-3 pr-4 max-w-[140px] truncate">
                    {p.client?.ministry}
                    {p.client?.department ? ` · ${p.client.department}` : ""}
                  </td>
                  <td className="py-3 pr-4">
                    <StageBadge stage={p.lifecycleStage} />
                  </td>
                  <td className="py-3 pr-4">
                    {p.projectType ? PROJECT_TYPE_LABELS[p.projectType] : "—"}
                  </td>
                  <td className="py-3 pr-4">{p.oic?.name ?? "—"}</td>
                  <td className="py-3 pr-4">
                    {formatPercent(p.latestStatus?.physicalActual ?? 0)}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {formatCurrency(p.totals.paymentsCertified)} /{" "}
                    {formatCurrency(p.totals.allocation)}
                  </td>
                  <td className="py-3">
                    <RagBadge status={p.totals.rag} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {projects.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">No projects in scope</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
