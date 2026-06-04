import { NextResponse } from "next/server";

/** Liveness probe for Railway — returns 200 when the Node process is up (no DB required). */
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, live: true });
}
