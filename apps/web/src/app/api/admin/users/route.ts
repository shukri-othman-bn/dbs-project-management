import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessAdmin } from "@/lib/permissions";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    include: { section: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { email, name, password, role, sectionId } = await req.json();
  const passwordHash = await bcrypt.hash(password || "password123", 10);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: (role as Role) || Role.OFFICER,
      sectionId: sectionId || null,
    },
    select: { id: true, email: true, name: true, role: true, sectionId: true },
  });
  return NextResponse.json(user);
}
