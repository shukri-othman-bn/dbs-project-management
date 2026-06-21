import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditProject } from "@/lib/permissions";
import { ensureProjectRelations } from "@/lib/data";
import { resolveClientId } from "@/lib/clients";
import { parseBuildings, syncProjectToFsor } from "@/lib/fsor-sync";
import { syncFsorJobOrdersForProject } from "@/lib/fsor-jo-sync";
import { ProjectType } from "@prisma/client";
import { NextResponse } from "next/server";

function parseDate(v: unknown): Date | null {
  if (!v || v === "") return null;
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d;
}

function parseFloatOrNull(v: unknown): number | null {
  if (v === "" || v == null) return null;
  const n = parseFloat(String(v));
  return isNaN(n) ? null : n;
}

async function syncContractPeriod(projectId: string, period: string | null) {
  const value = period?.trim() || null;
  await Promise.all([
    prisma.projectTendering.update({
      where: { projectId },
      data: { completionPeriod: value },
    }),
    prisma.contractDetails.update({
      where: { projectId },
      data: { contractPeriod: value },
    }),
  ]);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEditProject(session.user, project)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { tab, data } = body as { tab: string; data: Record<string, unknown> };
  await ensureProjectRelations(id);

  switch (tab) {
    case "header": {
      const clientId =
        "clientMinistry" in data || "clientDepartment" in data
          ? await resolveClientId(
              data.clientMinistry as string,
              data.clientDepartment as string
            )
          : undefined;

      await prisma.project.update({
        where: { id },
        data: {
          title: data.title as string,
          lifecycleStage: data.lifecycleStage as never,
          projectType: (data.projectType as ProjectType) || null,
          quotationOrContractNo: (data.quotationOrContractNo as string) || null,
          internalProjectNo: (data.internalProjectNo as string) || null,
          contractorName: (data.contractorName as string) || null,
          sectionId: (data.sectionId as string) || null,
          ...(clientId !== undefined ? { clientId } : {}),
          oicUserId: null,
          oicName: (data.oicName as string)?.trim() || null,
          oicEmail: (data.oicEmail as string)?.trim() || null,
          toMonitor: !!data.toMonitor,
        },
      });
      break;
    }
    case "design": {
      const designUpdates: Record<string, unknown> = {};
      if ("preliminaryEstimate" in data) {
        designUpdates.preliminaryEstimate = parseFloatOrNull(data.preliminaryEstimate);
      }
      if ("designProjectNo" in data) {
        designUpdates.designProjectNo = (data.designProjectNo as string) || null;
      }
      if ("designProgressAsOf" in data) {
        designUpdates.designProgressAsOf = parseDate(data.designProgressAsOf);
      }
      if ("dateDrawingsCompleted" in data) {
        designUpdates.dateDrawingsCompleted = parseDate(data.dateDrawingsCompleted);
      }
      if ("dateMeBqReceived" in data) {
        designUpdates.dateMeBqReceived = parseDate(data.dateMeBqReceived);
      }
      if ("dateBqCompleted" in data) {
        designUpdates.dateBqCompleted = parseDate(data.dateBqCompleted);
      }
      if ("dateOtherDocumentsReceived" in data) {
        designUpdates.dateOtherDocumentsReceived = parseDate(data.dateOtherDocumentsReceived);
      }
      if ("svAmount" in data) {
        designUpdates.svAmount = parseFloatOrNull(data.svAmount);
      }
      if ("remarks" in data) {
        designUpdates.remarks = (data.remarks as string) || null;
      }
      await prisma.projectDesign.update({
        where: { projectId: id },
        data: designUpdates,
      });
      break;
    }
    case "tendering": {
      const completionPeriod =
        "completionPeriod" in data ? (data.completionPeriod as string) || null : undefined;

      await prisma.projectTendering.update({
        where: { projectId: id },
        data: {
          tenderNo: (data.tenderNo as string) || null,
          ...(completionPeriod !== undefined ? { completionPeriod } : {}),
          openDate: parseDate(data.openDate),
          closingDate: parseDate(data.closingDate),
          extendedClosingDate: parseDate(data.extendedClosingDate),
          receivedDate: parseDate(data.receivedDate),
          recommendationDate: parseDate(data.recommendationDate),
          recommendationFromDbsoDate: parseDate(data.recommendationFromDbsoDate),
          ...( "awardedDate" in data ? { awardedDate: parseDate(data.awardedDate) } : {}),
          approvedDate: parseDate(data.approvedDate),
          loaDate: parseDate(data.loaDate),
          startDateInLoa: parseDate(data.startDateInLoa),
          completeDateInLoa: parseDate(data.completeDateInLoa),
          adRemarks: (data.adRemarks as string) || null,
          tenderValidityRemarks: (data.tenderValidityRemarks as string) || null,
          latestQuotationValidityDate: parseDate(data.latestQuotationValidityDate),
        },
      });

      if (completionPeriod !== undefined) {
        await syncContractPeriod(id, completionPeriod);
      }
      break;
    }
    case "documents": {
      await prisma.projectDocuments.update({
        where: { projectId: id },
        data: {
          otherDocumentNotes: (data.otherDocumentNotes as string) || null,
          submissionNotes: (data.submissionNotes as string) || null,
        },
      });
      break;
    }
    case "contract-details": {
      const contractPeriod =
        "contractPeriod" in data ? (data.contractPeriod as string) || null : undefined;

      await prisma.contractDetails.update({
        where: { projectId: id },
        data: {
          mainContractor: (data.mainContractor as string) || null,
          contractNo: (data.contractNo as string) || null,
          ...(contractPeriod !== undefined ? { contractPeriod } : {}),
          remarks: (data.remarks as string) || null,
        },
      });
      if (contractPeriod !== undefined) {
        await syncContractPeriod(id, contractPeriod);
      }
      if (data.mainContractor) {
        await prisma.project.update({
          where: { id },
          data: { contractorName: data.mainContractor as string },
        });
      }
      break;
    }
    case "contract-dates": {
      const dateFields = [
        "contractStart",
        "contractFinish",
        "revisedContractFinish",
        "loaIssued",
        "bgStartDate",
        "bgExpiry",
        "insuranceStartDate",
        "insuranceExpiry",
        "sitePossessionDate",
        "cpcIssued",
        "cncDate",
        "edlp",
        "revisedEdlpDate",
        "cmgdIssuedDate",
      ] as const;

      const updates: Record<string, Date | null> = {};
      for (const field of dateFields) {
        if (field in data) {
          updates[field] = parseDate(data[field]);
        }
      }

      await prisma.contractDetails.update({
        where: { projectId: id },
        data: updates,
      });
      break;
    }
    case "contract-amounts": {
      await prisma.contractDetails.update({
        where: { projectId: id },
        data: {
          contractSum: parseFloatOrNull(data.contractSum),
          revisedContractSum: parseFloatOrNull(data.revisedContractSum),
          finalAccountSum: parseFloatOrNull(data.finalAccountSum),
          retentionSum: parseFloatOrNull(data.retentionSum),
        },
      });
      break;
    }
    case "completion": {
      await prisma.projectCompletion.update({
        where: { projectId: id },
        data: {
          progressAsOf: parseDate(data.progressAsOf),
          physicalActual: parseFloatOrNull(data.physicalActual),
          physicalScheduled: parseFloatOrNull(data.physicalScheduled),
          paymentActual: parseFloatOrNull(data.paymentActual),
          paymentScheduled: parseFloatOrNull(data.paymentScheduled),
          completionDate: parseDate(data.completionDate),
          defectsLiabilityEnd: parseDate(data.defectsLiabilityEnd),
          finalAccountDate: parseDate(data.finalAccountDate),
          remarks: (data.remarks as string) || null,
          actionsRequired: (data.actionsRequired as string) || null,
        },
      });
      break;
    }
    case "fsor": {
      await prisma.projectFsorConfig.upsert({
        where: { projectId: id },
        update: {
          defaultBidPercent: parseFloatOrNull(data.defaultBidPercent) ?? 5,
          pwdNo: (data.pwdNo as string) || null,
          others: (data.others as string) || null,
          soiRef: (data.soiRef as string) || null,
          signatoryName: (data.signatoryName as string) || null,
          signatoryTitle: (data.signatoryTitle as string) || null,
          scopeDescription: (data.scopeDescription as string) || null,
          buildings: parseBuildings(data.buildings as string),
        },
        create: {
          projectId: id,
          defaultBidPercent: parseFloatOrNull(data.defaultBidPercent) ?? 5,
          pwdNo: (data.pwdNo as string) || null,
          others: (data.others as string) || null,
          soiRef: (data.soiRef as string) || null,
          signatoryName: (data.signatoryName as string) || null,
          signatoryTitle: (data.signatoryTitle as string) || null,
          scopeDescription: (data.scopeDescription as string) || null,
          buildings: parseBuildings(data.buildings as string),
        },
      });
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown tab" }, { status: 400 });
  }

  const updatedProject = await prisma.project.findUnique({ where: { id } });
  let fsorSync: { ok: boolean; error?: string; syncedAt?: string } | undefined;
  if (updatedProject?.contractCategory === "fsor" && tab === "fsor") {
    const result = await syncProjectToFsor(id);
    fsorSync = result.ok
      ? { ok: true, syncedAt: result.syncedAt }
      : { ok: false, error: result.errors?.join(" ") ?? "Sync failed" };
    if (result.ok) {
      await syncFsorJobOrdersForProject(id).catch(() => null);
    }
  }

  return NextResponse.json({ ok: true, fsorSync });
}
