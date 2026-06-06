"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { ChartContainer } from "@/components/charts/chart-container";

const CHART_HEIGHT = 288;

export function SectionBudgetChart({
  data,
}: {
  data: { section: string; allocation: number; spent: number }[];
}) {
  if (data.length === 0) return null;
  return (
    <ChartContainer height={CHART_HEIGHT}>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT} minWidth={0}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="section" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => formatCurrency(Number(v))} />
          <Legend />
          <Bar dataKey="allocation" name="Allocation" fill="#475569" />
          <Bar dataKey="spent" name="Spent" fill="#059669" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
