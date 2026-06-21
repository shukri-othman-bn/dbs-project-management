"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSaveActions, useFormDirty } from "@/components/ui/form-save-actions";
import {
  DesktopDataTable,
  desktopTdClass,
  desktopThClass,
  MobileCardList,
  MobileField,
  MobileRecordCard,
  ResponsiveDataView,
} from "@/components/ui/responsive-data";
import { toInputDate } from "@/lib/format-input";
import {
  assignDisplayProgressClaimNumbers,
  CONTRACTOR_CLAIM_REF_LETTER_LABEL,
  formatProgressClaimNo,
  PROGRESS_CLAIM_NO_LABEL,
} from "@/lib/payment-valuation";
import {
  formatCurrency,
  formatCurrencyInputValue,
  formatDate,
  parseCurrencyInput,
  truncateToDecimals,
} from "@/lib/utils";

type PaymentValuationLine = {
  id: string;
  date: Date | null;
  claimDate: Date | null;
  progressClaimNo: number | null;
  description: string | null;
  amountApproved: number;
  amountCertified: number | null;
  createdAt?: Date;
};

type DisplayLine = PaymentValuationLine & {
  displayProgressClaimNo: number | null;
};

function PaymentValuationRowActions({
  canEdit,
  onEdit,
}: {
  canEdit: boolean;
  onEdit: () => void;
}) {
  if (!canEdit) return null;

  return (
    <Button type="button" size="sm" variant="secondary" onClick={onEdit}>
      Edit
    </Button>
  );
}

