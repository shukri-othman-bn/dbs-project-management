"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
      <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
      <p className="max-w-md text-sm text-slate-600">
        The app could not load this page. This is often caused by the database not being
        connected, the schema being out of date after a code update, or the database not
        being seeded yet.
      </p>
      {process.env.NODE_ENV === "development" && error.message ? (
        <p className="max-w-md rounded-lg bg-red-50 px-3 py-2 text-left font-mono text-xs text-red-800">
          {error.message}
        </p>
      ) : null}
      {error.digest && (
        <p className="text-xs text-slate-400">Reference: {error.digest}</p>
      )}
      <div className="flex gap-2">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="secondary" onClick={() => (window.location.href = "/login")}>
          Go to login
        </Button>
      </div>
      <p className="text-xs text-slate-400">
        Admin: open <code className="rounded bg-slate-200 px-1">/api/health</code> to check the database.
      </p>
    </div>
  );
}
