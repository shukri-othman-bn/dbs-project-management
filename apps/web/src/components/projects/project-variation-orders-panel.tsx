"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormDirty } from "@/components/ui/form-save-actions";
import { ContractMatterCardActions } from "@/components/projects/contract-matter-card-actions";
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
  computeVariationOrderFields,
  sortVariationOrdersAsc,
  type VariationOrderCalcRecord,
} from "@/lib/variation-order-calculations";
import {
  formatCurrency,
  formatCurrencyInputValue,
  formatDate,
  formatPercentTwoDecimals,
  parseCurrencyInput,
} from "@/lib/utils";

const VO_DATE_FIELDS = [
  { name: "submittedToSbmDate", label: "VO submitted to SBM date" },
  { name: "receivedByDbsoDate", label: "VO received by DBSO" },
  { name: "committeeReviewDate", label: "VO committee review" },
  { name: "submittedToDgoDate", label: "VO submitted to DGO" },
  { name: "submittedToClientDate", label: "VO submitted to client" },
  { name: "approvedDate", label: "VO approved" },
] as const;

type VariationOrder = VariationOrderCalcRecord & {
  submittedToSbmDate: Date | null;
  receivedByDbsoDate: Date | null;
  committeeReviewDate: Date | null;
  submittedToDgoDate: Date | null;
  submittedToClientDate: Date | null;
  voPercent: number | null;
  revisedContractSum: number | null;
  isLocked: boolean;
};

function formatAmount(value: number | null | undefined) {
  return value != null ? formatCurrency(value) : "—";
}

function VariationOrdersSummaryTable({ records }: { records: VariationOrder[] }) {
  const recordsAsc = useMemo(() => sortVariationOrdersAsc(records), [records]);

  if (recordsAsc.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Variation orders</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveDataView
          mobile={
            <MobileCardList>
              {recordsAsc.map((vo, index) => (
                <MobileRecordCard key={vo.id} title={`VO ${index + 1}`}>
                  <MobileField label="VO amount" value={formatAmount(vo.voAmount)} />
                  <MobileField
                    label="VO committee review"
                    value={formatDate(vo.committeeReviewDate)}
                  />
                  <MobileField
                    label="VO submitted to DGO"
                    value={formatDate(vo.submittedToDgoDate)}
                  />
                  <MobileField
                    label="VO submitted to client"
                    value={formatDate(vo.submittedToClientDate)}
                  />
                  <MobileField label="VO approved" value={formatDate(vo.approvedDate)} />
                </MobileRecordCard>
              ))}
            </MobileCardList>
          }
          desktop={
            <DesktopDataTable dense>
              <thead>
                <tr className="border-b bg-slate-50 text-left text-slate-500">
                  <th className={desktopThClass}>VO no.</th>
                  <th className={desktopThClass}>VO amount</th>
                  <th className={desktopThClass}>VO committee review</th>
                  <th className={desktopThClass}>VO submitted to DGO</th>
                  <th className={desktopThClass}>VO submitted to client</th>
                  <th className={desktopThClass}>VO approved</th>
                </tr>
              </thead>
              <tbody>
                {recordsAsc.map((vo, index) => (
                  <tr key={vo.id} className="border-b border-slate-100">
                    <td className={desktopTdClass}>VO {index + 1}</td>
                    <td className={desktopTdClass}>{formatAmount(vo.voAmount)}</td>
                    <td className={desktopTdClass}>{formatDate(vo.committeeReviewDate)}</td>
                    <td className={desktopTdClass}>{formatDate(vo.submittedToDgoDate)}</td>
                    <td className={desktopTdClass}>{formatDate(vo.submittedToClientDate)}</td>
                    <td className={desktopTdClass}>{formatDate(vo.approvedDate)}</td>
                  </tr>
                ))}
              </tbody>
            </DesktopDataTable>
          }
        />
      </CardContent>
    </Card>
  );
}

