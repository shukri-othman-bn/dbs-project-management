import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessAdmin } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(await prisma.client.findMany({ orderBy: { ministry: "asc" } }));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { ministry, department } = await req.json();
  const client = await prisma.client.create({
    data: { ministry, department: department || null },
  });
  return NextResponse.json(client);
}
