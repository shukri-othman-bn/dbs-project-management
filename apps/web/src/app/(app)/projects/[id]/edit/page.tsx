import { auth } from "@/lib/auth";
import { getProjectById } from "@/lib/data";
import { canEditProject } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const user = session!.user;
  const project = await getProjectById(id);
  if (!project) notFound();
  if (!canEditProject(user, project)) redirect(`/projects/${id}`);

  const [sections, clients, fundingTypes, officers] = await Promise.all([
    prisma.section.findMany({ orderBy: { name: "asc" } }),
    prisma.client.findMany({ orderBy: { ministry: "asc" } }),
    prisma.fundingType.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "OFFICER" }, orderBy: { name: "asc" } }),
  ]);

  const budget = project.budgets[0];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Project</h1>
      <ProjectForm
        sections={sections}
        clients={clients}
        fundingTypes={fundingTypes}
        officers={officers}
        project={{
          id: project.id,
          projectNumber: project.projectNumber,
          title: project.title,
          lifecycleStage: project.lifecycleStage,
          sectionId: project.sectionId,
          clientId: project.clientId,
          fundingTypeId: project.fundingTypeId,
          oicUserId: project.oicUserId,
          toMonitor: project.toMonitor,
          team: project.team,
          allocation: budget?.allocation,
          quotationOrContractNo: project.quotationOrContractNo,
          projectType: project.projectType,
          contractorName: project.contractorName,
          supervisingOfficer: project.supervisingOfficer,
        }}
      />
    </div>
  );
}
