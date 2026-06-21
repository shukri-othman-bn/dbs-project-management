"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  collectContractMatterFilterOptions,
  filterRequestRows,
  type ContractMatterProjectRow,
  type ContractMatterRequestRow,
} from "@/lib/contract-matters-filters";
import { countActiveMasterListFilters, type MasterListFilterState } from "@/lib/master-list-filters";
import { MasterListFiltersBar } from "@/components/master-list/master-list-filters-bar";
import { RequestTable } from "@/components/master-list/contract-matters-list";

export function RequestList({
  projects,
  requests,
}: {
  projects: ContractMatterProjectRow[];
  requests: ContractMatterRequestRow[];
}) {
  const [filters, setFilters] = useState<MasterListFilterState>({
    search: "",
    unit: "",
    fundingType: "",
    contractor: "",
    projectType: "",
    projectStatus: "",
    ministry: "",
    department: "",
  });

  const filterOptions = useMemo(() => collectContractMatterFilterOptions(projects), [projects]);

  const filteredRequests = useMemo(
    () => filterRequestRows(requests, filters),
    [requests, filters]
  );

  const activeFilters = countActiveMasterListFilters(filters);
  const rowCount = filteredRequests.length;

  function patchFilters(patch: Partial<MasterListFilterState>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  return (
    <Card>
      <CardContent className="space-y-4 border-b border-slate-100 py-4 pt-6">
        <MasterListFiltersBar
          filters={filters}
          options={filterOptions}
          onSearchChange={(search) => patchFilters({ search })}
          onUnitChange={(unit) => patchFilters({ unit })}
          onFundingTypeChange={(fundingType) => patchFilters({ fundingType })}
          onContractorChange={(contractor) => patchFilters({ contractor })}
          onProjectTypeChange={(projectType) => patchFilters({ projectType })}
          onProjectStatusChange={(projectStatus) => patchFilters({ projectStatus })}
          onMinistryChange={(ministry) => patchFilters({ ministry })}
          onDepartmentChange={(department) => patchFilters({ department })}
        />
      </CardContent>

      <CardContent className="p-0">
        <p className="border-b border-slate-100 bg-slate-50 px-6 py-3 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{rowCount}</span>
          {" record"}
          {rowCount === 1 ? "" : "s"}
          {activeFilters > 0 && (
            <span className="text-slate-500">
              {" "}
              · {activeFilters} filter{activeFilters === 1 ? "" : "s"} applied
            </span>
          )}
          {filters.search.trim() && (
            <span className="text-slate-500"> · matching &ldquo;{filters.search.trim()}&rdquo;</span>
          )}
        </p>

        <RequestTable rows={filteredRequests} />

        {rowCount === 0 && (
          <p className="px-6 py-10 text-center text-slate-500">
            No records match the current filters.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
