"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { ChartContainer } from "@/components/charts/chart-container";

const COLORS = ["#059669", "#94a3b8"];
const MINI_HEIGHT = 180;

export function FundingTypeBudgetPie({
  spent,
  encumbranceBalance,
}: {
  spent: number;
  encumbranceBalance: number;
}) {
  const data = [
    { name: "Spent", value: spent },
    { name: "Encumbrance balance", value: Math.max(0, encumbranceBalance) },
  ].filter((slice) => slice.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex h-[180px] items-center justify-center text-sm text-slate-500">
        No spend data yet
      </div>
    );
  }

  return (
    <ChartContainer height={MINI_HEIGHT}>
      <ResponsiveContainer width="100%" height={MINI_HEIGHT} minWidth={0}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={60}
            label={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatCurrency(Number(v))} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
