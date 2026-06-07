import { auth } from "@/lib/auth";
import { getProjectsWithBudget } from "@/lib/data";
import {
  toContractMatterEotRows,
  toContractMatterProjectRow,
  toContractMatterVariationOrderRows,
} from "@/lib/master-list-mappers";
import { VoEotList } from "@/components/master-list/vo-eot-list";
import { MasterListHeader, MasterListViewPills } from "@/components/master-list/master-list-header";

export default async function MasterListVoEotPage() {
  const session = await auth();
  const user = session!.user;
  const raw = await getProjectsWithBudget(user);
  const projects = raw.map(toContractMatterProjectRow);
  const variationOrders = raw.flatMap(toContractMatterVariationOrderRows);
  const extensionOfTimes = raw.flatMap(toContractMatterEotRows);

  return (
    <div className="space-y-6">
      <MasterListHeader view="vo-eot" />
      <MasterListViewPills active="vo-eot" />
      <VoEotList
        projects={projects}
        variationOrders={variationOrders}
        extensionOfTimes={extensionOfTimes}
      />
    </div>
  );
}
