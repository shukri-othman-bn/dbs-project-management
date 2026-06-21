import { prisma } from "@/lib/prisma";
import { getFsorSyncBaseUrl, type FsorSyncState } from "@/lib/fsor-sync";
import { nextProgressClaimNo } from "@/lib/payment-valuation";
import {
  syncPurchaseOrderForPaymentLine,
  WarrantInsufficientError,
} from "@/lib/purchase-order-sync";

export type FsorJobOrder = {
  id: string;
  contractId: string;
  buildingName?: string;
  visitDate?: string;
  grandTotal?: number;
  bidPercent?: number;
  status?: string;
  instructionNo?: string;
  signedAt?: string | null;
  issuedAt?: string | null;
  statusUpdatedAt?: string;
  soiInstructions?: string;
};

const SKIP_STATUSES = new Set(["draft"]);

function parseIsoDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatJoNo(jo: FsorJobOrder): string {
  if (jo.instructionNo) return String(jo.instructionNo).padStart(2, "0");
  return jo.id.slice(0, 8);
}

export async function fetchFsorSyncState(): Promise<FsorSyncState | null> {
  try {
    const res = await fetch(`${getFsorSyncBaseUrl()}/state`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as FsorSyncState;
  } catch {
    return null;
  }
}

async function ensurePaymentValuationLine(projectId: string, fsorJo: FsorJobOrder) {
  const amount = Number(fsorJo.grandTotal) || 0;
  const claimDate = parseIsoDate(fsorJo.issuedAt);

  const existing = await prisma.budgetLine.findUnique({
    where: { fsorJoId: fsorJo.id },
  });

  if (existing) {
    const line = await prisma.budgetLine.update({
      where: { id: existing.id },
      data: {
        claimDate,
        date: claimDate,
        amountCertified: amount,
        amountApproved: amount,
        description: null,
      },
    });
    try {
      await syncPurchaseOrderForPaymentLine(line);
    } catch (error) {
      if (!(error instanceof WarrantInsufficientError)) throw error;
      console.warn(
        `FSOR sync: insufficient warrant for payment line ${line.id} on project ${projectId}`
      );
    }
    return;
  }

  const progressClaimNo = await nextProgressClaimNo(projectId);

  const line = await prisma.budgetLine.create({
    data: {
      projectId,
      fsorJoId: fsorJo.id,
      type: "payment",
      claimDate,
      date: claimDate,
      progressClaimNo,
      amountCertified: amount,
      amountApproved: amount,
    },
  });

  try {
    await syncPurchaseOrderForPaymentLine(line);
  } catch (error) {
    if (!(error instanceof WarrantInsufficientError)) throw error;
    console.warn(
      `FSOR sync: insufficient warrant for payment line ${line.id} on project ${projectId}`
    );
  }
}

async function upsertDpmJobOrderFromFsor(
  projectId: string,
  fsorJo: FsorJobOrder,
  contractFinish: Date | null,
  defaultBidPercent: number | null
) {
  const data = {
    projectId,
    fsorJoId: fsorJo.id,
    fsorStatus: fsorJo.status ?? null,
    fsorSyncedAt: new Date(),
    joNo: formatJoNo(fsorJo),
    joAmount: Number(fsorJo.grandTotal) || 0,
    fsorPercent:
      fsorJo.bidPercent != null
        ? Number(fsorJo.bidPercent)
        : defaultBidPercent,
    joStart: parseIsoDate(fsorJo.visitDate),
    cmgdIssued: parseIsoDate(fsorJo.issuedAt),
    joEdlpDue: contractFinish,
  };

  await prisma.jobOrder.upsert({
    where: { fsorJoId: fsorJo.id },
    create: data,
    update: data,
  });

  if (fsorJo.status === "issued" && fsorJo.issuedAt) {
    await ensurePaymentValuationLine(projectId, fsorJo);
  }
}

export async function syncFsorJobOrdersForProject(projectId: string): Promise<{
  synced: number;
  errors: string[];
}> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { contract: true, fsorConfig: true },
  });
  if (!project || project.contractCategory !== "fsor") {
    return { synced: 0, errors: ["Not an FSOR project"] };
  }

  const state = await fetchFsorSyncState();
  if (!state) return { synced: 0, errors: ["FSOR sync server offline"] };

  const jos = ((state.jobOrders ?? []) as FsorJobOrder[]).filter(
    (jo) =>
      jo.contractId === projectId &&
      jo.status &&
      !SKIP_STATUSES.has(jo.status)
  );

  let synced = 0;
  const errors: string[] = [];

  for (const fsorJo of jos) {
    try {
      await upsertDpmJobOrderFromFsor(
        projectId,
        fsorJo,
        project.contract?.contractFinish ?? null,
        project.fsorConfig?.defaultBidPercent ?? null
      );
      synced += 1;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Sync failed");
    }
  }

  return { synced, errors };
}

export async function syncAllFsorJobOrders(): Promise<{ projects: number; synced: number }> {
  const projects = await prisma.project.findMany({
    where: { contractCategory: "fsor" },
    select: { id: true },
  });

  let synced = 0;
  for (const project of projects) {
    const result = await syncFsorJobOrdersForProject(project.id);
    synced += result.synced;
  }

  return { projects: projects.length, synced };
}
