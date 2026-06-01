import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCreateProject } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";

export default async function NewProjectPage() {
  const session = await auth();
  const user = session!.user;
  if (!canCreateProject(user)) redirect("/master-list/by-status");

  const [sections, clients, fundingTypes, officers, fy] = await Promise.all([
    prisma.section.findMany({ orderBy: { name: "asc" } }),
    prisma.client.findMany({ orderBy: { ministry: "asc" } }),
    prisma.fundingType.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "OFFICER" }, orderBy: { name: "asc" } }),
    prisma.financialYear.findFirst({ where: { isCurrent: true } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Project</h1>
      <ProjectForm
        sections={sections}
        clients={clients}
        fundingTypes={fundingTypes}
        officers={officers}
        currentFyId={fy?.id}
        defaultOicId={user.role === "OFFICER" ? user.id : undefined}
        defaultSectionId={user.sectionId ?? undefined}
      />
    </div>
  );
}
