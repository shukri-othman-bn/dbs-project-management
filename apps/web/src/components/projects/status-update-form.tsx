"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSaveActions, useFormDirty } from "@/components/ui/form-save-actions";

export function StatusUpdateForm({
  projectId,
  latest,
}: {
  projectId: string;
  latest?: {
    progressAsOf: Date;
    physicalActual: number;
    physicalScheduled: number;
    paymentActual: number;
    paymentScheduled: number;
    remarks: string | null;
    actionsRequired: string | null;
  } | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { dirty, resetDirty, formTrackProps } = useFormDirty();
  const today = new Date().toISOString().split("T")[0];
  const formId = `status-update-${projectId}`;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/projects/${projectId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        progressAsOf: form.get("progressAsOf"),
        physicalActual: parseFloat(form.get("physicalActual") as string) || 0,
        physicalScheduled: parseFloat(form.get("physicalScheduled") as string) || 0,
        paymentActual: parseFloat(form.get("paymentActual") as string) || 0,
        paymentScheduled: parseFloat(form.get("paymentScheduled") as string) || 0,
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
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Quick Status Update</CardTitle>
          <p className="text-sm text-slate-500">Weekly progress — saves in one step</p>
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
            <Label htmlFor="physicalActual">Physical Actual %</Label>
            <Input
              id="physicalActual"
              name="physicalActual"
              type="number"
              min="0"
              max="100"
              defaultValue={latest?.physicalActual ?? 0}
            />
          </div>
          <div>
            <Label htmlFor="physicalScheduled">Physical Scheduled %</Label>
            <Input
              id="physicalScheduled"
              name="physicalScheduled"
              type="number"
              min="0"
              max="100"
              defaultValue={latest?.physicalScheduled ?? 0}
            />
          </div>
          <div>
            <Label htmlFor="paymentActual">Payment Actual %</Label>
            <Input
              id="paymentActual"
              name="paymentActual"
              type="number"
              min="0"
              max="100"
              defaultValue={latest?.paymentActual ?? 0}
            />
          </div>
          <div>
            <Label htmlFor="paymentScheduled">Payment Scheduled %</Label>
            <Input
              id="paymentScheduled"
              name="paymentScheduled"
              type="number"
              min="0"
              max="100"
              defaultValue={latest?.paymentScheduled ?? 0}
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
            <Label htmlFor="actionsRequired">Actions Required</Label>
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
  );
}