function VariationOrderCard({
  projectId,
  record,
  index,
  recordsAsc,
  originalContractSum,
  canEdit,
}: {
  projectId: string;
  record: VariationOrder;
  index: number;
  recordsAsc: VariationOrder[];
  originalContractSum: number | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [voAmountText, setVoAmountText] = useState(formatCurrencyInputValue(record.voAmount));
  const { dirty, resetDirty, formTrackProps } = useFormDirty();
  const formId = `variation-order-${record.id}`;

  const fieldsDisabled = !canEdit || (record.isLocked && !isEditing);

  const parsedVoAmount = parseCurrencyInput(voAmountText);
  const computed = useMemo(
    () =>
      computeVariationOrderFields(
        recordsAsc.map((vo) =>
          vo.id === record.id ? { ...vo, voAmount: parsedVoAmount } : vo
        ),
        index,
        originalContractSum,
        parsedVoAmount
      ),
    [recordsAsc, record.id, index, originalContractSum, parsedVoAmount]
  );

  function handleVoAmountBlur() {
    const parsed = parseCurrencyInput(voAmountText);
    setVoAmountText(formatCurrencyInputValue(parsed));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (fieldsDisabled) return;
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const body = {
      ...Object.fromEntries(VO_DATE_FIELDS.map((field) => [field.name, form.get(field.name)])),
      voAmount: parsedVoAmount,
    };

    const res = await fetch(`/api/projects/${projectId}/variation-orders/${record.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) {
      setMessage("Saved");
      setIsEditing(false);
      resetDirty();
      router.refresh();
    } else {
      setMessage("Failed to save");
    }
  }

  async function handleDelete() {
    if (!canEdit || deleting || loading) return;
    if (!confirm("Delete this variation order record?")) return;
    setDeleting(true);
    const res = await fetch(`/api/projects/${projectId}/variation-orders/${record.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    if (res.ok) router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2">
        <CardTitle className="text-base">Variation order {index + 1}</CardTitle>
        {canEdit && (
          <Button
            type="button"
            variant="secondary"
            className="ml-auto"
            disabled={loading || deleting}
            onClick={handleDelete}
          >
            {deleting ? "Deleting…" : "Delete record"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <form
          id={formId}
          onSubmit={handleSubmit}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          {...(!fieldsDisabled ? formTrackProps : {})}
        >
          {VO_DATE_FIELDS.map((field) => (
            <div key={field.name}>
              <Label htmlFor={`${record.id}-${field.name}`}>{field.label}</Label>
              <Input
                id={`${record.id}-${field.name}`}
                name={field.name}
                type="date"
                defaultValue={toInputDate(record[field.name])}
                disabled={fieldsDisabled}
                className="mt-1"
              />
            </div>
          ))}
          <div>
            <Label htmlFor={`${record.id}-voAmount`}>VO amount</Label>
            <Input
              id={`${record.id}-voAmount`}
              name="voAmount"
              type="text"
              inputMode="decimal"
              value={voAmountText}
              onChange={(e) => setVoAmountText(e.target.value)}
              onBlur={handleVoAmountBlur}
              disabled={fieldsDisabled}
              placeholder="$0.00"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor={`${record.id}-voPercent`}>% VO amount</Label>
            <Input
              id={`${record.id}-voPercent`}
              readOnly
              tabIndex={-1}
              value={
                computed.voPercent != null ? formatPercentTwoDecimals(computed.voPercent) : ""
              }
              disabled
              className="mt-1 bg-slate-50"
            />
          </div>
          <div>
            <Label htmlFor={`${record.id}-revisedContractSum`}>Revised contract sum</Label>
            <Input
              id={`${record.id}-revisedContractSum`}
              readOnly
              tabIndex={-1}
              type="text"
              value={
                computed.revisedContractSum != null
                  ? formatCurrency(computed.revisedContractSum)
                  : ""
              }
              disabled
              className="mt-1 bg-slate-50"
            />
          </div>
          {canEdit && (
            <div className="sm:col-span-full">
              <ContractMatterCardActions
                formId={formId}
                canEdit={canEdit}
                isLocked={record.isLocked}
                isEditing={isEditing}
                onEdit={() => {
                  setMessage("");
                  setIsEditing(true);
                }}
                loading={loading}
                message={message}
                dirty={dirty}
              />
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

export function ProjectVariationOrdersPanel({
  projectId,
  records,
  originalContractSum,
  canEdit,
}: {
  projectId: string;
  records: VariationOrder[];
  originalContractSum: number | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const recordsAsc = useMemo(() => sortVariationOrdersAsc(records), [records]);

  async function addRecord() {
    if (!canEdit || adding) return;
    setAdding(true);
    const res = await fetch(`/api/projects/${projectId}/variation-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setAdding(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Variation orders</h2>
          <p className="text-sm text-slate-500">
            {records.length === 0
              ? "No variation order records yet."
              : `${records.length} record${records.length === 1 ? "" : "s"}`}
          </p>
          {originalContractSum != null && (
            <p className="text-sm text-slate-500">
              Original contract sum: {formatCurrency(originalContractSum)}
            </p>
          )}
        </div>
        {canEdit && (
          <Button type="button" onClick={addRecord} disabled={adding}>
            {adding ? "Adding…" : "Add record"}
          </Button>
        )}
      </div>

      <VariationOrdersSummaryTable records={records} />

      {recordsAsc.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-slate-500">
            Use Add record to create a variation order card.
          </CardContent>
        </Card>
      ) : (
        recordsAsc.map((record, index) => (
          <VariationOrderCard
            key={record.id}
            projectId={projectId}
            record={record}
            index={index}
            recordsAsc={recordsAsc}
            originalContractSum={originalContractSum}
            canEdit={canEdit}
          />
        ))
      )}

      {!canEdit && <p className="text-sm text-slate-500">Read-only access</p>}
    </div>
  );
}
