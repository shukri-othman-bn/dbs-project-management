import { ProjectOrgChart } from "@/components/organization/project-org-chart";

export default function OrganizationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Project Organization</h1>
        <p className="mt-1 text-sm text-slate-600">
          Department structure for project delivery — from Director down to unit OICs.
        </p>
      </div>
      <ProjectOrgChart />
    </div>
  );
}
