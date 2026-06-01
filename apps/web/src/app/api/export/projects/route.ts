import { auth } from "@/lib/auth";
import { getProjectsWithBudget, getCurrentFinancialYear } from "@/lib/data";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

function escapeCsv(value: string | number | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== Role.DIRECTOR && session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "projects";
  const projects = await getProjectsWithBudget(session.user);
  const fy = await getCurrentFinancialYear();

  if (type === "budget") {
    const headers = [
      "Project Number",
      "Title",
      "Section",
      "OIC",
      "Funding",
      "FY",
      "Allocation",
      "Warrant",
      "Spent",
      "Unspent",
      "Utilization %",
      "RAG",
    ];
    const rows = projects.map((p) =>
      [
        p.projectNumber,
        p.title,
        p.section?.name,
        p.oic?.name,
        p.fundingType?.name,
        fy?.label,
        p.totals.allocation,
        p.totals.warrantApproved,
        p.totals.paymentsCertified,
        p.totals.unspent,
        Math.round(p.totals.utilizationPct),
        p.totals.rag,
      ].map(escapeCsv).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="dbs-budget-summary-${fy?.label ?? "export"}.csv"`,
      },
    });
  }

  const headers = [
    "Project Number",
    "Title",
    "Stage",
    "Section",
    "OIC",
    "Client",
    "Physical %",
    "Payment %",
    "Allocation",
    "Spent",
    "Actions Required",
    "Monitor",
  ];
  const rows = projects.map((p) =>
    [
      p.projectNumber,
      p.title,
      p.lifecycleStage,
      p.section?.name,
      p.oic?.name,
      p.client?.ministry,
      p.latestStatus?.physicalActual,
      p.latestStatus?.paymentActual,
      p.totals.allocation,
      p.totals.paymentsCertified,
      p.latestStatus?.actionsRequired,
      p.toMonitor ? "Yes" : "No",
    ].map(escapeCsv).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="dbs-projects-export.csv"',
    },
  });
}
