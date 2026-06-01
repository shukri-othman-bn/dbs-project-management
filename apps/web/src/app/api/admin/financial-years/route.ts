import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessAdmin } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(
    await prisma.financialYear.findMany({ orderBy: { startDate: "desc" } })
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { label, startDate, endDate, isCurrent } = await req.json();
  if (isCurrent) {
    await prisma.financialYear.updateMany({ data: { isCurrent: false } });
  }
  const fy = await prisma.financialYear.create({
    data: {
      label,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isCurrent: !!isCurrent,
    },
  });
  return NextResponse.json(fy);
}
