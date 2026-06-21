"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSaveActions, useFormDirty } from "@/components/ui/form-save-actions";
import { toInputDate } from "@/lib/format-input";
import { formatProgressClaimNo } from "@/lib/payment-valuation";
import { sumPoCommitted } from "@/lib/purchase-order-sync";
import type { UnitBudgetMetrics } from "@/lib/data";
import { formatCurrency, formatDate, cn, truncateToDecimals } from "@/lib/utils";
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

type LinkedPurchaseOrder = {
  id: string;
  budgetLineId: string | null;
  poId: string | null;
  poAmount: number;
  claimDate: Date | null;
  sesDate: Date | null;
  invoiceDate: Date | null;
  eDispatchedDate: Date | null;
  eDispatchRef: string | null;
  paidDate: Date | null;
  budgetLine: {
    id: string;
    progressClaimNo: number | null;
    description: string | null;
    claimDate: Date | null;
    amountCertified: number | null;
  } | null;
};

function PoDetailsForm({
  projectId,
  purchaseOrder,
  canEdit,
}: {
  projectId: string;
  purchaseOrder: LinkedPurchaseOrder;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [poIdText, setPoIdText] = useState(purchaseOrder.poId ?? "");
  const { dirty, resetDirty, formTrackProps } = useFormDirty();
  const formId = `po-details-${purchaseOrder.id}`;
  const workflowUnlocked = poIdText.trim().length > 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);

    const res = await fetch(
      `/api/projects/${projectId}/purchase-orders/${purchaseOrder.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poId: poIdText.trim() || null,
          sesDate: form.get("sesDate"),
          invoiceDate: form.get("invoiceDate"),
          eDispatchedDate: form.get("eDispatchedDate"),
          eDispatchRef: form.get("eDispatchRef"),
          paidDate: form.get("paidDate"),
        }),
      }
    );
    setLoading(false);
    if (res.ok) {
      setMessage("Saved");
      resetDirty();
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage((data.error as string) || "Failed to save");
    }
  }

  const claimLabel = purchaseOrder.budgetLine
    ? [
        formatProgressClaimNo(purchaseOrder.budgetLine.progressClaimNo),
        purchaseOrder.budgetLine.description,
      ]
        .filter(Boolean)
        .join(" — ")
    : "—";

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4" {...formTrackProps}>
      <p className="text-sm text-slate-600">
        Payment claim: <span className="font-medium text-slate-900">{claimLabel}</span>
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label>PO ID</Label>
          <Input
            name="poId"
            value={poIdText}
            onChange={(e) => setPoIdText(e.target.value)}
            disabled={!canEdit}
            placeholder="Enter PO ID to unlock workflow"
          />
        </div>
        <div>
          <Label>PO amount</Label>
          <Input
            readOnly
            value={formatCurrency(purchaseOrder.poAmount)}
            className="bg-slate-50"
          />
        </div>
        <div>
          <Label>Claim date</Label>
          <Input
            readOnly
            value={formatDate(purchaseOrder.budgetLine?.claimDate ?? purchaseOrder.claimDate)}
            className="bg-slate-50"
          />
        </div>
        <div>
          <Label>Certified amount</Label>
          <Input
            readOnly
            value={formatCurrency(purchaseOrder.budgetLine?.amountCertified ?? 0)}
            className="bg-slate-50"
          />
        </div>
        <div>
          <Label>SES date</Label>
          <Input
            name="sesDate"
            type="date"
            defaultValue={toInputDate(purchaseOrder.sesDate)}
            disabled={!canEdit || !workflowUnlocked}
          />
        </div>
        <div>
          <Label>Invoice date</Label>
          <Input
            name="invoiceDate"
            type="date"
            defaultValue={toInputDate(purchaseOrder.invoiceDate)}
            disabled={!canEdit || !workflowUnlocked}
          />
        </div>
        <div>
          <Label>E-dispatched date</Label>
          <Input
            name="eDispatchedDate"
            type="date"
            defaultValue={toInputDate(purchaseOrder.eDispatchedDate)}
            disabled={!canEdit || !workflowUnlocked}
          />
        </div>
        <div>
          <Label>E-Dispatch Ref</Label>
          <Input
            name="eDispatchRef"
            defaultValue={purchaseOrder.eDispatchRef ?? ""}
            disabled={!canEdit || !workflowUnlocked}
          />
        </div>
        <div>
          <Label>Paid date</Label>
          <Input
            name="paidDate"
            type="date"
            defaultValue={toInputDate(purchaseOrder.paidDate)}
            disabled={!canEdit || !workflowUnlocked}
          />
        </div>
      </div>
      {!workflowUnlocked && canEdit && (
        <p className="text-xs text-slate-500">
          Enter a PO ID to unlock SES, invoice, e-dispatch, and paid date fields.
        </p>
      )}
      {canEdit && (
        <FormSaveActions loading={loading} message={message} dirty={dirty} />
      )}
    </form>
  );
}

export function BudgetPanel({
  projectId,
  financialYearId,
  totals,
  unitBudget,
  lines,
  purchaseOrders,
  canEdit,
}: {
  projectId: string;
  financialYearId?: string;
  totals: BudgetTotals;
  unitBudget: UnitBudgetMetrics | null;
  lines: BudgetLine[];
  purchaseOrders: LinkedPurchaseOrder[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [lineLoading, setLineLoading] = useState(false);
  const [lineMessage, setLineMessage] = useState("");
  const lineDirty = useFormDirty();
  const lineFormId = `budget-line-${projectId}`;

  const linkedPurchaseOrders = useMemo(
    () =>
      purchaseOrders
        .filter((po) => po.budgetLineId != null || po.budgetLine != null)
        .sort((a, b) => {
          const aDate =
            a.budgetLine?.claimDate?.getTime() ?? a.claimDate?.getTime() ?? 0;
          const bDate =
            b.budgetLine?.claimDate?.getTime() ?? b.claimDate?.getTime() ?? 0;
          return bDate - aDate;
        }),
    [purchaseOrders]
  );

  const poCommitted = useMemo(
    () => sumPoCommitted(purchaseOrders),
    [purchaseOrders]
  );

  const unitAllocation = unitBudget?.budgetByUnit ?? 0;

  const encumbranceExceedsAllocation = useMemo(() => {
    if (!unitBudget) return false;
    return unitBudget.encumbranceByUnit > unitAllocation;
  }, [unitBudget, unitAllocation]);

  const encumbranceExcess = truncateToDecimals(
    (unitBudget?.encumbranceByUnit ?? 0) - unitAllocation,
    2
  );

  const poCommittedExceedsAllocation = useMemo(() => {
    if (!unitBudget) return false;
    return poCommitted > unitAllocation;
  }, [unitBudget, poCommitted, unitAllocation]);

  const poCommittedExcess = truncateToDecimals(poCommitted - unitAllocation, 2);

  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const activePoId =
    selectedPoId ??
    linkedPurchaseOrders.find((po) => !po.poId)?.id ??
    linkedPurchaseOrders[0]?.id ??
    null;
  const activePo = linkedPurchaseOrders.find((po) => po.id === activePoId) ?? null;

  async function addLine(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLineLoading(true);
    setLineMessage("");
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/projects/${projectId}/budget/lines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "warrant",
        financialYearId,
        date: form.get("date"),
        description: form.get("description"),
        amountApproved: parseFloat(form.get("amountApproved") as string) || 0,
        amountBalance: form.get("amountBalance")
          ? parseFloat(form.get("amountBalance") as string)
          : null,
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Budget by Unit</p>
            <p className="text-lg font-bold">
              {formatCurrency(unitBudget?.budgetByUnit ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card
          className={cn(
            encumbranceExceedsAllocation && "border-red-300 bg-red-50"
          )}
        >
          <CardContent className="pt-4">
            <p
              className={cn(
                "text-xs",
                encumbranceExceedsAllocation ? "text-red-600" : "text-slate-500"
              )}
            >
              Budget total encumbrance by Unit
            </p>
            <p
              className={cn(
                "text-lg font-bold",
                encumbranceExceedsAllocation && "text-red-600"
              )}
            >
              {formatCurrency(unitBudget?.encumbranceByUnit ?? 0)}
            </p>
            {encumbranceExceedsAllocation && (
              <p className="mt-1 text-xs font-medium text-red-600">
                Exceeds funding type allocation by {formatCurrency(encumbranceExcess)}. Total PO
                encumbrance for this unit and funding type is above the approved budget.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Budget total encumbrance balance by Unit</p>
            <p className="text-lg font-bold">
              {formatCurrency(unitBudget?.encumbranceBalanceByUnit ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card
          className={cn(
            poCommittedExceedsAllocation && "border-red-300 bg-red-50"
          )}
        >
          <CardContent className="pt-4">
            <p
              className={cn(
                "text-xs",
                poCommittedExceedsAllocation ? "text-red-600" : "text-slate-500"
              )}
            >
              PO committed
            </p>
            <p
              className={cn(
                "text-lg font-bold",
                poCommittedExceedsAllocation && "text-red-600"
              )}
            >
              {formatCurrency(poCommitted)}
            </p>
            {poCommittedExceedsAllocation && (
              <p className="mt-1 text-xs font-medium text-red-600">
                Exceeds funding type allocation by {formatCurrency(poCommittedExcess)}. Project PO
                committed amount is above the approved unit budget.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Amount Project Spent</p>
            <p className="text-lg font-bold">{formatCurrency(totals.paymentsCertified)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Amount Project Unspent</p>
            <p className="text-lg font-bold">{formatCurrency(totals.unspent)}</p>
          </CardContent>
        </Card>
      </div>

      {canEdit && financialYearId && (
        <>
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <CardTitle>Add warrant line</CardTitle>
              <FormSaveActions
                formId={lineFormId}
                loading={lineLoading}
                message={lineMessage}
                dirty={lineDirty.dirty}
              />
            </CardHeader>
            <CardContent>
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
                <div>
                  <Label>Balance</Label>
                  <Input name="amountBalance" type="number" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  <Input name="description" />
                </div>
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
          <CardTitle>Warrant lines</CardTitle>
        </CardHeader>
        <CardContent className="p-0 lg:p-6">
          <ResponsiveDataView
            mobile={
              <MobileCardList>
                {lines.map((l) => (
                  <MobileRecordCard
                    key={l.id}
                    title="Warrant"
                    subtitle={formatDate(l.date)}
                  >
                    <MobileField label="Description" value={l.description ?? "—"} span={3} />
                    <MobileField label="Approved" value={formatCurrency(l.amountApproved)} />
                    <MobileField
                      label="Balance"
                      value={formatCurrency(l.amountBalance ?? 0)}
                    />
                  </MobileRecordCard>
                ))}
              </MobileCardList>
            }
            desktop={
              <DesktopDataTable>
                <thead>
                  <tr className="border-b">
                    <th className={desktopThClass}>Date</th>
                    <th className={desktopThClass}>Description</th>
                    <th className={desktopThClass}>Approved</th>
                    <th className={desktopThClass}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id} className="border-b">
                      <td className={desktopTdClass}>{formatDate(l.date)}</td>
                      <td className={desktopTdClass}>{l.description ?? "—"}</td>
                      <td className={desktopTdClass}>{formatCurrency(l.amountApproved)}</td>
                      <td className={desktopTdClass}>{formatCurrency(l.amountBalance ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </DesktopDataTable>
            }
          />
        </CardContent>
      </Card>

      {activePo && (
        <Card>
          <CardHeader>
            <CardTitle>PO details</CardTitle>
          </CardHeader>
          <CardContent>
            <PoDetailsForm
              key={activePo.id}
              projectId={projectId}
              purchaseOrder={activePo}
              canEdit={canEdit}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>PO / Payment claims</CardTitle>
        </CardHeader>
        <CardContent className="p-0 lg:p-6">
          {linkedPurchaseOrders.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500 lg:px-0">
              Certify a payment on the Payment Valuation tab to create a PO row.
            </p>
          ) : (
            <ResponsiveDataView
              mobile={
                <MobileCardList>
                  {linkedPurchaseOrders.map((po) => {
                    const bl = po.budgetLine;
                    const title = bl
                      ? `Claim ${formatProgressClaimNo(bl.progressClaimNo)}`
                      : "Payment claim";
                    return (
                      <MobileRecordCard
                        key={po.id}
                        title={title}
                        subtitle={bl?.description ?? formatDate(bl?.claimDate ?? po.claimDate)}
                      >
                        {canEdit && (
                          <div className="col-span-full mb-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={po.id === activePoId ? "primary" : "secondary"}
                              onClick={() => setSelectedPoId(po.id)}
                            >
                              {po.id === activePoId ? "Selected" : "Edit"}
                            </Button>
                          </div>
                        )}
                        <MobileField
                          label="Certified"
                          value={formatCurrency(bl?.amountCertified ?? 0)}
                        />
                        <MobileField label="PO ID" value={po.poId ?? "—"} />
                        <MobileField label="PO amount" value={formatCurrency(po.poAmount)} />
                        <MobileField label="SES date" value={formatDate(po.sesDate)} />
                        <MobileField label="Invoice date" value={formatDate(po.invoiceDate)} />
                        <MobileField
                          label="E-dispatched"
                          value={formatDate(po.eDispatchedDate)}
                        />
                        <MobileField label="E-Dispatch Ref" value={po.eDispatchRef ?? "—"} />
                        <MobileField label="Paid date" value={formatDate(po.paidDate)} />
                      </MobileRecordCard>
                    );
                  })}
                </MobileCardList>
              }
              desktop={
                <DesktopDataTable>
                  <thead>
                    <tr className="border-b">
                      {canEdit && <th className={desktopThClass} />}
                      <th className={desktopThClass}>Progress claim</th>
                      <th className={desktopThClass}>Description</th>
                      <th className={desktopThClass}>Claim date</th>
                      <th className={desktopThClass}>Certified amount</th>
                      <th className={desktopThClass}>PO ID</th>
                      <th className={desktopThClass}>PO amount</th>
                      <th className={desktopThClass}>SES date</th>
                      <th className={desktopThClass}>Invoice date</th>
                      <th className={desktopThClass}>E-dispatched</th>
                      <th className={desktopThClass}>E-Dispatch Ref</th>
                      <th className={desktopThClass}>Paid date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedPurchaseOrders.map((po) => {
                      const bl = po.budgetLine;
                      const isSelected = po.id === activePoId;
                      return (
                        <tr
                          key={po.id}
                          className={`border-b ${isSelected ? "bg-slate-50" : ""}`}
                        >
                          {canEdit && (
                            <td className={desktopTdClass}>
                              <Button
                                type="button"
                                size="sm"
                                variant={isSelected ? "primary" : "secondary"}
                                onClick={() => setSelectedPoId(po.id)}
                              >
                                {isSelected ? "Selected" : "Edit"}
                              </Button>
                            </td>
                          )}
                          <td className={desktopTdClass}>
                            {formatProgressClaimNo(bl?.progressClaimNo ?? null)}
                          </td>
                          <td className={desktopTdClass}>{bl?.description ?? "—"}</td>
                          <td className={desktopTdClass}>
                            {formatDate(bl?.claimDate ?? po.claimDate)}
                          </td>
                          <td className={desktopTdClass}>
                            {formatCurrency(bl?.amountCertified ?? 0)}
                          </td>
                          <td className={desktopTdClass}>{po.poId ?? "—"}</td>
                          <td className={desktopTdClass}>{formatCurrency(po.poAmount)}</td>
                          <td className={desktopTdClass}>{formatDate(po.sesDate)}</td>
                          <td className={desktopTdClass}>{formatDate(po.invoiceDate)}</td>
                          <td className={desktopTdClass}>{formatDate(po.eDispatchedDate)}</td>
                          <td className={desktopTdClass}>{po.eDispatchRef ?? "—"}</td>
                          <td className={desktopTdClass}>{formatDate(po.paidDate)}</td>
                        </tr>
                      );
                    })}
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
