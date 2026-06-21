"use client";

import { Search } from "lucide-react";
import { ProjectType } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { PROJECT_TYPE_LABELS } from "@/lib/project-labels";
import type { MasterListFilterState } from "@/lib/master-list-filters";

export type { MasterListFilterState } from "@/lib/master-list-filters";
export { countActiveMasterListFilters, EMPTY_MASTER_LIST_FILTERS } from "@/lib/master-list-filters";

export type MasterListFilterOptions = {
  units: string[];
  fundingTypes: string[];
  contractors: string[];
  projectTypes: ProjectType[];
  statuses: string[];
  ministries: string[];
  departments: string[];
};

const selectClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block min-w-[120px] flex-1">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClassName}>
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MasterListFiltersBar({
  filters,
  options,
  onSearchChange,
  onUnitChange,
  onFundingTypeChange,
  onContractorChange,
  onProjectTypeChange,
  onProjectStatusChange,
  onMinistryChange,
  onDepartmentChange,
}: {
  filters: MasterListFilterState;
  options: MasterListFilterOptions;
  onSearchChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onFundingTypeChange: (value: string) => void;
  onContractorChange: (value: string) => void;
  onProjectTypeChange: (value: string) => void;
  onProjectStatusChange: (value: string) => void;
  onMinistryChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search"
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <FilterSelect label="Unit" value={filters.unit} onChange={onUnitChange} options={options.units} />
        <FilterSelect label="Funding Type" value={filters.fundingType} onChange={onFundingTypeChange} options={options.fundingTypes} />
        <FilterSelect
          label="Contractor"
          value={filters.contractor}
          onChange={onContractorChange}
          options={options.contractors}
        />
        <label className="block min-w-[120px] flex-1">
          <span className="mb-1 block text-xs font-medium text-slate-500">Project Type</span>
          <select
            value={filters.projectType}
            onChange={(e) => onProjectTypeChange(e.target.value)}
            className={selectClassName}
          >
            <option value="">All</option>
            {options.projectTypes.map((pt) => (
              <option key={pt} value={pt}>
                {PROJECT_TYPE_LABELS[pt]}
              </option>
            ))}
          </select>
        </label>
        <FilterSelect
          label="Project Status"
          value={filters.projectStatus}
          onChange={onProjectStatusChange}
          options={options.statuses}
        />
        <FilterSelect
          label="Ministry"
          value={filters.ministry}
          onChange={onMinistryChange}
          options={options.ministries}
        />
        <FilterSelect
          label="Department"
          value={filters.department}
          onChange={onDepartmentChange}
          options={options.departments}
        />
      </div>
    </div>
  );
}
