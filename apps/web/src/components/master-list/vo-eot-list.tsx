"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  collectContractMatterFilterOptions,
  filterEotRows,
  filterVariationOrderRows,
  type ContractMatterEotRow,
  type ContractMatterProjectRow,
  type ContractMatterVariationOrderRow,
} from "@/lib/contract-matters-filters";
import {
  countVoEotByTab,
  DEFAULT_VO_EOT_TAB,
  getVoEotTabLabel,
  VO_EOT_TABS,
  type VoEotTabId,
} from "@/lib/vo-eot-filters";
import { countActiveMasterListFilters, type MasterListFilterState } from "@/lib/master-list-filters";
import { ListTabBar } from "@/components/master-list/list-tab-bar";
import { MasterListFiltersBar } from "@/components/master-list/master-list-filters-bar";
import {
  ExtensionOfTimeTable,
  VariationOrderTable,
} from "@/components/master-list/contract-matters-list";

export function VoEotList({
  projects,
  variationOrders,
  extensionOfTimes,
}: {
  projects: ContractMatterProjectRow[];
  variationOrders: ContractMatterVariationOrderRow[];
  extensionOfTimes: ContractMatterEotRow[];
}) {
  const [tab, setTab] = useState<VoEotTabId>(DEFAULT_VO_EOT_TAB);
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
  const tabCounts = useMemo(
    () => countVoEotByTab(variationOrders, extensionOfTimes),
    [variationOrders, extensionOfTimes]
  );

  const filteredVariationOrders = useMemo(
    () => filterVariationOrderRows(variationOrders, filters),
    [variationOrders, filters]
  );

  const filteredExtensionOfTimes = useMemo(
    () => filterEotRows(extensionOfTimes, filters),
    [extensionOfTimes, filters]
  );

  const activeFilters = countActiveMasterListFilters(filters);
  const rowCount =
    tab === "variation-order" ? filteredVariationOrders.length : filteredExtensionOfTimes.length;

  function patchFilters(patch: Partial<MasterListFilterState>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  return (
    <Card>
      <div className="px-6 pt-4">
        <ListTabBar tabs={VO_EOT_TABS} activeId={tab} onSelect={setTab} counts={tabCounts} />
      </div>

      <CardContent className="space-y-4 border-b border-slate-100 py-4">
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
          {" in "}
          <span className="font-medium text-slate-800">{getVoEotTabLabel(tab)}</span>
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

        {tab === "variation-order" ? (
          <VariationOrderTable rows={filteredVariationOrders} />
        ) : (
          <ExtensionOfTimeTable rows={filteredExtensionOfTimes} />
        )}

        {rowCount === 0 && (
          <p className="px-6 py-10 text-center text-slate-500">
            No records match the current filters.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
