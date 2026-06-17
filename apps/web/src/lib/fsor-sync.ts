import { prisma } from "@/lib/prisma";
import type { ContractCategory, Prisma } from "@prisma/client";

export type FsorContract = {
  id: string;
  name: string;
  reference: string;
  contractorName: string;
  ceilingAmount: number;
  bidPercent: number;
  startDate: string;
  endDate: string;
  currency: string;
  tenderNo: string;
  requestRef: string;
  pwdNo: string;
  others: string;
  soiRef: string;
  signatoryName: string;
  signatoryTitle: string;
  scopeDescription: string;
  buildings: string[];
};

export type FsorSyncState = {
  version: number;
  updatedAt: string;
  contracts: FsorContract[];
  ledger: Array<{
    joId: string;
    contractId: string;
    buildingName: string;
    visitDate: string;
    grandTotal: number;
    status: string;
    statusUpdatedAt: string;
    issuedAt: string | null;
  }>;
  jobOrders: Array<{
    id: string;
    contractId: string;
    buildingName: string;
    visitDate: string;
    grandTotal: number;
    bidPercent?: number;
    status: string;
    statusUpdatedAt?: string;
    instructionNo?: string;
    signedAt?: string | null;
    issuedAt?: string | null;
    soiInstructions?: string;
  }>;
  activeContractId: string | null;
};

export type FsorProjectStatus = {
  online: boolean;
  jobOrderCount: number;
  byStatus: Record<string, number>;
  committedTotal: number;
  ceilingAmount: number;
  remaining: number;
  lastSyncedAt: string | null;
  jobOrders: Array<{
    id: string;
    buildingName: string;
    visitDate: string;
    grandTotal: number;
    status: string;
    instructionNo?: string;
  }>;
};

type ProjectForFsor = Prisma.ProjectGetPayload<{
  include: {
    tendering: true;
    contract: true;
    fsorConfig: true;
    budgets: true;
  };
}>;

function toIsoDate(value: Date | null | undefined): string {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

function parseBuildings(text: string | null | undefined): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of String(text || "").split(/\r?\n/)) {
    const name = line.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    result.push(name);
  }
  return result;
}

export function getFsorSyncBaseUrl(): string {
  const base = process.env.FSOR_SYNC_URL || "http://127.0.0.1:8765/api/v1";
  return base.replace(/\/$/, "");
}

export function getFsorAppBaseUrl(): string {
  return (process.env.FSOR_APP_URL || "http://127.0.0.1:8765").replace(/\/$/, "");
}

export function toFsorContract(project: ProjectForFsor): FsorContract {
  const fsor = project.fsorConfig;
  const ceilingAmount =
    project.contract?.contractSum ??
    project.contract?.revisedContractSum ??
    project.budgets[0]?.allocation ??
    0;

  return {
    id: project.id,
    name: project.title,
    reference:
      project.contract?.contractNo ??
      project.quotationOrContractNo ??
      project.projectNumber,
    contractorName:
      project.contractorName ?? project.contract?.mainContractor ?? "",
    ceilingAmount: Number(ceilingAmount) || 0,
    bidPercent: fsor?.defaultBidPercent ?? 5,
    startDate: toIsoDate(
      project.contract?.contractStart ?? project.tendering?.startDateInLoa
    ),
    endDate: toIsoDate(
      project.contract?.contractFinish ?? project.tendering?.completeDateInLoa
    ),
    currency: "BND",
    tenderNo: project.tendering?.tenderNo ?? "",
    requestRef: project.quotationOrContractNo ?? "-",
    pwdNo: fsor?.pwdNo ?? "-",
    others: fsor?.others ?? "-",
    soiRef: fsor?.soiRef ?? project.quotationOrContractNo ?? "",
    signatoryName: fsor?.signatoryName ?? "",
    signatoryTitle: fsor?.signatoryTitle ?? "",
    scopeDescription:
      fsor?.scopeDescription ??
      project.contract?.remarks ??
      project.clientsNotes ??
      "",
    buildings: fsor?.buildings ?? [],
  };
}

