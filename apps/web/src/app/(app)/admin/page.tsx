import { prisma } from "@/lib/prisma";
import { AdminPanel } from "@/components/admin/admin-panel";

export default async function AdminPage() {
  const [sections, financialYears, fundingTypes, clients, users] = await Promise.all([
    prisma.section.findMany({ orderBy: { name: "asc" } }),
    prisma.financialYear.findMany({ orderBy: { startDate: "desc" } }),
    prisma.fundingType.findMany({ orderBy: { name: "asc" } }),
    prisma.client.findMany({ orderBy: { ministry: "asc" } }),
    prisma.user.findMany({
      include: { section: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Administration</h1>
        <p className="text-slate-600">
          Manage sections, financial years, lookups, and user accounts
        </p>
      </div>
      <AdminPanel
        sections={sections}
        financialYears={financialYears.map((fy) => ({
          ...fy,
          startDate: fy.startDate.toISOString(),
          endDate: fy.endDate.toISOString(),
        }))}
        fundingTypes={fundingTypes}
        clients={clients}
        users={users}
      />
    </div>
  );
}
