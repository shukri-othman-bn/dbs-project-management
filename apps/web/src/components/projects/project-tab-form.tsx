"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSaveActions, useFormDirty } from "@/components/ui/form-save-actions";
import { cn } from "@/lib/utils";

export type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea";
  colSpan?: 1 | 2 | 3;
};

function Field({
  name,
  label,
  type = "text",
  defaultValue,
  colSpan = 1,
}: FieldConfig & { defaultValue?: string | number | null }) {
  const val = defaultValue ?? "";
  const span =
    colSpan === 3 ? "sm:col-span-3" : colSpan === 2 ? "sm:col-span-2" : "";

  return (
    <div className={span}>
      <Label>{label}</Label>
      {type === "textarea" ? (
        <textarea
          name={name}
          rows={3}
          defaultValue={String(val)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      ) : (
        <Input
          name={name}
          type={type}
          defaultValue={val === "" ? "" : String(val)}
          className="mt-1"
          step={type === "number" ? "any" : undefined}
        />
      )}
    </div>
  );
}

export function ProjectTabForm({
  projectId,
  tab,
  title,
  fields,
  defaultValues,
  canEdit,
  columns = 3,
}: {
  projectId: string;
  tab: string;
  title?: string;
  fields: FieldConfig[];
  defaultValues: Record<string, string | number | null | undefined>;
  canEdit: boolean;
  columns?: 2 | 3;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { dirty, resetDirty, formTrackProps } = useFormDirty();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canEdit) return;
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {};
    fields.forEach((f) => {
      data[f.name] = form.get(f.name);
    });
    const res = await fetch(`/api/projects/${projectId}/tabs`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tab, data }),
    });
    setLoading(false);
    if (res.ok) {
      setMessage("Saved");
      resetDirty();
      router.refresh();
    } else {
      setMessage("Failed to save");
    }
  }

  const colClass = columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3";
  const formId = `project-tab-${tab}`;

  return (
    <Card>
      {(title || canEdit) && (
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2">
          {title ? <CardTitle className="text-base">{title}</CardTitle> : <span />}
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
      )}
      <CardContent className={cn(!title && !canEdit && "pt-6", title && !canEdit && "pt-0")}>
        <form
          id={formId}
          onSubmit={handleSubmit}
          className={`grid gap-4 ${colClass}`}
          {...(canEdit ? formTrackProps : {})}
        >
          {fields.map((f) => (
            <Field key={f.name} {...f} defaultValue={defaultValues[f.name]} />
          ))}
          {canEdit && (
            <div className="sm:col-span-full">
              <FormSaveActions loading={loading} message={message} dirty={dirty} />
            </div>
          )}
        </form>
        {!canEdit && <p className="text-sm text-slate-500">Read-only access</p>}
      </CardContent>
    </Card>
  );
}
