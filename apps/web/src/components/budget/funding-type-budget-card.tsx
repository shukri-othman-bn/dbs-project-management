"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FundingTypeBudgetPie } from "@/components/charts/funding-type-budget-pie";
import { FormSaveActions, useFormDirty } from "@/components/ui/form-save-actions";
import { fundingTypeLabel } from "@/lib/funding-types";
import type { FundingTypeBudgetRow } from "@/lib/data";
import {
  formatCurrency,
  formatCurrencyInputValue,
  parseCurrencyInput,
  truncateToDecimals,
} from "@/lib/utils";

type FundingTypeBudgetCardProps = {
  row: FundingTypeBudgetRow;
  canEdit: boolean;
  financialYearId?: string;
};

export function FundingTypeBudgetCard({
  row,
  canEdit,
  financialYearId,
}: FundingTypeBudgetCardProps) {
  const router = useRouter();
  const title = `${row.code} · ${fundingTypeLabel(row.name)}`;
  const editable = canEdit && !row.budgetSummaryLocked;

  const [allocationText, setAllocationText] = useState(
    formatCurrencyInputValue(row.amountApproved)
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { dirty, markDirty, resetDirty, formTrackProps } = useFormDirty();
  const formId = `funding-type-budget-${row.code}`;

  const previewAllocation = useMemo(
    () => truncateToDecimals(parseCurrencyInput(allocationText) ?? 0, 2),
    [allocationText]
  );

  const displayAllocation = editable ? previewAllocation : row.amountApproved;
  const displayBalanceAllocation = editable
    ? truncateToDecimals(previewAllocation - row.encumbranceAmount, 2)
    : row.balanceAllocation;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editable) return;

    setLoading(true);
    setMessage("");

    const allocation = truncateToDecimals(parseCurrencyInput(allocationText) ?? 0, 2);

    const res = await fetch(`/api/budget/funding-types/${row.code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        financialYearId,
        allocation,
      }),
    });

    setLoading(false);

    if (res.ok) {
      setMessage("Saved");
      resetDirty();
      router.refresh();
      return;
    }

    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    setMessage(data?.error ?? "Failed to save");
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          {row.budgetSummaryLocked && (
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              Locked
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <form
          id={formId}
          onSubmit={handleSubmit}
          className="grid grid-cols-2 gap-3 text-sm"
          {...(editable ? formTrackProps : {})}
        >
          <div>
            <Label htmlFor={`${formId}-allocation`} className="text-slate-500">
              Amount approved
            </Label>
            {editable ? (
              <Input
                id={`${formId}-allocation`}
                type="text"
                inputMode="decimal"
                value={allocationText}
                onChange={(e) => {
                  markDirty();
                  setAllocationText(e.target.value);
                }}
                onBlur={() =>
                  setAllocationText(
                    formatCurrencyInputValue(parseCurrencyInput(allocationText))
                  )
                }
                className="mt-1 font-semibold"
              />
            ) : (
              <p className="mt-1 font-semibold text-slate-900">
                {formatCurrency(displayAllocation)}
              </p>
            )}
          </div>
          <div>
            <p className="text-slate-500">Encumbrance amount</p>
            <p className="mt-1 font-semibold text-slate-900">
              {formatCurrency(row.encumbranceAmount)}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Encumbrance balance</p>
            <p className="mt-1 font-semibold text-slate-900">
              {formatCurrency(row.encumbranceBalance)}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Balance Allocation</p>
            <p className="mt-1 font-semibold text-slate-900">
              {formatCurrency(displayBalanceAllocation)}
            </p>
          </div>
        </form>

        {editable && (
          <FormSaveActions
            loading={loading}
            message={message}
            dirty={dirty}
            formId={formId}
          />
        )}

        <FundingTypeBudgetPie
          spent={row.spent}
          encumbranceBalance={row.encumbranceBalance}
        />
      </CardContent>
    </Card>
  );
}
