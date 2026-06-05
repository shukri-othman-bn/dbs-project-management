"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSaveActions, useFormDirty } from "@/components/ui/form-save-actions";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  DesktopDataTable,
  desktopTdClass,
  desktopThClass,
  MobileCardList,
  MobileField,
  MobileRecordCard,
  ResponsiveDataView,
} from "@/components/ui/responsive-data";
import type { BudgetTotals } from "@/lib/budget";

type BudgetLine = {
  id: string;
  type: string;
  date: Date | null;
  description: string | null;
  amountApproved: number;
  amountCertified: number | null;
  amountBalance: number | null;
  voucherRef: string | null;
};

export function BudgetPanel({
  projectId,
  financialYearId,
  totals,
  allocation,
  encumbranceTotal,
  encumbranceBalance,
  lines,
  canEdit,
}: {
  projectId: string;
  financialYearId?: string;
  totals: BudgetTotals;
  allocation: number;
  encumbranceTotal: number;
  encumbranceBalance: number;
  lines: BudgetLine[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [lineLoading, setLineLoading] = useState(false);
  const [summaryMessage, setSummaryMessage] = useState("");
  const [lineMessage, setLineMessage] = useState("");
  const [lineType, setLineType] = useState<"warrant" | "payment">("warrant");
  const summaryDirty = useFormDirty();
  const lineDirty = useFormDirty();
  const summaryFormId = `budget-summary-${projectId}`;
  const lineFormId = `budget-line-${projectId}`;

  async function saveAllocation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSummaryLoading(true);
    setSummaryMessage("");
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/projects/${projectId}/budget`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        allocation: parseFloat(form.get("allocation") as string) || 0,
        encumbranceTotal: parseFloat(form.get("encumbranceTotal") as string) || 0,
        encumbranceBalance: parseFloat(form.get("encumbranceBalance") as string) || 0,
        financialYearId,
      }),
    });
    setSummaryLoading(false);
    if (res.ok) {
      setSummaryMessage("Saved");
      summaryDirty.resetDirty();
      router.refresh();
    } else {
      setSummaryMessage("Failed to save");
    }
  }

  async function addLine(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLineLoading(true);
    setLineMessage("");
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/projects/${projectId}/budget/lines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: lineType,
        financialYearId,
        date: form.get("date"),
        description: form.get("description"),
        amountApproved: parseFloat(form.get("amountApproved") as string) || 0,
        amountCertified: form.get("amountCertified")
          ? parseFloat(form.get("amountCertified") as string)
          : null,
        amountBalance: form.get("amountBalance")
          ? parseFloat(form.get("amountBalance") as string)
          : null,
        voucherRef: form.get("voucherRef"),
      }),
    });
    setLineLoading(false);
    if (res.ok) {
      setLineMessage("Saved");
      lineDirty.resetDirty();
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } else {
      setLineMessage("Failed to save");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Allocation</p>
            <p className="text-lg font-bold">{formatCurrency(totals.allocation)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Warrant</p>
            <p className="text-lg font-bold">{formatCurrency(totals.warrantApproved)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Spent</p>
            <p className="text-lg font-bold">{formatCurrency(totals.paymentsCertified)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Unspent</p>
            <p className="text-lg font-bold">{formatCurrency(totals.unspent)}</p>
          </CardContent>
        </Card>
      </div>

      {canEdit && financialYearId && (
        <>
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <CardTitle>FY Budget Summary</CardTitle>
              <FormSaveActions
                formId={summaryFormId}
                loading={summaryLoading}
                message={summaryMessage}
                dirty={summaryDirty.dirty}
              />
            </CardHeader>
            <CardContent>
              <form
                id={summaryFormId}
                onSubmit={saveAllocation}
                className="grid gap-4 sm:grid-cols-3"
                {...summaryDirty.formTrackProps}
              >
                <div>
                  <Label>Allocation</Label>
                  <Input name="allocation" type="number" defaultValue={allocation} />
                </div>
                <div>
                  <Label>Encumbrance Total</Label>
                  <Input name="encumbranceTotal" type="number" defaultValue={encumbranceTotal} />
                </div>
                <div>
                  <Label>Encumbrance Balance</Label>
                  <Input name="encumbranceBalance" type="number" defaultValue={encumbranceBalance} />
                </div>
                <div className="sm:col-span-full">
                  <FormSaveActions
                    loading={summaryLoading}
                    message={summaryMessage}
                    dirty={summaryDirty.dirty}
                  />
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <CardTitle>Add Budget Line</CardTitle>
              <FormSaveActions
                formId={lineFormId}
                loading={lineLoading}
                message={lineMessage}
                dirty={lineDirty.dirty}
              />
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={lineType === "warrant" ? "primary" : "secondary"}
                  onClick={() => setLineType("warrant")}
                >
                  Warrant
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={lineType === "payment" ? "primary" : "secondary"}
                  onClick={() => setLineType("payment")}
                >
                  Payment
                </Button>
              </div>
              <form
                id={lineFormId}
                onSubmit={addLine}
                className="grid gap-4 sm:grid-cols-2"
                {...lineDirty.formTrackProps}
              >
                <div>
                  <Label>Date</Label>
                  <Input name="date" type="date" />
                </div>
                <div>
                  <Label>Amount Approved</Label>
                  <Input name="amountApproved" type="number" required />
                </div>
                {lineType === "payment" && (
                  <div>
                    <Label>Amount Certified</Label>
                    <Input name="amountCertified" type="number" />
                  </div>
                )}
                {lineType === "warrant" && (
                  <div>
                    <Label>Balance</Label>
                    <Input name="amountBalance" type="number" />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  <Input name="description" />
                </div>
                {lineType === "payment" && (
                  <div>
                    <Label>Voucher Ref</Label>
                    <Input name="voucherRef" />
                  </div>
                )}
                <div className="sm:col-span-full">
                  <FormSaveActions
                    loading={lineLoading}
                    message={lineMessage}
                    dirty={lineDirty.dirty}
                  />
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Budget Lines</CardTitle>
        </CardHeader>
        <CardContent className="p-0 lg:p-6">
          <ResponsiveDataView
            mobile={
              <MobileCardList>
                {lines.map((l) => (
                  <MobileRecordCard
                    key={l.id}
                    title={<span className="capitalize">{l.type}</span>}
                    subtitle={formatDate(l.date)}
                  >
                    <MobileField label="Description" value={l.description ?? "—"} span={3} />
                    <MobileField label="Approved" value={formatCurrency(l.amountApproved)} />
                    <MobileField
                      label={l.type === "payment" ? "Certified" : "Balance"}
                      value={
                        l.type === "payment"
                          ? formatCurrency(l.amountCertified ?? 0)
                          : formatCurrency(l.amountBalance ?? 0)
                      }
                    />
                    <MobileField label="Voucher" value={l.voucherRef ?? "—"} />
                  </MobileRecordCard>
                ))}
              </MobileCardList>
            }
            desktop={
              <DesktopDataTable>
                <thead>
                  <tr className="border-b">
                    <th className={desktopThClass}>Type</th>
                    <th className={desktopThClass}>Date</th>
                    <th className={desktopThClass}>Description</th>
                    <th className={desktopThClass}>Approved</th>
                    <th className={desktopThClass}>Certified/Balance</th>
                    <th className={desktopThClass}>Voucher</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id} className="border-b">
                      <td className={cn(desktopTdClass, "capitalize")}>{l.type}</td>
                      <td className={desktopTdClass}>{formatDate(l.date)}</td>
                      <td className={desktopTdClass}>{l.description ?? "—"}</td>
                      <td className={desktopTdClass}>{formatCurrency(l.amountApproved)}</td>
                      <td className={desktopTdClass}>
                        {l.type === "payment"
                          ? formatCurrency(l.amountCertified ?? 0)
                          : formatCurrency(l.amountBalance ?? 0)}
                      </td>
                      <td className={desktopTdClass}>{l.voucherRef ?? "—"}</td>
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
