"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  collectContractMatterFilterOptions,
  filterContractMatterLines,
  filterJobOrderRows,
  type ContractMatterJobOrderRow,
  type ContractMatterLineRow,
  type ContractMatterProjectRow,
} from "@/lib/contract-matters-filters";
import {
  countJoPaymentValuationByTab,
  DEFAULT_JO_PAYMENT_VALUATION_TAB,
  getJoPaymentValuationTabLabel,
  JO_PAYMENT_VALUATION_TABS,
  type JoPaymentValuationTabId,
} from "@/lib/jo-payment-valuation-filters";
import { CONTRACTOR_CLAIM_REF_LETTER_LABEL } from "@/lib/payment-valuation";
import { countActiveMasterListFilters, type MasterListFilterState } from "@/lib/master-list-filters";
import { ListTabBar } from "@/components/master-list/list-tab-bar";
import { MasterListFiltersBar } from "@/components/master-list/master-list-filters-bar";
import { JobOrderTable, PaymentTable } from "@/components/master-list/contract-matters-list";

export function JoPaymentValuationList({
  projects,
  jobOrders,
  lines,
}: {
  projects: ContractMatterProjectRow[];
  jobOrders: ContractMatterJobOrderRow[];
  lines: ContractMatterLineRow[];
}) {
  const [tab, setTab] = useState<JoPaymentValuationTabId>(DEFAULT_JO_PAYMENT_VALUATION_TAB);
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

  const paymentLines = useMemo(
    () => lines.filter((line) => line.lineType === "payment"),
    [lines]
  );

  const tabCounts = useMemo(
    () => countJoPaymentValuationByTab(jobOrders, paymentLines),
    [jobOrders, paymentLines]
  );

  const filteredJobOrders = useMemo(
    () => filterJobOrderRows(jobOrders, filters),
    [jobOrders, filters]
  );

  const filteredPayments = useMemo(
    () => filterContractMatterLines(paymentLines, filters),
    [paymentLines, filters]
  );

  const activeFilters = countActiveMasterListFilters(filters);
  const rowCount =
    tab === "job-order" ? filteredJobOrders.length : filteredPayments.length;

  function patchFilters(patch: Partial<MasterListFilterState>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  return (
    <Card>
      <div className="px-6 pt-4">
        <ListTabBar
          tabs={JO_PAYMENT_VALUATION_TABS}
          activeId={tab}
          onSelect={setTab}
          counts={tabCounts}
        />
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
            <span className="font-medium text-slate-800">{getJoPaymentValuationTabLabel(tab)}</span>
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

        {tab === "job-order" ? (
          <JobOrderTable rows={filteredJobOrders} />
        ) : (
          <PaymentTable
            rows={filteredPayments}
            showProgressClaimNo
            descriptionLabel={CONTRACTOR_CLAIM_REF_LETTER_LABEL}
          />
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
