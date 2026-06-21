"use client";

import { Fragment } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { ChartContainer } from "@/components/charts/chart-container";
import {
  DEPARTMENT_FUNDING_TYPE_NAMES,
  departmentFundingTypeColor,
  fundingTypeCode,
  fundingTypeLabel,
} from "@/lib/funding-types";
import type { UnitBudgetRow } from "@/lib/data";
import {
  DesktopDataTable,
  desktopTdClass,
  desktopThClass,
  MobileCardList,
  MobileField,
  MobileRecordCard,
  ResponsiveDataView,
} from "@/components/ui/responsive-data";

const FUNDING_TYPES = DEPARTMENT_FUNDING_TYPE_NAMES.map((fullName) => ({
  code: fundingTypeCode(fullName),
  title: fundingTypeLabel(fullName),
}));

type ChartRow = {
  unit: string;
  [key: string]: string | number;
};

function buildChartData(units: UnitBudgetRow[]): ChartRow[] {
  return units.map((unit) => {
    const row: ChartRow = { unit: unit.unit };
    for (const ft of unit.byFundingType) {
      row[`alloc_${ft.code}`] = ft.allocation;
      row[`spent_${ft.code}`] = ft.spent;
    }
    return row;
  });
}

function UnitBudgetTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey?: string; value?: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;

  const allocationItems = payload.filter(
    (item) => item.dataKey?.startsWith("alloc_") && Number(item.value) > 0
  );
  const spentItems = payload.filter(
    (item) => item.dataKey?.startsWith("spent_") && Number(item.value) > 0
  );

  return (
    <div className="max-w-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-2 font-semibold text-slate-900">{label}</p>
      {allocationItems.length > 0 && (
        <div className="mb-2">
          <p className="mb-1 font-medium text-slate-700">Allocation</p>
          <ul className="space-y-0.5">
            {allocationItems.map((item) => {
              const code = item.dataKey!.replace("alloc_", "");
              const title = FUNDING_TYPES.find((ft) => ft.code === code)?.title ?? code;
              return (
                <li key={item.dataKey} className="flex justify-between gap-3">
                  <span className="text-slate-500">
                    {code} · {title}
                  </span>
                  <span className="font-medium">{formatCurrency(Number(item.value))}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {spentItems.length > 0 && (
        <div>
          <p className="mb-1 font-medium text-slate-700">Spent</p>
          <ul className="space-y-0.5">
            {spentItems.map((item) => {
              const code = item.dataKey!.replace("spent_", "");
              const title = FUNDING_TYPES.find((ft) => ft.code === code)?.title ?? code;
              return (
                <li key={item.dataKey} className="flex justify-between gap-3">
                  <span className="text-slate-500">
                    {code} · {title}
                  </span>
                  <span className="font-medium">{formatCurrency(Number(item.value))}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function FundingTypeLegend() {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2 text-xs text-slate-600">
      {FUNDING_TYPES.map((ft) => (
        <div key={ft.code} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: departmentFundingTypeColor(ft.code) }}
          />
          <span>
            {ft.code} · {ft.title}
          </span>
        </div>
      ))}
    </div>
  );
}

export function UnitBudgetByFundingTypeChart({ units }: { units: UnitBudgetRow[] }) {
  const data = buildChartData(units);
  const rowHeight = 52;
  const height = Math.max(280, data.length * rowHeight + 72);

  if (data.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">
        Each unit shows two stacked bars: allocation (solid) and spent (lighter), coloured by funding
        type. Unit allocation is split from the department amount approved per funding type.
      </p>
      <ChartContainer height={height}>
        <ResponsiveContainer width="100%" height={height} minWidth={0}>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
            barCategoryGap={6}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="category"
              dataKey="unit"
              width={48}
              tick={{ fontSize: 11, fontWeight: 600 }}
              interval={0}
              reversed
            />
            {FUNDING_TYPES.map((ft) => (
              <Bar
                key={`alloc_${ft.code}`}
                stackId="allocation"
                dataKey={`alloc_${ft.code}`}
                fill={departmentFundingTypeColor(ft.code)}
                radius={0}
                barSize={14}
                legendType="none"
              />
            ))}
            {FUNDING_TYPES.map((ft) => (
              <Bar
                key={`spent_${ft.code}`}
                stackId="spent"
                dataKey={`spent_${ft.code}`}
                fill={departmentFundingTypeColor(ft.code)}
                fillOpacity={0.55}
                radius={0}
                barSize={14}
                legendType="none"
              />
            ))}
            <Tooltip content={<UnitBudgetTooltip />} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-8 rounded-sm bg-slate-400" />
          Allocation (solid)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-8 rounded-sm bg-slate-400 opacity-55" />
          Spent (lighter)
        </span>
      </div>
      <FundingTypeLegend />
    </div>
  );
}

function utilizationClass(pct: number, allocation: number, spent: number): string {
  if (allocation <= 0 && spent <= 0) return "text-slate-400";
  if (allocation <= 0 && spent > 0) return "text-red-600";
  if (spent <= 0) return "text-amber-600";
  if (pct > 100) return "text-red-600";
  if (pct >= 50) return "text-emerald-600";
  return "text-amber-600";
}

function allocatedFundingTypes(unit: UnitBudgetRow) {
  return unit.byFundingType.filter((ft) => ft.allocation > 0);
}

export function UnitBudgetFundingTypeTable({ units }: { units: UnitBudgetRow[] }) {
  return (
    <ResponsiveDataView
      mobile={
        <MobileCardList>
          {units.map((unit) => (
            <MobileRecordCard
              key={unit.code}
              title={unit.unit}
              subtitle={unit.leadOfficer ?? "No lead officer"}
            >
              <MobileField label="Unit allocation" value={formatCurrency(unit.allocation)} />
              <MobileField label="Unit spent" value={formatCurrency(unit.spent)} />
              <MobileField label="Unit util %" value={formatPercent(unit.utilizationPct)} />
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="mb-2 text-xs font-medium text-slate-500">By funding type</p>
                <div className="space-y-2">
                  {allocatedFundingTypes(unit).map((ft) => (
                    <div
                      key={ft.code}
                      className="rounded-md border border-slate-100 bg-slate-50/80 px-2 py-1.5 text-xs"
                    >
                      <p className="font-medium text-slate-800">
                        {ft.code} · {ft.title}
                      </p>
                      <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600">
                        <span>Alloc: {formatCurrency(ft.allocation)}</span>
                        <span>Spent: {formatCurrency(ft.spent)}</span>
                        <span>
                          Unspent: {formatCurrency(Math.max(0, ft.allocation - ft.spent))}
                        </span>
                        <span
                          className={utilizationClass(
                            ft.utilizationPct,
                            ft.allocation,
                            ft.spent
                          )}
                        >
                          Util: {formatPercent(ft.utilizationPct)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </MobileRecordCard>
          ))}
        </MobileCardList>
      }
      desktop={
        <DesktopDataTable dense>
          <thead>
            <tr className="border-b">
              <th className={desktopThClass}>Unit</th>
              <th className={desktopThClass}>Lead Officer</th>
              <th className={desktopThClass}>Funding type</th>
              <th className={desktopThClass}>Allocation</th>
              <th className={desktopThClass}>Spent</th>
              <th className={desktopThClass}>Unspent</th>
              <th className={desktopThClass}>Util %</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <Fragment key={unit.code}>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <td className={desktopTdClass}>
                    <span className="font-semibold text-slate-900">{unit.unit}</span>
                  </td>
                  <td className={desktopTdClass}>{unit.leadOfficer ?? "—"}</td>
                  <td className={desktopTdClass}>
                    <span className="font-medium text-slate-700">Unit total</span>
                  </td>
                  <td className={desktopTdClass}>
                    <span className="font-semibold">{formatCurrency(unit.allocation)}</span>
                  </td>
                  <td className={desktopTdClass}>
                    <span className="font-semibold">{formatCurrency(unit.spent)}</span>
                  </td>
                  <td className={desktopTdClass}>
                    {formatCurrency(Math.max(0, unit.allocation - unit.spent))}
                  </td>
                  <td className={desktopTdClass}>
                    <span
                      className={`font-semibold ${utilizationClass(unit.utilizationPct, unit.allocation, unit.spent)}`}
                    >
                      {formatPercent(unit.utilizationPct)}
                    </span>
                  </td>
                </tr>
                {allocatedFundingTypes(unit).map((ft) => (
                  <tr key={`${unit.code}-${ft.code}`} className="border-b border-slate-100">
                    <td className={desktopTdClass} />
                    <td className={desktopTdClass} />
                    <td className={desktopTdClass}>
                      <div className="flex items-center gap-2 pl-2">
                        <span
                          className="inline-block h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: departmentFundingTypeColor(ft.code) }}
                        />
                        <span className="text-slate-700">
                          {ft.code} · {ft.title}
                        </span>
                      </div>
                    </td>
                    <td className={desktopTdClass}>{formatCurrency(ft.allocation)}</td>
                    <td className={desktopTdClass}>{formatCurrency(ft.spent)}</td>
                    <td className={desktopTdClass}>
                      {formatCurrency(Math.max(0, ft.allocation - ft.spent))}
                    </td>
                    <td className={desktopTdClass}>
                      <span
                        className={utilizationClass(ft.utilizationPct, ft.allocation, ft.spent)}
                      >
                        {formatPercent(ft.utilizationPct)}
                      </span>
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </DesktopDataTable>
      }
    />
  );
}
