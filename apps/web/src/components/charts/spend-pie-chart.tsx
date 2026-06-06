"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { ChartContainer } from "@/components/charts/chart-container";

const COLORS = ["#059669", "#475569"];
const CHART_HEIGHT = 256;

export function SpendPieChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <ChartContainer height={CHART_HEIGHT}>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT} minWidth={0}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatCurrency(Number(v))} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
