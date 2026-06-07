import { auth } from "@/lib/auth";
import { getProjectsWithBudget, getMatterRequests } from "@/lib/data";
import { toContractMatterProjectRow, toContractMatterRequestRow } from "@/lib/master-list-mappers";
import { RequestList } from "@/components/master-list/request-list";
import { MasterListHeader, MasterListViewPills } from "@/components/master-list/master-list-header";

export default async function MasterListRequestPage() {
  const session = await auth();
  const user = session!.user;
  const [raw, matterRequestsRaw] = await Promise.all([
    getProjectsWithBudget(user),
    getMatterRequests(user),
  ]);
  const projects = raw.map(toContractMatterProjectRow);
  const requests = matterRequestsRaw.map(toContractMatterRequestRow);

  return (
    <div className="space-y-6">
      <MasterListHeader view="request" />
      <MasterListViewPills active="request" />
      <RequestList projects={projects} requests={requests} />
    </div>
  );
}
