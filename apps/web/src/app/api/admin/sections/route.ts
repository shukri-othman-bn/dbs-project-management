import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessAdmin } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(await prisma.section.findMany({ orderBy: { name: "asc" } }));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { name, code, headName, headEmail } = await req.json();
  const section = await prisma.section.create({
    data: {
      name,
      code: code || null,
      headName: headName || null,
      headEmail: headEmail || null,
      unitLabel: code || null,
    },
  });
  return NextResponse.json(section);
}
