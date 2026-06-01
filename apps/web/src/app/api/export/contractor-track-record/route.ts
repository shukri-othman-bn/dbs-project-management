import { auth } from "@/lib/auth";
import {
  TRACK_RECORD_EXPORT_FORMATS,
  TRACK_RECORD_VIEW_TAB_IDS,
} from "@/lib/contractor-track-record";

const VALID_FORMAT_IDS = new Set(TRACK_RECORD_EXPORT_FORMATS.map((f) => f.id));

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const contractor = searchParams.get("contractor")?.trim();
  const tab = searchParams.get("tab") ?? "dbs-qage";
  const formatsParam = searchParams.get("formats") ?? "";

  if (!contractor) {
    return Response.json({ error: "Contractor is required." }, { status: 400 });
  }

  if (!TRACK_RECORD_VIEW_TAB_IDS.has(tab as never)) {
    return Response.json({ error: "Invalid view tab." }, { status: 400 });
  }

  const formats = formatsParam
    .split(",")
    .map((f) => f.trim())
    .filter((f) => VALID_FORMAT_IDS.has(f as never));

  if (formats.length === 0) {
    return Response.json({ error: "Select at least one export format." }, { status: 400 });
  }

  // PDF layout per format will be implemented in a follow-up.
  return Response.json({
    message: `PDF export queued for ${contractor} (${formats.join(", ")}). Format templates coming soon.`,
    contractor,
    tab,
    formats,
  });
}
