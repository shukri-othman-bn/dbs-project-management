"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSaveActions, useFormDirty } from "@/components/ui/form-save-actions";
import { CONTRACT_CATEGORY_LABELS, LIFECYCLE_STAGES, PROJECT_TYPES, PROJECT_TYPE_LABELS, STAGE_STATUS_LABELS } from "@/lib/project-labels";
import { formatUnitOptionLabel, type UnitSectionOption } from "@/lib/units";

type Option = UnitSectionOption;

export function ProjectForm({
  sections,
  ministries,
  fundingTypes,
  currentFyId,
  currentFyLabel,
  defaultSectionId,
  project,
}: {
  sections: Option[];
  ministries: string[];
  fundingTypes: Option[];
  currentFyId?: string;
  currentFyLabel?: string;
  defaultSectionId?: string;
  project?: {
    id: string;
    projectNumber: string;
    title: string;
    lifecycleStage: string;
    sectionId: string | null;
    clientMinistry?: string | null;
    clientDepartment?: string | null;
    fundingTypeId: string | null;
    oicName: string | null;
    oicEmail: string | null;
    toMonitor: boolean;
    quotationOrContractNo?: string | null;
    projectType?: string | null;
    contractCategory?: string | null;
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
              {PROJECT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PROJECT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="lifecycleStage">Stage</Label>
            <select
              id="lifecycleStage"
              name="lifecycleStage"
              defaultValue={project?.lifecycleStage ?? "pre_design"}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {LIFECYCLE_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_STATUS_LABELS[stage]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="sectionId">Unit (Head of Unit)</Label>
            <select
              id="sectionId"
              name="sectionId"
              defaultValue={project?.sectionId ?? defaultSectionId ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Select —</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatUnitOptionLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="oicName">Project OIC — Full name</Label>
              <Input
                id="oicName"
                name="oicName"
                defaultValue={project?.oicName ?? ""}
                placeholder="Full name of officer in charge"
              />
            </div>
            <div>
              <Label htmlFor="oicEmail">Govt email</Label>
              <Input
                id="oicEmail"
                name="oicEmail"
                type="email"
                defaultValue={project?.oicEmail ?? ""}
                placeholder="name@ministry.gov.bn"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="clientMinistry">Client ministry</Label>
              <Input
                id="clientMinistry"
                name="clientMinistry"
                list="clientMinistries"
                defaultValue={project?.clientMinistry ?? ""}
                placeholder="e.g. Ministry of Education"
              />
              <datalist id="clientMinistries">
                {ministries.map((ministry) => (
                  <option key={ministry} value={ministry} />
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor="clientDepartment">Client department</Label>
              <Input
                id="clientDepartment"
                name="clientDepartment"
                defaultValue={project?.clientDepartment ?? ""}
                placeholder="e.g. School Infrastructure"
              />
            </div>
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
