"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      router.refresh();
    } else {
      setMessage("Failed to save");
    }
  }

  const colClass = columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3";

  return (
    <Card>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(!title && "pt-6")}>
        <form onSubmit={handleSubmit} className={`grid gap-4 ${colClass}`}>
          {fields.map((f) => (
            <Field key={f.name} {...f} defaultValue={defaultValues[f.name]} />
          ))}
          {canEdit && (
            <div className="flex items-center gap-3 pt-2 sm:col-span-full">
              <Button type="submit" disabled={loading} size="sm">
                {loading ? "Saving..." : "Save changes"}
              </Button>
              {message && (
                <span
                  className={
                    message === "Saved" ? "text-sm text-emerald-700" : "text-sm text-red-600"
                  }
                >
                  {message}
                </span>
              )}
            </div>
          )}
        </form>
        {!canEdit && <p className="text-sm text-slate-500">Read-only access</p>}
      </CardContent>
    </Card>
  );
}
