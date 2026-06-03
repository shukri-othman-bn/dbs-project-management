import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    databaseUrl: !!process.env.DATABASE_URL,
    authSecret: !!process.env.AUTH_SECRET,
    authUrl: !!process.env.AUTH_URL || !!process.env.NEXTAUTH_URL,
  };
  if (!env.databaseUrl) {
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        env,
        message:
          "DATABASE_URL is not set. In DigitalOcean App Platform, bind DATABASE_URL to ${dbs-db.DATABASE_URL} (Build & Run) and redeploy.",
      },
      { status: 500 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();
    return NextResponse.json({
      ok: true,
      database: "connected",
      users: userCount,
      env,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        env,
        message,
      },
      { status: 500 }
    );
  }
}
