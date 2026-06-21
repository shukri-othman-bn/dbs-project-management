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
  computeExtensionOfTimeFields,
  sortExtensionOfTimesAsc,
  type ExtensionOfTimeCalcRecord,
} from "@/lib/extension-of-time-calculations";
import { formatDate, formatPercentTwoDecimals } from "@/lib/utils";

const EOT_DATE_FIELDS = [
  { name: "submittedToSbmDate", label: "EOT submitted to SBM date" },
  { name: "receivedByDbsoDate", label: "EOT received by DBSO" },
  { name: "committeeReviewDate", label: "EOT committee review" },
  { name: "submittedToDgoDate", label: "EOT submitted to DGO" },
  { name: "submittedToClientDate", label: "EOT submitted to client" },
  { name: "approvedDate", label: "EOT approved" },
] as const;

type ExtensionOfTime = ExtensionOfTimeCalcRecord & {
  submittedToSbmDate: Date | null;
  receivedByDbsoDate: Date | null;
  committeeReviewDate: Date | null;
  submittedToDgoDate: Date | null;
  submittedToClientDate: Date | null;
  eotPercent: number | null;
  revisedCompletionDate: Date | null;
  isLocked: boolean;
};

function ExtensionOfTimeSummaryTable({ records }: { records: ExtensionOfTime[] }) {
  const recordsAsc = useMemo(() => sortExtensionOfTimesAsc(records), [records]);

  if (recordsAsc.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extensions of time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveDataView
          mobile={
            <MobileCardList>
              {recordsAsc.map((eot, index) => (
                <MobileRecordCard key={eot.id} title={`EOT ${index + 1}`}>
                  <MobileField label="EOT period" value={eot.eotPeriod ?? "—"} />
                  <MobileField
                    label="EOT committee review"
                    value={formatDate(eot.committeeReviewDate)}
                  />
                  <MobileField
                    label="EOT submitted to DGO"
                    value={formatDate(eot.submittedToDgoDate)}
                  />
                  <MobileField
                    label="EOT submitted to client"
                    value={formatDate(eot.submittedToClientDate)}
                  />
                  <MobileField label="EOT approved" value={formatDate(eot.approvedDate)} />
                </MobileRecordCard>
              ))}
            </MobileCardList>
          }
          desktop={
            <DesktopDataTable dense>
              <thead>
                <tr className="border-b bg-slate-50 text-left text-slate-500">
                  <th className={desktopThClass}>EOT no.</th>
                  <th className={desktopThClass}>EOT period</th>
                  <th className={desktopThClass}>EOT committee review</th>
                  <th className={desktopThClass}>EOT submitted to DGO</th>
                  <th className={desktopThClass}>EOT submitted to client</th>
                  <th className={desktopThClass}>EOT approved</th>
                </tr>
              </thead>
              <tbody>
                {recordsAsc.map((eot, index) => (
                  <tr key={eot.id} className="border-b border-slate-100">
                    <td className={desktopTdClass}>EOT {index + 1}</td>
                    <td className={desktopTdClass}>{eot.eotPeriod ?? "—"}</td>
                    <td className={desktopTdClass}>{formatDate(eot.committeeReviewDate)}</td>
                    <td className={desktopTdClass}>{formatDate(eot.submittedToDgoDate)}</td>
                    <td className={desktopTdClass}>{formatDate(eot.submittedToClientDate)}</td>
                    <td className={desktopTdClass}>{formatDate(eot.approvedDate)}</td>
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

function ExtensionOfTimeCard({
  projectId,
  record,
  index,
  originalContractPeriod,
  canEdit,
}: {
  projectId: string;
  record: ExtensionOfTime;
  index: number;
  originalContractPeriod: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [eotPeriodText, setEotPeriodText] = useState(record.eotPeriod ?? "");
  const { dirty, resetDirty, formTrackProps } = useFormDirty();
  const formId = `extension-of-time-${record.id}`;

  const fieldsDisabled = !canEdit || (record.isLocked && !isEditing);
  const computed = useMemo(
    () => computeExtensionOfTimeFields(eotPeriodText.trim() || null, originalContractPeriod),
    [eotPeriodText, originalContractPeriod]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (fieldsDisabled) return;
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const body = {
      ...Object.fromEntries(EOT_DATE_FIELDS.map((field) => [field.name, form.get(field.name)])),
      eotPeriod: eotPeriodText.trim() || null,
      revisedCompletionDate: form.get("revisedCompletionDate"),
    };

    const res = await fetch(`/api/projects/${projectId}/extension-of-times/${record.id}`, {
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
    if (!confirm("Delete this extension of time record?")) return;
    setDeleting(true);
    const res = await fetch(`/api/projects/${projectId}/extension-of-times/${record.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    if (res.ok) router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2">
        <CardTitle className="text-base">Extension of time {index + 1}</CardTitle>
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
          {EOT_DATE_FIELDS.map((field) => (
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
            <Label htmlFor={`${record.id}-eotPeriod`}>EOT period</Label>
            <Input
              id={`${record.id}-eotPeriod`}
              name="eotPeriod"
              type="text"
              value={eotPeriodText}
              onChange={(e) => setEotPeriodText(e.target.value)}
              disabled={fieldsDisabled}
              placeholder="e.g. 50 days, 3 months, 2 months and 10 days"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor={`${record.id}-eotPercent`}>% EOT period</Label>
            <Input
              id={`${record.id}-eotPercent`}
              readOnly
              tabIndex={-1}
              value={
                computed.eotPercent != null ? formatPercentTwoDecimals(computed.eotPercent) : ""
              }
              disabled
              className="mt-1 bg-slate-50"
            />
          </div>
          <div>
            <Label htmlFor={`${record.id}-revisedCompletionDate`}>Revised completion date</Label>
            <Input
              id={`${record.id}-revisedCompletionDate`}
              name="revisedCompletionDate"
              type="date"
              defaultValue={toInputDate(record.revisedCompletionDate)}
              disabled={fieldsDisabled}
              className="mt-1"
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

export function ProjectExtensionOfTimePanel({
  projectId,
  records,
  originalContractPeriod,
  canEdit,
}: {
  projectId: string;
  records: ExtensionOfTime[];
  originalContractPeriod: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const recordsAsc = useMemo(() => sortExtensionOfTimesAsc(records), [records]);

  async function addRecord() {
    if (!canEdit || adding) return;
    setAdding(true);
    const res = await fetch(`/api/projects/${projectId}/extension-of-times`, {
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
          <h2 className="text-base font-semibold text-slate-900">Extensions of time</h2>
          <p className="text-sm text-slate-500">
            {records.length === 0
              ? "No extension of time records yet."
              : `${records.length} record${records.length === 1 ? "" : "s"}`}
          </p>
          {originalContractPeriod && (
            <p className="text-sm text-slate-500">
              Original contract period: {originalContractPeriod}
            </p>
          )}
        </div>
        {canEdit && (
          <Button type="button" onClick={addRecord} disabled={adding}>
            {adding ? "Adding…" : "Add record"}
          </Button>
        )}
      </div>

      <ExtensionOfTimeSummaryTable records={records} />

      {recordsAsc.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-slate-500">
            Use Add record to create an extension of time card.
          </CardContent>
        </Card>
      ) : (
        recordsAsc.map((record, index) => (
          <ExtensionOfTimeCard
            key={record.id}
            projectId={projectId}
            record={record}
            index={index}
            originalContractPeriod={originalContractPeriod}
            canEdit={canEdit}
          />
        ))
      )}

      {!canEdit && <p className="text-sm text-slate-500">Read-only access</p>}
    </div>
  );
}
