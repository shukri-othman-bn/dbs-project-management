"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { formatDate, formatPercentTwoDecimals } from "@/lib/utils";

export type ProgressUpdateRecord = {
  id: string;
  progressAsOf: Date;
  physicalActual: number;
  physicalScheduled: number;
  paymentActual: number;
  paymentScheduled: number;
  remarks: string | null;
  actionsRequired: string | null;
};

type LatestProgress = ProgressUpdateRecord | null;

function sortRecordsAsc(records: ProgressUpdateRecord[]) {
  return [...records].sort(
    (a, b) => new Date(a.progressAsOf).getTime() - new Date(b.progressAsOf).getTime()
  );
}

function PhysicalProgressTable({ records }: { records: ProgressUpdateRecord[] }) {
  if (records.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Physical progress</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveDataView
          mobile={
            <MobileCardList>
              {records.map((record) => (
                <MobileRecordCard key={record.id} title={formatDate(record.progressAsOf)}>
                  <MobileField
                    label="Physical actual %"
                    value={formatPercentTwoDecimals(record.physicalActual)}
                  />
                  <MobileField
                    label="Physical schedule %"
                    value={formatPercentTwoDecimals(record.physicalScheduled)}
                  />
                </MobileRecordCard>
              ))}
            </MobileCardList>
          }
          desktop={
            <DesktopDataTable dense>
              <thead>
                <tr className="border-b bg-slate-50 text-left text-slate-500">
                  <th className={desktopThClass}>Progress as of date</th>
                  <th className={desktopThClass}>Physical actual %</th>
                  <th className={desktopThClass}>Physical schedule %</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-slate-100">
                    <td className={desktopTdClass}>{formatDate(record.progressAsOf)}</td>
                    <td className={desktopTdClass}>
                      {formatPercentTwoDecimals(record.physicalActual)}
                    </td>
                    <td className={desktopTdClass}>
                      {formatPercentTwoDecimals(record.physicalScheduled)}
                    </td>
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

function FinancialProgressTable({ records }: { records: ProgressUpdateRecord[] }) {
  if (records.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial progress</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveDataView
          mobile={
            <MobileCardList>
              {records.map((record) => (
                <MobileRecordCard key={record.id} title={formatDate(record.progressAsOf)}>
                  <MobileField
                    label="Payment actual %"
                    value={formatPercentTwoDecimals(record.paymentActual)}
                  />
                  <MobileField
                    label="Payment schedule %"
                    value={formatPercentTwoDecimals(record.paymentScheduled)}
                  />
                </MobileRecordCard>
              ))}
            </MobileCardList>
          }
          desktop={
            <DesktopDataTable dense>
              <thead>
                <tr className="border-b bg-slate-50 text-left text-slate-500">
                  <th className={desktopThClass}>Progress as of date</th>
                  <th className={desktopThClass}>Payment actual %</th>
                  <th className={desktopThClass}>Payment schedule %</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-slate-100">
                    <td className={desktopTdClass}>{formatDate(record.progressAsOf)}</td>
                    <td className={desktopTdClass}>
                      {formatPercentTwoDecimals(record.paymentActual)}
                    </td>
                    <td className={desktopTdClass}>
                      {formatPercentTwoDecimals(record.paymentScheduled)}
                    </td>
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

export function PhysicalProgressPanel({
  projectId,
  records,
  latest,
  canEdit,
}: {
  projectId: string;
  records: ProgressUpdateRecord[];
  latest: LatestProgress;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { dirty, resetDirty, formTrackProps } = useFormDirty();
  const today = new Date().toISOString().split("T")[0];
  const formId = `physical-progress-${projectId}`;
  const recordsAsc = useMemo(() => sortRecordsAsc(records), [records]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canEdit) return;
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/projects/${projectId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "physical",
        progressAsOf: form.get("progressAsOf"),
        physicalActual: parseFloat(form.get("physicalActual") as string) || 0,
        physicalScheduled: parseFloat(form.get("physicalScheduled") as string) || 0,
        remarks: form.get("remarks"),
        actionsRequired: form.get("actionsRequired"),
      }),
    });
    setLoading(false);
    if (res.ok) {
      setMessage("Saved");
      resetDirty();
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } else {
      setMessage("Failed to save");
    }
  }

  return (
    <div className="space-y-4">
      <PhysicalProgressTable records={recordsAsc} />

      {canEdit ? (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Physical progress update</CardTitle>
              <p className="text-sm text-slate-500">Record physical completion against schedule</p>
            </div>
            <FormSaveActions
              formId={formId}
              loading={loading}
              message={message}
              dirty={dirty}
              className="ml-auto shrink-0"
            />
          </CardHeader>
          <CardContent>
            <form
              id={formId}
              onSubmit={handleSubmit}
              className="grid gap-4 sm:grid-cols-2"
              {...formTrackProps}
            >
              <div>
                <Label htmlFor="progressAsOf">Progress as of</Label>
                <Input
                  id="progressAsOf"
                  name="progressAsOf"
                  type="date"
                  defaultValue={today}
                  required
                />
              </div>
              <div />
              <div>
                <Label htmlFor="physicalActual">Physical actual %</Label>
                <Input
                  id="physicalActual"
                  name="physicalActual"
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  defaultValue={latest?.physicalActual ?? 0}
                />
              </div>
              <div>
                <Label htmlFor="physicalScheduled">Physical scheduled %</Label>
                <Input
                  id="physicalScheduled"
                  name="physicalScheduled"
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  defaultValue={latest?.physicalScheduled ?? 0}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="remarks">Remarks</Label>
                <textarea
                  id="remarks"
                  name="remarks"
                  rows={3}
                  defaultValue={latest?.remarks ?? ""}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="actionsRequired">Actions required</Label>
                <textarea
                  id="actionsRequired"
                  name="actionsRequired"
                  rows={2}
                  defaultValue={latest?.actionsRequired ?? ""}
                  placeholder="What needs attention from management?"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <FormSaveActions loading={loading} message={message} dirty={dirty} />
              </div>
            </form>
          </CardContent>
        </Card>
      ) : records.length === 0 ? (
        <p className="text-sm text-slate-500">Read-only access</p>
      ) : null}
    </div>
  );
}

export function FinancialProgressPanel({
  projectId,
  records,
  latest,
  canEdit,
}: {
  projectId: string;
  records: ProgressUpdateRecord[];
  latest: LatestProgress;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { dirty, resetDirty, formTrackProps } = useFormDirty();
  const today = new Date().toISOString().split("T")[0];
  const formId = `financial-progress-${projectId}`;
  const recordsAsc = useMemo(() => sortRecordsAsc(records), [records]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canEdit) return;
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/projects/${projectId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "financial",
        progressAsOf: form.get("progressAsOf"),
        paymentActual: parseFloat(form.get("paymentActual") as string) || 0,
        paymentScheduled: parseFloat(form.get("paymentScheduled") as string) || 0,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setMessage("Saved");
      resetDirty();
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } else {
      setMessage("Failed to save");
    }
  }

  return (
    <div className="space-y-4">
      <FinancialProgressTable records={recordsAsc} />

      {canEdit ? (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Financial progress update</CardTitle>
              <p className="text-sm text-slate-500">Record payment progress against schedule</p>
            </div>
            <FormSaveActions
              formId={formId}
              loading={loading}
              message={message}
              dirty={dirty}
              className="ml-auto shrink-0"
            />
          </CardHeader>
          <CardContent>
            <form
              id={formId}
              onSubmit={handleSubmit}
              className="grid gap-4 sm:grid-cols-2"
              {...formTrackProps}
            >
              <div>
                <Label htmlFor="financialProgressAsOf">Progress as of</Label>
                <Input
                  id="financialProgressAsOf"
                  name="progressAsOf"
                  type="date"
                  defaultValue={today}
                  required
                />
              </div>
              <div />
              <div>
                <Label htmlFor="paymentActual">Payment actual %</Label>
                <Input
                  id="paymentActual"
                  name="paymentActual"
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  defaultValue={latest?.paymentActual ?? 0}
                />
              </div>
              <div>
                <Label htmlFor="paymentScheduled">Payment scheduled %</Label>
                <Input
                  id="paymentScheduled"
                  name="paymentScheduled"
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  defaultValue={latest?.paymentScheduled ?? 0}
                />
              </div>
              <div className="sm:col-span-2">
                <FormSaveActions loading={loading} message={message} dirty={dirty} />
              </div>
            </form>
          </CardContent>
        </Card>
      ) : records.length === 0 ? (
        <p className="text-sm text-slate-500">Read-only access</p>
      ) : null}
    </div>
  );
}
