import { auth } from "@/lib/auth";
import { getProjectsWithBudget } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { STAGE_STATUS_LABELS } from "@/lib/project-labels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportsHeader, ReportsViewPills } from "@/components/reports/reports-header";
import Link from "next/link";

function hasTenderData(p: Awaited<ReturnType<typeof getProjectsWithBudget>>[number]) {
  const t = p.tendering;
  return Boolean(
    t?.tenderNo ||
      t?.openDate ||
      t?.closingDate ||
      t?.extendedClosingDate ||
      t?.approvedDate ||
      t?.awardedDate
  );
}

export default async function TenderStatusReportPage() {
  const session = await auth();
  const user = session!.user;
  const all = await getProjectsWithBudget(user);
  const tenders = all.filter(hasTenderData).sort((a, b) => {
    const aClose = a.tendering?.closingDate?.getTime() ?? 0;
    const bClose = b.tendering?.closingDate?.getTime() ?? 0;
    return bClose - aClose;
  });

  const openCount = tenders.filter(
    (p) => p.lifecycleStage === "pre_contract" && !p.tendering?.awardedDate
  ).length;
  const awardedCount = tenders.filter((p) => p.tendering?.awardedDate).length;

  return (
    <div className="space-y-6">
      <ReportsHeader view="tender-status" />
      <ReportsViewPills active="tender-status" />

      <div className="grid gap-4 sm:grid-cols-3 max-w-xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">With tender records</p>
            <p className="text-3xl font-bold">{tenders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Pre-contract (not awarded)</p>
            <p className="text-3xl font-bold">{openCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Awarded</p>
            <p className="text-3xl font-bold">{awardedCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tender Register</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-2 pr-4">Project</th>
                <th className="pb-2 pr-4">Stage</th>
                <th className="pb-2 pr-4">Tender no.</th>
                <th className="pb-2 pr-4">Open</th>
                <th className="pb-2 pr-4">Closing</th>
                <th className="pb-2 pr-4">Extended</th>
                <th className="pb-2 pr-4">Approved</th>
                <th className="pb-2 pr-4">Awarded</th>
                <th className="pb-2 pr-4">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {tenders.map((p) => {
                const t = p.tendering;
                return (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      <Link href={`/projects/${p.id}`} className="font-medium hover:underline">
                        {p.projectNumber}
                      </Link>
                      <p className="text-xs text-slate-500 truncate max-w-[180px]">{p.title}</p>
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {STAGE_STATUS_LABELS[p.lifecycleStage]}
                    </td>
                    <td className="py-3 pr-4">{t?.tenderNo ?? "—"}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">{formatDate(t?.openDate)}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">{formatDate(t?.closingDate)}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {formatDate(t?.extendedClosingDate)}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">{formatDate(t?.approvedDate)}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">{formatDate(t?.awardedDate)}</td>
                    <td className="py-3 pr-4 max-w-[200px] truncate text-slate-600">
                      {t?.adRemarks ?? t?.tenderValidityRemarks ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {tenders.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              No projects with tendering data
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
