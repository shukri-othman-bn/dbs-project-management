"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

export function HeaderSvAmountField({
  projectId,
  value,
  canEdit,
}: {
  projectId: string;
  value?: number | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value != null ? String(value) : "");
  const [saving, setSaving] = useState(false);

  if (!canEdit) {
    return (
      <p className="mt-0.5 text-sm font-medium text-slate-900">
        {value != null ? formatCurrency(value) : "—"}
      </p>
    );
  }

  async function save(next: string) {
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}/tabs`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: "design",
          data: { svAmount: next === "" ? null : next },
        }),
      });
      router.refresh();
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <Input
        type="number"
        step="any"
        value={draft}
        disabled={saving}
        className="mt-0.5 h-8 text-sm"
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => save(draft)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void save(draft);
          }
          if (e.key === "Escape") {
            setDraft(value != null ? String(value) : "");
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      className="mt-0.5 text-left text-sm font-medium text-slate-900 hover:text-slate-600"
      onClick={() => {
        setDraft(value != null ? String(value) : "");
        setEditing(true);
      }}
    >
      {value != null ? formatCurrency(value) : "—"}
    </button>
  );
}