function PaymentValuationEditRow({
  projectId,
  line,
  canEdit,
  onCancel,
}: {
  projectId: string;
  line: DisplayLine;
  canEdit: boolean;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { dirty, resetDirty, formTrackProps } = useFormDirty();
  const formId = `payment-valuation-edit-${line.id}`;
  const [amountClaimedText, setAmountClaimedText] = useState(
    formatCurrencyInputValue(line.amountApproved)
  );
  const [amountCertifiedText, setAmountCertifiedText] = useState(
    formatCurrencyInputValue(line.amountCertified)
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const amountApproved = truncateToDecimals(parseCurrencyInput(amountClaimedText) ?? 0, 2);
    const amountCertifiedRaw = parseCurrencyInput(amountCertifiedText);

    const res = await fetch(`/api/projects/${projectId}/budget/lines/${line.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        claimDate: form.get("claimDate"),
        date: form.get("date"),
        description: form.get("description"),
        amountApproved,
        amountCertified:
          amountCertifiedRaw != null ? truncateToDecimals(amountCertifiedRaw, 2) : null,
      }),
    });
    setLoading(false);
    if (res.ok) {
      resetDirty();
      router.refresh();
      onCancel();
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage((data.error as string) || "Failed to save");
    }
  }

  return (
    <tr className="border-b border-slate-100 bg-slate-50/80">
      <td colSpan={canEdit ? 7 : 6} className="px-4 py-4">
        <form id={formId} onSubmit={handleSubmit} className="space-y-4" {...formTrackProps}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Date claim</Label>
              <Input name="claimDate" type="date" defaultValue={toInputDate(line.claimDate)} />
            </div>
            <div>
              <Label>Date certified</Label>
              <Input name="date" type="date" defaultValue={toInputDate(line.date)} />
            </div>
            <div>
              <Label>Amount claimed</Label>
              <Input
                name="amountApproved"
                type="text"
                inputMode="decimal"
                required
                value={amountClaimedText}
                onChange={(e) => setAmountClaimedText(e.target.value)}
                onBlur={() =>
                  setAmountClaimedText(formatCurrencyInputValue(parseCurrencyInput(amountClaimedText)))
                }
              />
            </div>
            <div>
              <Label>Amount certified</Label>
              <Input
                name="amountCertified"
                type="text"
                inputMode="decimal"
                value={amountCertifiedText}
                onChange={(e) => setAmountCertifiedText(e.target.value)}
                onBlur={() =>
                  setAmountCertifiedText(
                    formatCurrencyInputValue(parseCurrencyInput(amountCertifiedText))
                  )
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label>{CONTRACTOR_CLAIM_REF_LETTER_LABEL}</Label>
              <Input name="description" required defaultValue={line.description ?? ""} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FormSaveActions
              formId={formId}
              loading={loading}
              message={message}
              dirty={dirty}
            />
            <Button type="button" size="sm" variant="secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </td>
    </tr>
  );
}

function PaymentValuationMobileCard({
  projectId,
  line,
  canEdit,
  isEditing,
  onEdit,
  onCancel,
}: {
  projectId: string;
  line: DisplayLine;
  canEdit: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { dirty, resetDirty, formTrackProps } = useFormDirty();
  const formId = `payment-valuation-mobile-${line.id}`;
  const [amountClaimedText, setAmountClaimedText] = useState(
    formatCurrencyInputValue(line.amountApproved)
  );
  const [amountCertifiedText, setAmountCertifiedText] = useState(
    formatCurrencyInputValue(line.amountCertified)
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const amountApproved = truncateToDecimals(parseCurrencyInput(amountClaimedText) ?? 0, 2);
    const amountCertifiedRaw = parseCurrencyInput(amountCertifiedText);

    const res = await fetch(`/api/projects/${projectId}/budget/lines/${line.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        claimDate: form.get("claimDate"),
        date: form.get("date"),
        description: form.get("description"),
        amountApproved,
        amountCertified:
          amountCertifiedRaw != null ? truncateToDecimals(amountCertifiedRaw, 2) : null,
      }),
    });
    setLoading(false);
    if (res.ok) {
      resetDirty();
      router.refresh();
      onCancel();
    } else {
      setMessage("Failed to save");
    }
  }

  if (isEditing) {
    return (
      <MobileRecordCard
        title={`Edit ${PROGRESS_CLAIM_NO_LABEL} ${formatProgressClaimNo(line.displayProgressClaimNo)}`}
      >
        <form id={formId} onSubmit={handleSubmit} className="space-y-4" {...formTrackProps}>
          <MobileField
            label={CONTRACTOR_CLAIM_REF_LETTER_LABEL}
            value={
              <Input name="description" required defaultValue={line.description ?? ""} />
            }
            span={3}
          />
          <MobileField
            label="Date claim"
            value={<Input name="claimDate" type="date" defaultValue={toInputDate(line.claimDate)} />}
          />
          <MobileField
            label="Date certified"
            value={<Input name="date" type="date" defaultValue={toInputDate(line.date)} />}
          />
          <MobileField
            label="Amount claimed"
            value={
              <Input
                type="text"
                inputMode="decimal"
                required
                value={amountClaimedText}
                onChange={(e) => setAmountClaimedText(e.target.value)}
                onBlur={() =>
                  setAmountClaimedText(
                    formatCurrencyInputValue(parseCurrencyInput(amountClaimedText))
                  )
                }
              />
            }
          />
          <MobileField
            label="Amount certified"
            value={
              <Input
                type="text"
                inputMode="decimal"
                value={amountCertifiedText}
                onChange={(e) => setAmountCertifiedText(e.target.value)}
                onBlur={() =>
                  setAmountCertifiedText(
                    formatCurrencyInputValue(parseCurrencyInput(amountCertifiedText))
                  )
                }
              />
            }
          />
          <div className="flex flex-wrap gap-2 pt-2">
            <FormSaveActions formId={formId} loading={loading} message={message} dirty={dirty} />
            <Button type="button" size="sm" variant="secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </MobileRecordCard>
    );
  }

  return (
    <MobileRecordCard
      title={`${PROGRESS_CLAIM_NO_LABEL} ${formatProgressClaimNo(line.displayProgressClaimNo)}`}
      subtitle={line.description ?? undefined}
    >
      <MobileField
        label={CONTRACTOR_CLAIM_REF_LETTER_LABEL}
        value={line.description ?? "—"}
        span={3}
      />
      <MobileField label="Date claim" value={formatDate(line.claimDate)} />
      <MobileField label="Date certified" value={formatDate(line.date)} />
      <MobileField label="Amount claimed" value={formatCurrency(line.amountApproved)} />
      <MobileField
        label="Amount certified"
        value={
          line.amountCertified != null ? formatCurrency(line.amountCertified) : "—"
        }
      />
      {canEdit && (
        <div className="col-span-3 pt-1">
          <PaymentValuationRowActions canEdit={canEdit} onEdit={onEdit} />
        </div>
      )}
    </MobileRecordCard>
  );
}