export function validateFsorContract(contract: FsorContract): string[] {
  const errors: string[] = [];
  if (!contract.name.trim()) errors.push("Project title is required.");
  if (contract.ceilingAmount <= 0) errors.push("Contract sum / budget ceiling must be greater than zero.");
  if (!contract.contractorName.trim()) errors.push("Contractor name is required.");
  if (!contract.buildings.length) errors.push("At least one building is required for FSOR.");
  return errors;
}

export async function loadProjectForFsor(projectId: string): Promise<ProjectForFsor | null> {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tendering: true,
      contract: true,
      fsorConfig: true,
      budgets: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function syncProjectToFsor(projectId: string): Promise<{
  ok: boolean;
  errors?: string[];
  syncedAt?: string;
}> {
  const project = await loadProjectForFsor(projectId);
  if (!project) return { ok: false, errors: ["Project not found"] };
  if (project.contractCategory !== ("fsor" satisfies ContractCategory)) {
    return { ok: false, errors: ["Project is not FSOR category"] };
  }

  const contract = toFsorContract(project);
  const validationErrors = validateFsorContract(contract);
  if (validationErrors.length) {
    return { ok: false, errors: validationErrors };
  }

  const url = `${getFsorSyncBaseUrl()}/contracts/${encodeURIComponent(project.id)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ ...contract, setActive: true }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      errors: [`FSOR sync failed (${res.status})${text ? `: ${text.slice(0, 200)}` : ""}`],
    };
  }

  const syncedAt = new Date();
  await prisma.projectFsorConfig.upsert({
    where: { projectId },
    update: { lastSyncedAt: syncedAt },
    create: { projectId, lastSyncedAt: syncedAt },
  });

  return { ok: true, syncedAt: syncedAt.toISOString() };
}

const COMMITTED_STATUSES = new Set(["signed", "issued"]);

export async function fetchFsorProjectStatus(projectId: string): Promise<FsorProjectStatus> {
  const project = await loadProjectForFsor(projectId);
  const contract = project ? toFsorContract(project) : null;
  const empty: FsorProjectStatus = {
    online: false,
    jobOrderCount: 0,
    byStatus: {},
    committedTotal: 0,
    ceilingAmount: contract?.ceilingAmount ?? 0,
    remaining: contract?.ceilingAmount ?? 0,
    lastSyncedAt: project?.fsorConfig?.lastSyncedAt?.toISOString() ?? null,
    jobOrders: [],
  };

  try {
    const res = await fetch(`${getFsorSyncBaseUrl()}/state`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return empty;

    const state = (await res.json()) as FsorSyncState;
    const jos = (state.jobOrders ?? []).filter((jo) => jo.contractId === projectId);
    const ledger = (state.ledger ?? []).filter((e) => e.contractId === projectId);
    const byStatus: Record<string, number> = {};
    for (const jo of jos) {
      byStatus[jo.status] = (byStatus[jo.status] ?? 0) + 1;
    }

    const committedTotal = ledger
      .filter((e) => COMMITTED_STATUSES.has(e.status))
      .reduce((sum, e) => sum + (Number(e.grandTotal) || 0), 0);

    const ceilingAmount = contract?.ceilingAmount ?? 0;

    return {
      online: true,
      jobOrderCount: jos.length,
      byStatus,
      committedTotal,
      ceilingAmount,
      remaining: Math.max(0, ceilingAmount - committedTotal),
      lastSyncedAt: project?.fsorConfig?.lastSyncedAt?.toISOString() ?? null,
      jobOrders: jos
        .slice()
        .sort((a, b) => String(b.statusUpdatedAt ?? b.visitDate).localeCompare(String(a.statusUpdatedAt ?? a.visitDate)))
        .slice(0, 20)
        .map((jo) => ({
          id: jo.id,
          buildingName: jo.buildingName,
          visitDate: jo.visitDate,
          grandTotal: jo.grandTotal,
          status: jo.status,
          instructionNo: jo.instructionNo,
        })),
    };
  } catch {
    return empty;
  }
}

export { parseBuildings };
