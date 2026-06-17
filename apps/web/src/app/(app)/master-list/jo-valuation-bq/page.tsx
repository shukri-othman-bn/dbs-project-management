import { auth } from "@/lib/auth";
import { getProjectsWithBudget } from "@/lib/data";
import {
  toContractMatterJobOrderRows,
  toContractMatterLineRows,
  toContractMatterProjectRow,
} from "@/lib/master-list-mappers";
import { syncAllFsorJobOrders } from "@/lib/fsor-jo-sync";
import { JoPaymentValuationList } from "@/components/master-list/jo-payment-valuation-list";
import { MasterListHeader, MasterListViewPills } from "@/components/master-list/master-list-header";

export default async function MasterListJoValuationBqPage() {
  const session = await auth();
  const user = session!.user;
  await syncAllFsorJobOrders().catch(() => null);
  const raw = await getProjectsWithBudget(user);
  const projects = raw.map(toContractMatterProjectRow);
  const lines = raw.flatMap(toContractMatterLineRows);
  const jobOrders = raw.flatMap(toContractMatterJobOrderRows);

  return (
    <div className="space-y-6">
      <MasterListHeader view="jo-valuation-bq" />
      <MasterListViewPills active="jo-valuation-bq" />
      <JoPaymentValuationList projects={projects} jobOrders={jobOrders} lines={lines} />
    </div>
  );
}
