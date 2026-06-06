"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ChartContainer({
  height,
  children,
  className,
}: {
  height: number;
  children: ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={cn("w-full min-w-0", className)} style={{ height }}>
      {mounted ? children : null}
    </div>
  );
}
