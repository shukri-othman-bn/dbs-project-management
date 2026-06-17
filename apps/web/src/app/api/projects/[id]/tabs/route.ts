import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditProject } from "@/lib/permissions";
import { ensureProjectRelations } from "@/lib/data";
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
      await prisma.project.update({
        where: { id },
        data: {
          title: data.title as string,
          lifecycleStage: data.lifecycleStage as never,
          projectType: (data.projectType as ProjectType) || null,
          quotationOrContractNo: (data.quotationOrContractNo as string) || null,
          internalProjectNo: (data.internalProjectNo as string) || null,
          contractorName: (data.contractorName as string) || null,
          supervisingOfficer: (data.supervisingOfficer as string) || null,
          architectName: (data.architectName as string) || null,
          clientsNotes: (data.clientsNotes as string) || null,
          sectionId: (data.sectionId as string) || null,
          clientId: (data.clientId as string) || null,
          oicUserId: (data.oicUserId as string) || null,
          toMonitor: !!data.toMonitor,
        },
      });
      break;
    }
    case "design": {
      await prisma.projectDesign.update({
        where: { projectId: id },
        data: {
          vote: (data.vote as string) || null,
          govtEstimate: parseFloatOrNull(data.govtEstimate),
          contractPeriod: (data.contractPeriod as string) || null,
          designProjectNo: (data.designProjectNo as string) || null,
          designProgressAsOf: parseDate(data.designProgressAsOf),
          archProgress: parseFloatOrNull(data.archProgress),
          qsProgress: parseFloatOrNull(data.qsProgress),
          steProgress: parseFloatOrNull(data.steProgress),
          meProgress: parseFloatOrNull(data.meProgress),
          estimate: parseFloatOrNull(data.estimate),
          svAmount: parseFloatOrNull(data.svAmount),
          remarks: (data.remarks as string) || null,
        },
      });
      break;
    }
    case "tendering": {
      await prisma.projectTendering.update({
        where: { projectId: id },
        data: {
          tenderNo: (data.tenderNo as string) || null,
          openDate: parseDate(data.openDate),
          closingDate: parseDate(data.closingDate),
          extendedClosingDate: parseDate(data.extendedClosingDate),
          recommendationDate: parseDate(data.recommendationDate),
          awardedDate: parseDate(data.awardedDate),
          approvedDate: parseDate(data.approvedDate),
          loaDate: parseDate(data.loaDate),
          startDateInLoa: parseDate(data.startDateInLoa),
          completeDateInLoa: parseDate(data.completeDateInLoa),
          adRemarks: (data.adRemarks as string) || null,
          tenderValidityRemarks: (data.tenderValidityRemarks as string) || null,
          latestQuotationValidityDate: parseDate(data.latestQuotationValidityDate),
        },
      });
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
      await prisma.contractDetails.update({
        where: { projectId: id },
        data: {
          mainContractor: (data.mainContractor as string) || null,
          contractNo: (data.contractNo as string) || null,
          contractPeriod: (data.contractPeriod as string) || null,
          remarks: (data.remarks as string) || null,
        },
      });
      if (data.mainContractor) {
        await prisma.project.update({
          where: { id },
          data: { contractorName: data.mainContractor as string },
        });
      }
      break;
    }
    case "contract-dates": {
      await prisma.contractDetails.update({
        where: { projectId: id },
        data: {
          contractStart: parseDate(data.contractStart),
          contractFinish: parseDate(data.contractFinish),
          revisedContractFinish: parseDate(data.revisedContractFinish),
          contractSigned: parseDate(data.contractSigned),
          loaIssued: parseDate(data.loaIssued),
          bgExpiry: parseDate(data.bgExpiry),
          performanceBondExpiry: parseDate(data.performanceBondExpiry),
          insuranceExpiry: parseDate(data.insuranceExpiry),
          cpcDate: parseDate(data.cpcDate),
          cpcIssued: parseDate(data.cpcIssued),
          edlp: parseDate(data.edlp),
        },
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
