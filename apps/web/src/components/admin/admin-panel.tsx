"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSaveActions, useFormDirty } from "@/components/ui/form-save-actions";

type Tab = "sections" | "fy" | "funding" | "clients" | "users";

export function AdminPanel({
  sections,
  financialYears,
  fundingTypes,
  clients,
  users,
}: {
  sections: { id: string; name: string; code: string | null }[];
  financialYears: { id: string; label: string; isCurrent: boolean; startDate: string; endDate: string }[];
  fundingTypes: { id: string; name: string; mainCategory: string | null }[];
  clients: { id: string; ministry: string; department: string | null }[];
  users: { id: string; email: string; name: string; role: string; section: { name: string } | null }[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("sections");
  const [loading, setLoading] = useState(false);

  async function post(endpoint: string, data: Record<string, unknown>) {
    setLoading(true);
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);
    router.refresh();
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "sections", label: "Sections" },
    { id: "fy", label: "Financial Years" },
    { id: "funding", label: "Funding Types" },
    { id: "clients", label: "Clients" },
    { id: "users", label: "Users" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.id ? "border-slate-800" : "border-transparent text-slate-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "sections" && (
        <AdminSection
          title="Sections"
          items={sections.map((s) => `${s.name} (${s.code ?? "—"})`)}
          onSubmit={(form) =>
            post("/api/admin/sections", {
              name: form.get("name"),
              code: form.get("code"),
            })
          }
          fields={
            <>
              <div>
                <Label>Name</Label>
                <Input name="name" required />
              </div>
              <div>
                <Label>Code</Label>
                <Input name="code" />
              </div>
            </>
          }
          loading={loading}
        />
      )}

      {tab === "fy" && (
        <AdminSection
          title="Financial Years"
          items={financialYears.map(
            (fy) => `${fy.label}${fy.isCurrent ? " (current)" : ""} — ${fy.startDate.slice(0, 10)} to ${fy.endDate.slice(0, 10)}`
          )}
          onSubmit={(form) =>
            post("/api/admin/financial-years", {
              label: form.get("label"),
              startDate: form.get("startDate"),
              endDate: form.get("endDate"),
              isCurrent: form.get("isCurrent") === "on",
            })
          }
          fields={
            <>
              <div>
                <Label>Label (e.g. 2025/2026)</Label>
                <Input name="label" required />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input name="startDate" type="date" required />
              </div>
              <div>
                <Label>End Date</Label>
                <Input name="endDate" type="date" required />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="isCurrent" id="isCurrent" />
                <Label htmlFor="isCurrent" className="mb-0">
                  Set as current FY
                </Label>
              </div>
            </>
          }
          loading={loading}
        />
      )}

      {tab === "funding" && (
        <AdminSection
          title="Funding Types"
          items={fundingTypes.map((f) => `${f.name} — ${f.mainCategory ?? "—"}`)}
          onSubmit={(form) =>
            post("/api/admin/funding-types", {
              name: form.get("name"),
              mainCategory: form.get("mainCategory"),
            })
          }
          fields={
            <>
              <div>
                <Label>Name</Label>
                <Input name="name" required />
              </div>
              <div>
                <Label>Main Category</Label>
                <Input name="mainCategory" />
              </div>
            </>
          }
          loading={loading}
        />
      )}

      {tab === "clients" && (
        <AdminSection
          title="Clients"
          items={clients.map((c) => `${c.ministry}${c.department ? ` — ${c.department}` : ""}`)}
          onSubmit={(form) =>
            post("/api/admin/clients", {
              ministry: form.get("ministry"),
              department: form.get("department"),
            })
          }
          fields={
            <>
              <div>
                <Label>Ministry</Label>
                <Input name="ministry" required />
              </div>
              <div>
                <Label>Department</Label>
                <Input name="department" />
              </div>
            </>
          }
          loading={loading}
        />
      )}

      {tab === "users" && (
        <AdminSection
          title="Users"
          items={users.map((u) => `${u.name} — ${u.email} (${u.role})${u.section ? ` — ${u.section.name}` : ""}`)}
          onSubmit={(form) =>
            post("/api/admin/users", {
              email: form.get("email"),
              name: form.get("name"),
              password: form.get("password"),
              role: form.get("role"),
            })
          }
          fields={
            <>
              <div>
                <Label>Email</Label>
                <Input name="email" type="email" required />
              </div>
              <div>
                <Label>Name</Label>
                <Input name="name" required />
              </div>
              <div>
                <Label>Password</Label>
                <Input name="password" type="password" placeholder="password123" />
              </div>
              <div>
                <Label>Role</Label>
                <select name="role" className="w-full rounded-lg border px-3 py-2 text-sm">
                  <option value="OFFICER">Officer</option>
                  <option value="PROJECT_ADMIN">Project Admin</option>
                  <option value="HOS">Head of Section</option>
                  <option value="DIRECTOR">Director</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </>
          }
          loading={loading}
        />
      )}
    </div>
  );
}

function AdminSection({
  title,
  items,
  fields,
  onSubmit,
  loading,
}: {
  title: string;
  items: string[];
  fields: React.ReactNode;
  onSubmit: (form: FormData) => void;
  loading: boolean;
}) {
  const { dirty, resetDirty, formTrackProps } = useFormDirty();
  const formId = `admin-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>Add {title}</CardTitle>
          <FormSaveActions
            formId={formId}
            loading={loading}
            dirty={dirty}
            className="ml-auto"
          />
        </CardHeader>
        <CardContent>
          <form
            id={formId}
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(new FormData(e.currentTarget));
              e.currentTarget.reset();
              resetDirty();
            }}
            className="space-y-4"
            {...formTrackProps}
          >
            {fields}
            <FormSaveActions loading={loading} dirty={dirty} />
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Existing</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm max-h-96 overflow-y-auto">
            {items.map((item, i) => (
              <li key={i} className="border-b py-2">
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
