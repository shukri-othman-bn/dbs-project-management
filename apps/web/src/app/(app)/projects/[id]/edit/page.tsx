import { auth } from "@/lib/auth";
import { getProjectById } from "@/lib/data";
import { canEditProject } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";
import { sortSectionsForForm } from "@/lib/units";
import { sortFundingTypes } from "@/lib/funding-types";
import { uniqueClientMinistries } from "@/lib/clients";

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

  const [sectionsRaw, clients, fundingTypes] = await Promise.all([
    prisma.section.findMany(),
    prisma.client.findMany({ orderBy: { ministry: "asc" } }),
    prisma.fundingType.findMany({ orderBy: { name: "asc" } }),
  ]);
  const sections = sortSectionsForForm(sectionsRaw);
  const fundingTypesSorted = sortFundingTypes(fundingTypes);
  const ministries = uniqueClientMinistries(clients);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Project</h1>
      <ProjectForm
        sections={sections}
        ministries={ministries}
        fundingTypes={fundingTypesSorted}
        project={{
          id: project.id,
          projectNumber: project.projectNumber,
          title: project.title,
          lifecycleStage: project.lifecycleStage,
          sectionId: project.sectionId,
          clientMinistry: project.client?.ministry ?? null,
          clientDepartment: project.client?.department ?? null,
          fundingTypeId: project.fundingTypeId,
          oicName: project.oicName,
          oicEmail: project.oicEmail,
          toMonitor: project.toMonitor,
          quotationOrContractNo: project.quotationOrContractNo,
          projectType: project.projectType,
          contractCategory: project.contractCategory,
        }}
      />
    </div>
  );
}
