import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getProjectsWithBudget } from "@/lib/data";
import {
  toContractMatterLineRows,
  toContractMatterProjectRow,
  toContractMatterVariationOrderRows,
  toContractMatterEotRows,
} from "@/lib/master-list-mappers";
import { ContractMattersList } from "@/components/master-list/contract-matters-list";
import { MasterListHeader, MasterListViewPills } from "@/components/master-list/master-list-header";

export default async function MasterListContractMattersPage() {
  const session = await auth();
  const user = session!.user;
  const raw = await getProjectsWithBudget(user);
  const projects = raw.map(toContractMatterProjectRow);
  const lines = raw.flatMap(toContractMatterLineRows);
  const variationOrders = raw.flatMap(toContractMatterVariationOrderRows);
  const extensionOfTimes = raw.flatMap(toContractMatterEotRows);

  return (
    <div className="space-y-6">
      <MasterListHeader view="contract-matters" />
      <MasterListViewPills active="contract-matters" />
      <Suspense fallback={<div className="h-96 rounded-xl border border-slate-200 bg-white animate-pulse" />}>
        <ContractMattersList
          projects={projects}
          lines={lines}
          variationOrders={variationOrders}
          extensionOfTimes={extensionOfTimes}
        />
      </Suspense>
    </div>
  );
}
