import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessAdmin } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(await prisma.fundingType.findMany({ orderBy: { name: "asc" } }));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { name, mainCategory } = await req.json();
  const ft = await prisma.fundingType.create({
    data: { name, mainCategory: mainCategory || null },
  });
  return NextResponse.json(ft);
}
