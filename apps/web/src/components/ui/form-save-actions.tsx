"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function useFormDirty() {
  const [dirty, setDirty] = useState(false);

  return {
    dirty,
    markDirty: () => setDirty(true),
    resetDirty: () => setDirty(false),
    formTrackProps: {
      onChange: () => setDirty(true),
      onInput: () => setDirty(true),
    },
  };
}

type FormSaveActionsProps = {
  loading?: boolean;
  message?: string;
  dirty?: boolean;
  label?: string;
  className?: string;
  formId?: string;
};

export function FormSaveActions({
  loading = false,
  message,
  dirty = false,
  label = "Save",
  className,
  formId,
}: FormSaveActionsProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <Button type="submit" form={formId} disabled={loading} size="sm">
        {loading ? "Saving..." : label}
      </Button>
      {message ? (
        <span
          className={
            message === "Saved" ? "text-sm text-emerald-700" : "text-sm text-red-600"
          }
        >
          {message}
        </span>
      ) : dirty ? (
        <span className="text-xs text-amber-700">Unsaved changes</span>
      ) : null}
    </div>
  );
}
