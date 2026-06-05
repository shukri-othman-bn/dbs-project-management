import { auth } from "@/lib/auth";
import { getProjectsWithBudget } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { STAGE_STATUS_LABELS } from "@/lib/project-labels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportsHeader, ReportsViewPills } from "@/components/reports/reports-header";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  DesktopDataTable,
  desktopTdClass,
  desktopThClass,
  MobileCardList,
  MobileField,
  MobileRecordCard,
  ResponsiveDataView,
} from "@/components/ui/responsive-data";

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
        <CardContent className="p-0 lg:p-6">
          {tenders.length > 0 ? (
            <ResponsiveDataView
              mobile={
                <MobileCardList>
                  {tenders.map((p) => {
                    const t = p.tendering;
                    return (
                      <MobileRecordCard
                        key={p.id}
                        href={`/projects/${p.id}`}
                        title={p.projectNumber}
                        subtitle={p.title}
                      >
                        <MobileField label="Stage" value={STAGE_STATUS_LABELS[p.lifecycleStage]} />
                        <MobileField label="Tender no." value={t?.tenderNo ?? "—"} />
                        <MobileField label="Open" value={formatDate(t?.openDate)} />
                        <MobileField label="Closing" value={formatDate(t?.closingDate)} />
                        <MobileField label="Extended" value={formatDate(t?.extendedClosingDate)} />
                        <MobileField label="Approved" value={formatDate(t?.approvedDate)} />
                        <MobileField label="Awarded" value={formatDate(t?.awardedDate)} />
                        <MobileField
                          label="Remarks"
                          value={t?.adRemarks ?? t?.tenderValidityRemarks ?? "—"}
                          span={3}
                        />
                      </MobileRecordCard>
                    );
                  })}
                </MobileCardList>
              }
              desktop={
                <DesktopDataTable dense>
                  <thead>
                    <tr className="border-b">
                      <th className={desktopThClass}>Project</th>
                      <th className={desktopThClass}>Stage</th>
                      <th className={desktopThClass}>Tender no.</th>
                      <th className={desktopThClass}>Open</th>
                      <th className={desktopThClass}>Closing</th>
                      <th className={desktopThClass}>Extended</th>
                      <th className={desktopThClass}>Approved</th>
                      <th className={desktopThClass}>Awarded</th>
                      <th className={desktopThClass}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenders.map((p) => {
                      const t = p.tendering;
                      return (
                        <tr key={p.id} className="border-b border-slate-100">
                          <td className={desktopTdClass}>
                            <Link href={`/projects/${p.id}`} className="font-medium hover:underline">
                              {p.projectNumber}
                            </Link>
                            <p className="text-xs text-slate-500">{p.title}</p>
                          </td>
                          <td className={desktopTdClass}>
                            {STAGE_STATUS_LABELS[p.lifecycleStage]}
                          </td>
                          <td className={desktopTdClass}>{t?.tenderNo ?? "—"}</td>
                          <td className={desktopTdClass}>{formatDate(t?.openDate)}</td>
                          <td className={desktopTdClass}>{formatDate(t?.closingDate)}</td>
                          <td className={desktopTdClass}>
                            {formatDate(t?.extendedClosingDate)}
                          </td>
                          <td className={desktopTdClass}>{formatDate(t?.approvedDate)}</td>
                          <td className={desktopTdClass}>{formatDate(t?.awardedDate)}</td>
                          <td className={cn(desktopTdClass, "text-slate-600")}>
                            {t?.adRemarks ?? t?.tenderValidityRemarks ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </DesktopDataTable>
              }
            />
          ) : (
            <p className="px-4 py-8 text-center text-sm text-slate-500 lg:px-6">
              No projects with tendering data
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
