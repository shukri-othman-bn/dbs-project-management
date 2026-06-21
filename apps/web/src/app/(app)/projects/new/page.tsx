import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCreateProject } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";
import { sortSectionsForForm } from "@/lib/units";
import { sortFundingTypes } from "@/lib/funding-types";
import { uniqueClientMinistries } from "@/lib/clients";

export default async function NewProjectPage() {
  const session = await auth();
  const user = session!.user;
  if (!canCreateProject(user)) redirect("/master-list/status");

  const [sectionsRaw, clients, fundingTypes, fy] = await Promise.all([
    prisma.section.findMany(),
    prisma.client.findMany({ orderBy: { ministry: "asc" } }),
    prisma.fundingType.findMany({ orderBy: { name: "asc" } }),
    prisma.financialYear.findFirst({ where: { isCurrent: true } }),
  ]);
  const sections = sortSectionsForForm(sectionsRaw);
  const fundingTypesSorted = sortFundingTypes(fundingTypes);
  const ministries = uniqueClientMinistries(clients);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Project</h1>
      <ProjectForm
        sections={sections}
        ministries={ministries}
        fundingTypes={fundingTypesSorted}
        currentFyId={fy?.id}
        currentFyLabel={fy?.label}
        defaultSectionId={user.sectionId ?? undefined}
      />
    </div>
  );
}