export function ProjectPaymentValuationPanel({
  projectId,
  financialYearId,
  lines,
  canEdit,
}: {
  projectId: string;
  financialYearId?: string;
  lines: PaymentValuationLine[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const { dirty, resetDirty, formTrackProps } = useFormDirty();
  const formId = `payment-valuation-${projectId}`;

  const displayLines = useMemo(
    () =>
      assignDisplayProgressClaimNumbers(lines).sort(
        (a, b) =>
          (b.displayProgressClaimNo ?? 0) - (a.displayProgressClaimNo ?? 0)
      ),
    [lines]
  );
  const totalCertified = useMemo(
    () => displayLines.reduce((sum, line) => sum + (line.amountCertified ?? 0), 0),
    [displayLines]
  );
  const nextClaimNo = useMemo(() => {
    const max = displayLines.reduce(
      (highest, line) => Math.max(highest, line.displayProgressClaimNo ?? 0),
      0
    );
    return max + 1;
  }, [displayLines]);

  async function addLine(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!financialYearId) return;
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const amountApproved = truncateToDecimals(
      parseCurrencyInput(form.get("amountApproved") as string) ?? 0,
      2
    );
    const amountCertifiedRaw = parseCurrencyInput(form.get("amountCertified") as string);

    const res = await fetch(`/api/projects/${projectId}/budget/lines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "payment",
        financialYearId,
        claimDate: form.get("claimDate"),
        date: form.get("date"),
        description: form.get("description"),
        amountApproved,
        amountCertified:
          amountCertifiedRaw != null ? truncateToDecimals(amountCertifiedRaw, 2) : null,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setMessage("Saved");
      resetDirty();
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage((data.error as string) || "Failed to save");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Payment valuations</p>
            <p className="text-lg font-bold">{displayLines.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Total certified</p>
            <p className="text-lg font-bold">{formatCurrency(totalCertified)}</p>
            <p className="mt-2 text-xs text-slate-500">
              <Link
                href={`/projects/${projectId}?tab=financials&group=progress`}
                className="text-blue-600 hover:underline"
              >
                View PO details in Financials
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment valuations</CardTitle>
        </CardHeader>
        <CardContent className="p-0 lg:p-6">
          {displayLines.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-slate-500 lg:px-0">
              No payment valuations recorded yet.
            </p>
          ) : (
            <ResponsiveDataView
              mobile={
                <MobileCardList>
                  {displayLines.map((line) => (
                    <PaymentValuationMobileCard
                      key={line.id}
                      projectId={projectId}
                      line={line}
                      canEdit={canEdit}
                      isEditing={editingId === line.id}
                      onEdit={() => setEditingId(line.id)}
                      onCancel={() => setEditingId(null)}
                    />
                  ))}
                </MobileCardList>
              }
              desktop={
                <DesktopDataTable dense>
                  <thead>
                    <tr className="border-b bg-slate-50 text-left text-slate-500">
                      <th className={desktopThClass}>{PROGRESS_CLAIM_NO_LABEL}</th>
                      <th className={desktopThClass}>{CONTRACTOR_CLAIM_REF_LETTER_LABEL}</th>
                      <th className={desktopThClass}>Date claim</th>
                      <th className={desktopThClass}>Date certified</th>
                      <th className={desktopThClass}>Amount claimed</th>
                      <th className={desktopThClass}>Amount certified</th>
                      {canEdit && <th className={desktopThClass}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {displayLines.map((line) => (
                      <Fragment key={line.id}>
                        {editingId === line.id ? (
                          <PaymentValuationEditRow
                            projectId={projectId}
                            line={line}
                            canEdit={canEdit}
                            onCancel={() => setEditingId(null)}
                          />
                        ) : (
                          <tr className="border-b border-slate-100">
                            <td className={desktopTdClass}>
                              {formatProgressClaimNo(line.displayProgressClaimNo)}
                            </td>
                            <td className={desktopTdClass}>{line.description ?? "—"}</td>
                            <td className={desktopTdClass}>{formatDate(line.claimDate)}</td>
                            <td className={desktopTdClass}>{formatDate(line.date)}</td>
                            <td className={desktopTdClass}>
                              {formatCurrency(line.amountApproved)}
                            </td>
                            <td className={desktopTdClass}>
                              {line.amountCertified != null
                                ? formatCurrency(line.amountCertified)
                                : "—"}
                            </td>
                            {canEdit && (
                              <td className={desktopTdClass}>
                                <PaymentValuationRowActions
                                  canEdit={canEdit}
                                  onEdit={() => setEditingId(line.id)}
                                />
                              </td>
                            )}
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </DesktopDataTable>
              }
            />
          )}
        </CardContent>
      </Card>

      {canEdit && financialYearId && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle>Add payment valuation</CardTitle>
            <FormSaveActions
              formId={formId}
              loading={loading}
              message={message}
              dirty={dirty}
            />
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-600">
              Next {PROGRESS_CLAIM_NO_LABEL.toLowerCase()}:{" "}
              <span className="font-semibold text-slate-900">{nextClaimNo}</span>
            </p>
            <form
              id={formId}
              onSubmit={addLine}
              className="grid gap-4 sm:grid-cols-2"
              {...formTrackProps}
            >
              <div>
                <Label>Date claim</Label>
                <Input name="claimDate" type="date" />
              </div>
              <div>
                <Label>Date certified</Label>
                <Input name="date" type="date" />
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Amount claimed</Label>
                  <Input name="amountApproved" type="text" inputMode="decimal" required />
                </div>
                <div>
                  <Label>{CONTRACTOR_CLAIM_REF_LETTER_LABEL}</Label>
                  <Input name="description" required />
                </div>
              </div>
              <div>
                <Label>Amount certified</Label>
                <Input name="amountCertified" type="text" inputMode="decimal" />
              </div>
              <div className="sm:col-span-full">
                <FormSaveActions loading={loading} message={message} dirty={dirty} />
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
