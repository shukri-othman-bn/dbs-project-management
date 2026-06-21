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
import {
  DEPARTMENT_FUNDING_TYPE_NAMES,
  fundingTypeCode,
  fundingTypeLabel,
} from "@/lib/funding-types";
import type { FundingTypeBudgetRow } from "@/lib/data";

const STACK_ID = "allocation";

const SEGMENTS = [
  { key: "spent", label: "Certified payments", fill: "#047857", legend: false },
  { key: "encumbranceBalance", label: "Encumbrance balance", fill: "#34d399", legend: true },
  { key: "balanceAllocation", label: "Balance allocation", fill: "#7c3aed", legend: true },
] as const;

const LEGEND_ITEMS = [
  { label: "Encumbrance amount", fill: "#059669" },
  { label: "Encumbrance balance", fill: "#34d399" },
  { label: "Balance allocation", fill: "#7c3aed" },
];

type ChartRow = {
  code: string;
  title: string;
  amountApproved: number;
  encumbranceAmount: number;
  encumbranceBalance: number;
  balanceAllocation: number;
  spent: number;
};

function buildChartData(rows: FundingTypeBudgetRow[]): ChartRow[] {
  const rowByCode = new Map(rows.map((row) => [row.code, row]));

  return DEPARTMENT_FUNDING_TYPE_NAMES.map((fullName) => {
    const code = fundingTypeCode(fullName);
    const title = fundingTypeLabel(fullName);
    const row = rowByCode.get(code);

    return {
      code,
      title,
      amountApproved: row?.amountApproved ?? 0,
      encumbranceAmount: row?.encumbranceAmount ?? 0,
      encumbranceBalance: Math.max(0, row?.encumbranceBalance ?? 0),
      balanceAllocation: row?.balanceAllocation ?? 0,
      spent: Math.max(0, row?.spent ?? 0),
    };
  });
}

function YAxisTick({
  x = 0,
  y = 0,
  payload,
  compact,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
  compact?: boolean;
}) {
  const code = payload?.value ?? "";
  const title = fundingTypeLabel(
    DEPARTMENT_FUNDING_TYPE_NAMES.find((name) => fundingTypeCode(name) === code) ?? code
  );

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        textAnchor="end"
        fill="#334155"
        fontSize={compact ? 10 : 11}
        fontWeight={600}
      >
        <tspan x={0} dy="-0.35em">
          {code}
        </tspan>
        <tspan x={0} dy="1.15em" fill="#64748b" fontSize={compact ? 9 : 10} fontWeight={400}>
          {title}
        </tspan>
      </text>
    </g>
  );
}

function FundingTypeAllocationTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ChartRow }[];
}) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-2 font-semibold text-slate-900">
        {row.code} · {row.title}
      </p>
      <dl className="space-y-1">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Amount approved</dt>
          <dd className="font-medium text-slate-900">{formatCurrency(row.amountApproved)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Encumbrance amount</dt>
          <dd className="font-medium text-slate-900">{formatCurrency(row.encumbranceAmount)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Encumbrance balance</dt>
          <dd className="font-medium text-slate-900">{formatCurrency(row.encumbranceBalance)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Balance allocation</dt>
          <dd className="font-medium text-slate-900">{formatCurrency(row.balanceAllocation)}</dd>
        </div>
      </dl>
    </div>
  );
}

function AllocationLegend({ compact }: { compact?: boolean }) {
  return (
    <div
      className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2"
      style={{ fontSize: compact ? 11 : 12 }}
    >
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5 text-slate-600">
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: item.fill }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function FundingTypeAllocationPie({
  rows,
  compact = false,
}: {
  rows: FundingTypeBudgetRow[];
  compact?: boolean;
}) {
  const data = buildChartData(rows);
  const hasData = data.some(
    (row) => row.amountApproved > 0 || row.encumbranceAmount > 0
  );

  const barSize = compact ? 18 : 24;
  const rowHeight = compact ? 42 : 48;
  const height = Math.max(compact ? 220 : 320, data.length * rowHeight + 56);
  const yAxisWidth = compact ? 128 : 152;

  if (!hasData) {
    return (
      <div
        className="flex items-center justify-center text-sm text-slate-500"
        style={{ height: compact ? 220 : 320 }}
      >
        No allocation data yet
      </div>
    );
  }

  return (
    <div>
      <ChartContainer height={height}>
        <ResponsiveContainer width="100%" height={height} minWidth={0}>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
            barCategoryGap={compact ? 8 : 10}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: compact ? 11 : 12 }}
              tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="category"
              dataKey="code"
              width={yAxisWidth}
              tick={<YAxisTick compact={compact} />}
              interval={0}
              reversed
            />
            <Tooltip content={<FundingTypeAllocationTooltip />} />
            <Legend content={() => null} />
            {SEGMENTS.map(({ key, fill, legend, label }) => (
              <Bar
                key={key}
                stackId={STACK_ID}
                dataKey={key}
                name={label}
                fill={fill}
                radius={key === "balanceAllocation" ? [0, 4, 4, 0] : 0}
                barSize={barSize}
                legendType={legend ? "square" : "none"}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
      <AllocationLegend compact={compact} />
      {!compact && (
        <p className="mt-1 text-center text-xs text-slate-500">
          Each bar total equals amount approved · encumbrance amount = certified payments +
          encumbrance balance
        </p>
      )}
    </div>
  );
}
