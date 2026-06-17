"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSaveActions, useFormDirty } from "@/components/ui/form-save-actions";
import { formatCurrency } from "@/lib/utils";

type FsorStatus = {
  online: boolean;
  jobOrderCount: number;
  byStatus: Record<string, number>;
  committedTotal: number;
  ceilingAmount: number;
  remaining: number;
  lastSyncedAt: string | null;
  jobOrders: Array<{
    id: string;
    buildingName: string;
    visitDate: string;
    grandTotal: number;
    status: string;
    instructionNo?: string;
  }>;
};

export function ProjectFsorPanel({
  projectId,
  fsorAppUrl,
  canEdit,
  defaultValues,
}: {
  projectId: string;
  fsorAppUrl: string;
  canEdit: boolean;
  defaultValues: {
    defaultBidPercent: number;
    pwdNo: string;
    others: string;
    soiRef: string;
    signatoryName: string;
    signatoryTitle: string;
    scopeDescription: string;
    buildings: string;
    lastSyncedAt: string | null;
  };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<FsorStatus | null>(null);
  const { dirty, resetDirty, formTrackProps } = useFormDirty();
  const formId = `project-fsor-${projectId}`;

  const mobileUrl = `${fsorAppUrl}/mobile/?contractId=${encodeURIComponent(projectId)}`;
  const portalUrl = `${fsorAppUrl}/web/?contractId=${encodeURIComponent(projectId)}`;

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/fsor-status`, { cache: "no-store" });
      if (res.ok) setStatus(await res.json());
    } catch {
      setStatus(null);
    }
  }, [projectId]);

  useEffect(() => {
    loadStatus();
    const timer = setInterval(loadStatus, 5000);
    return () => clearInterval(timer);
  }, [loadStatus]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canEdit) return;
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());
    const res = await fetch(`/api/projects/${projectId}/tabs`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tab: "fsor", data }),
    });
    setLoading(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(body.error ?? "Failed to save");
      return;
    }
    resetDirty();
    if (body.fsorSync?.ok === false) {
      setMessage(`Saved — FSOR sync: ${body.fsorSync.error ?? "failed"}`);
    } else if (body.fsorSync?.ok) {
      setMessage("Saved and synced to FSOR");
    } else {
      setMessage("Saved");
    }
    router.refresh();
    loadStatus();
  }

  async function handleSyncNow() {
    setSyncing(true);
    setMessage("");
    const res = await fetch(`/api/projects/${projectId}/fsor-sync`, { method: "POST" });
    setSyncing(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(body.error ?? "Sync failed");
      return;
    }
    setMessage("Synced to FSOR");
    router.refresh();
    loadStatus();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Open FSOR app</CardTitle>
          <div className="flex flex-wrap gap-2">
            <a
              href={mobileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Site app (mobile)
            </a>
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Office portal
            </a>
            {canEdit && (
              <Button type="button" size="sm" onClick={handleSyncNow} disabled={syncing}>
                {syncing ? "Syncing…" : "Sync to FSOR"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-1">
          <p>
            FSOR server:{" "}
            <span className={status?.online ? "text-emerald-700 font-medium" : "text-amber-700 font-medium"}>
              {status?.online ? "Online" : "Offline — start FSOR serve.ps1"}
            </span>
          </p>
          {defaultValues.lastSyncedAt && (
            <p>
              Last synced from DPM:{" "}
              {new Date(defaultValues.lastSyncedAt).toLocaleString("en-GB")}
            </p>
          )}
        </CardContent>
      </Card>

      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">FSOR job orders (live)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase text-slate-500">Job orders</p>
                <p className="text-lg font-semibold text-slate-900">{status.jobOrderCount}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Committed</p>
                <p className="text-lg font-semibold text-slate-900">
                  {formatCurrency(status.committedTotal)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Remaining ceiling</p>
                <p className="text-lg font-semibold text-slate-900">
                  {formatCurrency(status.remaining)}
                </p>
              </div>
            </div>
            {Object.keys(status.byStatus).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(status.byStatus).map(([s, n]) => (
                  <span
                    key={s}
                    className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                  >
                    {s.replace(/_/g, " ")}: {n}
                  </span>
                ))}
              </div>
            )}
            {status.jobOrders.length > 0 ? (
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {status.jobOrders.map((jo) => (
                  <li key={jo.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="text-slate-800">
                      {jo.instructionNo ? `JO ${jo.instructionNo} · ` : ""}
                      {jo.buildingName} · {jo.visitDate}
                    </span>
                    <span className="text-slate-600">{formatCurrency(jo.grandTotal)}</span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                      {jo.status.replace(/_/g, " ")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No job orders in FSOR for this project yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">FSOR contract settings</CardTitle>
          {canEdit && (
            <FormSaveActions
              formId={formId}
              loading={loading}
              message={message}
              dirty={dirty}
              className="ml-auto"
            />
          )}
        </CardHeader>
        <CardContent>
          <form id={formId} onSubmit={handleSubmit} className="grid gap-4 max-w-2xl" {...(canEdit ? formTrackProps : {})}>
            <div>
              <Label htmlFor="defaultBidPercent">Default contractor bid %</Label>
              <Input
                id="defaultBidPercent"
                name="defaultBidPercent"
                type="number"
                step="0.01"
                defaultValue={defaultValues.defaultBidPercent}
                className="mt-1"
                disabled={!canEdit}
              />
            </div>
            <div>
              <Label htmlFor="buildings">Buildings in scope *</Label>
              <textarea
                id="buildings"
                name="buildings"
                rows={5}
                defaultValue={defaultValues.buildings}
                placeholder="One building name per line"
                disabled={!canEdit}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
              <p className="mt-1 text-xs text-slate-500">OICs select from this list on the FSOR mobile app.</p>
            </div>
            <div>
              <Label htmlFor="soiRef">S.O. Ref / Ruj.</Label>
              <Input id="soiRef" name="soiRef" defaultValue={defaultValues.soiRef} className="mt-1" disabled={!canEdit} />
            </div>
            <div>
              <Label htmlFor="pwdNo">PWD No. / No. JKR</Label>
              <Input id="pwdNo" name="pwdNo" defaultValue={defaultValues.pwdNo} className="mt-1" disabled={!canEdit} />
            </div>
            <div>
              <Label htmlFor="others">Others / Lain-lain</Label>
              <Input id="others" name="others" defaultValue={defaultValues.others} className="mt-1" disabled={!canEdit} />
            </div>
            <div>
              <Label htmlFor="signatoryName">Signatory name</Label>
              <Input
                id="signatoryName"
                name="signatoryName"
                defaultValue={defaultValues.signatoryName}
                className="mt-1"
                disabled={!canEdit}
              />
            </div>
            <div>
              <Label htmlFor="signatoryTitle">Signatory title</Label>
              <textarea
                id="signatoryTitle"
                name="signatoryTitle"
                rows={2}
                defaultValue={defaultValues.signatoryTitle}
                disabled={!canEdit}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="scopeDescription">Scope of contract</Label>
              <textarea
                id="scopeDescription"
                name="scopeDescription"
                rows={3}
                defaultValue={defaultValues.scopeDescription}
                disabled={!canEdit}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            {message && <p className="text-sm text-slate-600">{message}</p>}
            {canEdit && (
              <FormSaveActions loading={loading} message={message} dirty={dirty} />
            )}
          </form>
          {!canEdit && <p className="text-sm text-slate-500">Read-only access</p>}
        </CardContent>
      </Card>
    </div>
  );
}
