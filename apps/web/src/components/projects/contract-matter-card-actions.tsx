"use client";

import { Button } from "@/components/ui/button";
import { FormSaveActions } from "@/components/ui/form-save-actions";
import { cn } from "@/lib/utils";

export function ContractMatterCardActions({
  formId,
  canEdit,
  isLocked,
  isEditing,
  onEdit,
  loading,
  message,
  dirty,
  className,
}: {
  formId: string;
  canEdit: boolean;
  isLocked: boolean;
  isEditing: boolean;
  onEdit: () => void;
  loading?: boolean;
  message?: string;
  dirty?: boolean;
  className?: string;
}) {
  if (!canEdit) return null;

  if (isLocked && !isEditing) {
    return (
      <div className={cn("flex flex-wrap items-center gap-3", className)}>
        <Button type="button" size="sm" onClick={onEdit}>
          Edit
        </Button>
        {message ? (
          <span
            className={
              message === "Saved" ? "text-sm text-emerald-700" : "text-sm text-red-600"
            }
          >
            {message}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <FormSaveActions
      formId={formId}
      loading={loading}
      message={message}
      dirty={dirty}
      className={className}
    />
  );
}
