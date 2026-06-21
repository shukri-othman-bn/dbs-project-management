"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { ChartContainer } from "@/components/charts/chart-container";
import type { UnitBudgetRow } from "@/lib/data";

const STACK_ID = "unitBudget";

const SEGMENTS = [
  { key: "encumbrance", label: "Encumbrance amount", fill: "#059669" },
  { key: "balanceAllocation", label: "Balance allocation", fill: "#7c3aed" },
] as const;

type ChartRow = {
  unit: string;
  allocation: number;
  encumbrance: number;
  encumbranceWithin: number;
  balanceAllocation: number;
  encumbranceExcess: number;
};

function buildChartData(units: UnitBudgetRow[]): ChartRow[] {
  return units
    .filter((unit) => unit.allocation > 0 || unit.encumbrance > 0)
    .map((unit) => ({
      unit: unit.unit,
      allocation: unit.allocation,
      encumbrance: unit.encumbrance,
      encumbranceWithin: Math.min(unit.encumbrance, unit.allocation),
      balanceAllocation: Math.max(0, unit.balanceAllocation),
      encumbranceExcess: Math.max(0, unit.encumbrance - unit.allocation),
    }));
}

function UnitAllocationEncumbranceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ChartRow }[];
}) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload;
  if (!row) return null;

  const overEncumbered = row.encumbrance > row.allocation;

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-2 font-semibold text-slate-900">{row.unit}</p>
      <dl className="space-y-1">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Budget allocation</dt>
          <dd className="font-medium text-slate-900">{formatCurrency(row.allocation)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Encumbrance amount</dt>
          <dd className={overEncumbered ? "font-medium text-red-600" : "font-medium text-slate-900"}>
            {formatCurrency(row.encumbrance)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Balance allocation</dt>
          <dd className="font-medium text-slate-900">
            {formatCurrency(Math.max(0, row.balanceAllocation))}
          </dd>
        </div>
      </dl>
      {overEncumbered && (
        <p className="mt-2 font-medium text-red-600">
          Exceeds allocation by {formatCurrency(row.encumbranceExcess)}
        </p>
      )}
    </div>
  );
}

function UnitBudgetLegend({
  compact,
  showExcess,
}: {
  compact?: boolean;
  showExcess?: boolean;
}) {
  return (
    <div
      className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2"
      style={{ fontSize: compact ? 11 : 12 }}
    >
      {SEGMENTS.map((item) => (
        <div key={item.key} className="flex items-center gap-1.5 text-slate-600">
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: item.fill }}
          />
          <span>{item.label}</span>
        </div>
      ))}
      {showExcess && (
        <div className="flex items-center gap-1.5 text-slate-600">
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm bg-red-600" />
          <span>Over allocation</span>
        </div>
      )}
    </div>
  );
}

export function UnitAllocationEncumbranceChart({
  units,
  compact = false,
}: {
  units: UnitBudgetRow[];
  compact?: boolean;
}) {
  const data = buildChartData(units);
  const showExcess = data.some((row) => row.encumbranceExcess > 0);
  const height = compact ? 260 : 320;

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-slate-500"
        style={{ height: compact ? 220 : 280 }}
      >
        No unit budget data yet
      </div>
    );
  }

  return (
    <div>
      <ChartContainer height={height}>
        <ResponsiveContainer width="100%" height={height} minWidth={0}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
            barCategoryGap={compact ? "20%" : "25%"}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="unit"
              tick={{ fontSize: compact ? 11 : 12, fontWeight: 600 }}
            />
            <YAxis
              tick={{ fontSize: compact ? 11 : 12 }}
              tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<UnitAllocationEncumbranceTooltip />} />
            <Legend content={() => null} />
            {SEGMENTS.map(({ key, fill, label }) => (
              <Bar
                key={key}
                stackId={STACK_ID}
                dataKey={key === "encumbrance" ? "encumbranceWithin" : key}
                name={label}
                fill={fill}
                radius={0}
                legendType="square"
              />
            ))}
            <Bar
              stackId={STACK_ID}
              dataKey="encumbranceExcess"
              name="Over allocation"
              fill="#dc2626"
              radius={[4, 4, 0, 0]}
              legendType="square"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
      <UnitBudgetLegend compact={compact} showExcess={showExcess} />
      {!compact && (
        <p className="mt-1 text-center text-xs text-slate-500">
          Each bar shows unit budget allocation split into encumbrance amount and balance allocation
        </p>
      )}
    </div>
  );
}
