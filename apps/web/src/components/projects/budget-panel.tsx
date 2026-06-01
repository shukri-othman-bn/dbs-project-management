"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
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
  const [loading, setLoading] = useState(false);
  const [lineType, setLineType] = useState<"warrant" | "payment">("warrant");

  async function saveAllocation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await fetch(`/api/projects/${projectId}/budget`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        allocation: parseFloat(form.get("allocation") as string) || 0,
        encumbranceTotal: parseFloat(form.get("encumbranceTotal") as string) || 0,
        encumbranceBalance: parseFloat(form.get("encumbranceBalance") as string) || 0,
        financialYearId,
      }),
    });
    setLoading(false);
    router.refresh();
  }

  async function addLine(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await fetch(`/api/projects/${projectId}/budget/lines`, {
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
    setLoading(false);
    router.refresh();
    (e.target as HTMLFormElement).reset();
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
            <CardHeader>
              <CardTitle>FY Budget Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveAllocation} className="grid gap-4 sm:grid-cols-3">
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
                <Button type="submit" disabled={loading} size="sm">
                  Update Summary
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Budget Line</CardTitle>
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
              <form onSubmit={addLine} className="grid gap-4 sm:grid-cols-2">
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
                <Button type="submit" disabled={loading} size="sm">
                  Add {lineType}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Budget Lines</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Description</th>
                <th className="pb-2 pr-4">Approved</th>
                <th className="pb-2 pr-4">Certified/Balance</th>
                <th className="pb-2">Voucher</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id} className="border-b">
                  <td className="py-2 pr-4 capitalize">{l.type}</td>
                  <td className="py-2 pr-4">{formatDate(l.date)}</td>
                  <td className="py-2 pr-4">{l.description ?? "—"}</td>
                  <td className="py-2 pr-4">{formatCurrency(l.amountApproved)}</td>
                  <td className="py-2 pr-4">
                    {l.type === "payment"
                      ? formatCurrency(l.amountCertified ?? 0)
                      : formatCurrency(l.amountBalance ?? 0)}
                  </td>
                  <td className="py-2">{l.voucherRef ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
