"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSaveActions, useFormDirty } from "@/components/ui/form-save-actions";
import { CONTRACT_CATEGORY_LABELS, STAGE_STATUS_LABELS } from "@/lib/project-labels";

type Option = { id: string; name?: string; ministry?: string; department?: string | null };

export function ProjectForm({
  sections,
  clients,
  fundingTypes,
  officers,
  currentFyId,
  defaultOicId,
  defaultSectionId,
  project,
}: {
  sections: Option[];
  clients: Option[];
  fundingTypes: Option[];
  officers: { id: string; name: string }[];
  currentFyId?: string;
  defaultOicId?: string;
  defaultSectionId?: string;
  project?: {
    id: string;
    projectNumber: string;
    title: string;
    lifecycleStage: string;
    sectionId: string | null;
    clientId: string | null;
    fundingTypeId: string | null;
    oicUserId: string | null;
    toMonitor: boolean;
    team: string | null;
    allocation?: number;
    quotationOrContractNo?: string | null;
    projectType?: string | null;
    contractCategory?: string | null;
    contractorName?: string | null;
    supervisingOfficer?: string | null;
  };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { dirty, resetDirty, formTrackProps } = useFormDirty();
  const formId = project ? `project-edit-${project.id}` : "project-new";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());
    const url = project ? `/api/projects/${project.id}` : "/api/projects";
    const method = project ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        toMonitor: form.get("toMonitor") === "on",
        allocation: parseFloat(body.allocation as string) || 0,
        financialYearId: currentFyId,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save");
      return;
    }
    const data = await res.json();
    resetDirty();
    router.push(`/projects/${data.id}`);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-base">
          {project ? "Edit project" : "New project"}
        </CardTitle>
        <FormSaveActions
          formId={formId}
          loading={loading}
          message={error ? "Failed to save" : undefined}
          dirty={dirty}
          className="ml-auto"
        />
      </CardHeader>
      <CardContent>
        <form
          id={formId}
          onSubmit={handleSubmit}
          className="grid gap-4 max-w-2xl"
          {...formTrackProps}
        >
          <div>
            <Label htmlFor="projectNumber">Project Number *</Label>
            <Input
              id="projectNumber"
              name="projectNumber"
              defaultValue={project?.projectNumber}
              required
              disabled={!!project}
            />
          </div>
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input id="title" name="title" defaultValue={project?.title} required />
          </div>
          <div>
            <Label htmlFor="quotationOrContractNo">Quotation / Contract No</Label>
            <Input
              id="quotationOrContractNo"
              name="quotationOrContractNo"
              defaultValue={project?.quotationOrContractNo ?? project?.projectNumber}
            />
          </div>
          <div>
            <Label htmlFor="contractCategory">Contract Category *</Label>
            <select
              id="contractCategory"
              name="contractCategory"
              defaultValue={project?.contractCategory ?? ""}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Select —</option>
              {Object.entries(CONTRACT_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="projectType">Project Type</Label>
            <select
              id="projectType"
              name="projectType"
              defaultValue={project?.projectType ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Select —</option>
              <option value="quotations">Quotations</option>
              <option value="contract_works">Contract Works</option>
              <option value="consultancy">Consultancy</option>
              <option value="maintenance">Maintenance</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <Label htmlFor="contractorName">Contractor</Label>
            <Input id="contractorName" name="contractorName" defaultValue={project?.contractorName ?? ""} />
          </div>
          <div>
            <Label htmlFor="supervisingOfficer">Supervising Officer</Label>
            <Input
              id="supervisingOfficer"
              name="supervisingOfficer"
              defaultValue={project?.supervisingOfficer ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="lifecycleStage">Stage</Label>
            <select
              id="lifecycleStage"
              name="lifecycleStage"
              defaultValue={project?.lifecycleStage ?? "planning"}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="planning">{STAGE_STATUS_LABELS.planning}</option>
              <option value="pre_contract">{STAGE_STATUS_LABELS.pre_contract}</option>
              <option value="contract">{STAGE_STATUS_LABELS.contract}</option>
              <option value="ongoing">{STAGE_STATUS_LABELS.ongoing}</option>
              <option value="closed">{STAGE_STATUS_LABELS.closed}</option>
            </select>
          </div>
          <div>
            <Label htmlFor="sectionId">Section</Label>
            <select
              id="sectionId"
              name="sectionId"
              defaultValue={project?.sectionId ?? defaultSectionId ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Select —</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="oicUserId">Project OIC</Label>
            <select
              id="oicUserId"
              name="oicUserId"
              defaultValue={project?.oicUserId ?? defaultOicId ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Select —</option>
              {officers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="clientId">Client</Label>
            <select
              id="clientId"
              name="clientId"
              defaultValue={project?.clientId ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Select —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.ministry}
                  {c.department ? ` — ${c.department}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="fundingTypeId">Funding Type</Label>
            <select
              id="fundingTypeId"
              name="fundingTypeId"
              defaultValue={project?.fundingTypeId ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Select —</option>
              {fundingTypes.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          {!project && currentFyId && (
            <div>
              <Label htmlFor="allocation">FY Allocation ($)</Label>
              <Input
                id="allocation"
                name="allocation"
                type="number"
                min="0"
                step="1000"
                defaultValue={0}
              />
            </div>
          )}
          <div>
            <Label htmlFor="team">Team</Label>
            <Input id="team" name="team" defaultValue={project?.team ?? ""} />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="toMonitor"
              name="toMonitor"
              defaultChecked={project?.toMonitor}
              className="rounded"
            />
            <Label htmlFor="toMonitor" className="mb-0">
              Flag for director monitoring
            </Label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <FormSaveActions
              loading={loading}
              message={error ? "Failed to save" : undefined}
              dirty={dirty}
            />
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
