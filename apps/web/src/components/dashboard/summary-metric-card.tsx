import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type SummaryMetricCardProps = {
  label: string;
  definition?: string;
  value: ReactNode;
  valueClassName?: string;
  footer?: ReactNode;
};

export function SummaryMetricCard({
  label,
  definition,
  value,
  valueClassName,
  footer,
}: SummaryMetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-slate-500">{label}</p>
        {definition ? (
          <p className="mt-0.5 text-xs text-slate-400">{definition}</p>
        ) : null}
        <p className={cn("text-3xl font-bold", valueClassName)}>{value}</p>
        {footer}
      </CardContent>
    </Card>
  );
}
