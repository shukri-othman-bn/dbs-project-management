import { auth } from "@/lib/auth";
import { getProjectsWithBudget } from "@/lib/data";
import { canCreateProject } from "@/lib/permissions";
import { toProjectListRow } from "@/lib/master-list-mappers";
import { ProjectsList } from "@/components/projects/projects-list";
import { MasterListHeader, MasterListViewPills } from "@/components/master-list/master-list-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function MasterListByStatusPage() {
  const session = await auth();
  const user = session!.user;
  const projects = (await getProjectsWithBudget(user)).map(toProjectListRow);
  const canCreate = canCreateProject(user);

  return (
    <div className="space-y-6">
      <MasterListHeader
        view="by-status"
        action={
          canCreate ? (
            <Link href="/projects/new">
              <Button>New Project</Button>
            </Link>
          ) : undefined
        }
      />
      <MasterListViewPills active="by-status" />
      <ProjectsList projects={projects} />
    </div>
  );
}
