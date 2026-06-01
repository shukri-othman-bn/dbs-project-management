import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const sectionA = await prisma.section.upsert({
    where: { name: "Section A - Planning" },
    update: {},
    create: { name: "Section A - Planning", code: "SEC-A" },
  });
  const sectionB = await prisma.section.upsert({
    where: { name: "Section B - Design" },
    update: {},
    create: { name: "Section B - Design", code: "SEC-B" },
  });
  const sectionC = await prisma.section.upsert({
    where: { name: "Section C - Implementation" },
    update: {},
    create: { name: "Section C - Implementation", code: "SEC-C" },
  });
  const sectionBm3 = await prisma.section.upsert({
    where: { name: "DBS - BM3" },
    update: { unitLabel: "DBS - BM3", code: "BM3" },
    create: { name: "DBS - BM3", code: "BM3", unitLabel: "DBS - BM3" },
  });

  await prisma.financialYear.updateMany({ data: { isCurrent: false } });
  const fy = await prisma.financialYear.upsert({
    where: { label: "2025/2026" },
    update: { isCurrent: true },
    create: {
      label: "2025/2026",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2026-03-31"),
      isCurrent: true,
    },
  });

  const fundingDts = await prisma.fundingType.upsert({
    where: { name: "DTS Allocation" },
    update: {},
    create: { name: "DTS Allocation", mainCategory: "Departmental" },
  });
  const fundingGov = await prisma.fundingType.upsert({
    where: { name: "GOBRN" },
    update: {},
    create: { name: "GOBRN", mainCategory: "Special" },
  });

  const clientMoe = await prisma.client.upsert({
    where: {
      ministry_department: { ministry: "Ministry of Education", department: "School Infrastructure" },
    },
    update: {},
    create: {
      ministry: "Ministry of Education",
      department: "School Infrastructure",
    },
  });
  const clientMoh = await prisma.client.upsert({
    where: {
      ministry_department: { ministry: "Ministry of Health", department: "" },
    },
    update: {},
    create: { ministry: "Ministry of Health", department: "" },
  });
  const clientMod = await prisma.client.upsert({
    where: {
      ministry_department: { ministry: "Ministry of Development", department: "" },
    },
    update: {},
    create: { ministry: "Ministry of Development", department: "" },
  });

  const director = await prisma.user.upsert({
    where: { email: "director@dbs.gov.bn" },
    update: {},
    create: {
      email: "director@dbs.gov.bn",
      name: "Director DBS",
      passwordHash,
      role: Role.DIRECTOR,
    },
  });
  const admin = await prisma.user.upsert({
    where: { email: "admin@dbs.gov.bn" },
    update: {},
    create: {
      email: "admin@dbs.gov.bn",
      name: "System Admin",
      passwordHash,
      role: Role.ADMIN,
    },
  });
  const hos = await prisma.user.upsert({
    where: { email: "hos@dbs.gov.bn" },
    update: {},
    create: {
      email: "hos@dbs.gov.bn",
      name: "Head of Section A",
      passwordHash,
      role: Role.HOS,
      sectionId: sectionA.id,
    },
  });
  const officer1 = await prisma.user.upsert({
    where: { email: "officer1@dbs.gov.bn" },
    update: {},
    create: {
      email: "officer1@dbs.gov.bn",
      name: "MUHAMMAD ABHAR BIN BAHAROM",
      passwordHash,
      role: Role.OFFICER,
      sectionId: sectionC.id,
    },
  });
  const officer2 = await prisma.user.upsert({
    where: { email: "officer2@dbs.gov.bn" },
    update: {},
    create: {
      email: "officer2@dbs.gov.bn",
      name: "Siti binti Abdullah",
      passwordHash,
      role: Role.OFFICER,
      sectionId: sectionB.id,
    },
  });

  const projects = [
    {
      projectNumber: "QBM/46/2026",
      quotationOrContractNo: "QBM/46/2026",
      projectType: "quotations" as const,
      title:
        "TWELVE (12) WEEKS TERM CONTRACT FOR GRASS CUTTING WORKS FOR BUILDING ASSETS UNDER MINISTRY OF DEVELOPMENT, NEGARA BRUNEI DARUSSALAM",
      lifecycleStage: "ongoing" as const,
      sectionId: sectionBm3.id,
      clientId: clientMod.id,
      fundingTypeId: fundingDts.id,
      oicUserId: officer1.id,
      contractorName: "PERUSAHAAN HJ ZAIDI",
      supervisingOfficer: "ABDUL AFIQ BIN SASNAN",
      toMonitor: false,
      allocation: 40000,
      physicalActual: 45,
      physicalScheduled: 50,
      paymentActual: 30,
      paymentScheduled: 35,
      remarks: "Term contract in progress.",
      actionsRequired: "",
      design: {
        vote: "OCAR",
        govtEstimate: 40000,
        contractPeriod: "12 Weeks",
      },
      tendering: {
        tenderNo: "QBM/46/2026",
        openDate: new Date("2026-04-27"),
        closingDate: new Date("2026-05-11"),
        recommendationDate: new Date("2026-05-20"),
        awardedDate: new Date("2026-05-25"),
        approvedDate: new Date("2026-05-25"),
        loaDate: new Date("2026-05-25"),
        startDateInLoa: new Date("2026-05-31"),
        completeDateInLoa: new Date("2026-08-22"),
      },
    },
    {
      projectNumber: "DBS-2025-001",
      title: "Primary School Block Renovation - Tutong",
      lifecycleStage: "ongoing" as const,
      sectionId: sectionC.id,
      clientId: clientMoe.id,
      fundingTypeId: fundingDts.id,
      oicUserId: officer1.id,
      toMonitor: true,
      allocation: 450000,
      physicalActual: 72,
      physicalScheduled: 80,
      paymentActual: 65,
      paymentScheduled: 70,
      remarks: "VO pending approval from client ministry.",
      actionsRequired: "Follow up with JPPE on warrant balance.",
    },
    {
      projectNumber: "DBS-2025-002",
      title: "Clinic Extension Design Services",
      lifecycleStage: "pre_contract" as const,
      sectionId: sectionB.id,
      clientId: clientMoh.id,
      fundingTypeId: fundingDts.id,
      oicUserId: officer2.id,
      toMonitor: false,
      allocation: 120000,
      physicalActual: 35,
      physicalScheduled: 40,
      paymentActual: 20,
      paymentScheduled: 25,
      remarks: "Tender documents under internal review.",
      actionsRequired: "",
      design: {
        vote: "OCAR",
        archProgress: 80,
        qsProgress: 60,
      },
      tendering: {
        tenderNo: "TND/MOH/2025-002",
        openDate: new Date("2026-01-15"),
        closingDate: new Date("2026-02-28"),
        adRemarks: "Awaiting client approval to publish tender.",
      },
    },
    {
      projectNumber: "DBS-2025-003",
      title: "Department Building M&E Upgrade",
      lifecycleStage: "contract" as const,
      sectionId: sectionC.id,
      clientId: clientMoe.id,
      fundingTypeId: fundingGov.id,
      oicUserId: officer1.id,
      toMonitor: false,
      allocation: 280000,
      physicalActual: 15,
      physicalScheduled: 20,
      paymentActual: 10,
      paymentScheduled: 15,
      remarks: "Contract signed; mobilisation next month.",
      actionsRequired: "",
    },
    {
      projectNumber: "DBS-2024-089",
      title: "Road Access Improvement - Belait",
      lifecycleStage: "closed" as const,
      sectionId: sectionA.id,
      clientId: clientMoe.id,
      fundingTypeId: fundingDts.id,
      oicUserId: officer2.id,
      toMonitor: false,
      allocation: 95000,
      physicalActual: 100,
      physicalScheduled: 100,
      paymentActual: 98,
      paymentScheduled: 100,
      remarks: "Project closed. Final account settled.",
      actionsRequired: "",
    },
  ];

  for (const p of projects) {
    const {
      allocation,
      physicalActual,
      physicalScheduled,
      paymentActual,
      paymentScheduled,
      remarks,
      actionsRequired,
      design,
      tendering,
      ...projectData
    } = p;

    const project = await prisma.project.upsert({
      where: { projectNumber: projectData.projectNumber },
      update: {
        title: projectData.title,
        lifecycleStage: projectData.lifecycleStage,
        sectionId: projectData.sectionId,
        clientId: projectData.clientId,
        fundingTypeId: projectData.fundingTypeId,
        oicUserId: projectData.oicUserId,
        toMonitor: projectData.toMonitor,
        quotationOrContractNo: projectData.quotationOrContractNo,
        projectType: projectData.projectType,
        contractorName: projectData.contractorName,
        supervisingOfficer: projectData.supervisingOfficer,
      },
      create: projectData,
    });

    await prisma.projectBudget.upsert({
      where: {
        projectId_financialYearId: {
          projectId: project.id,
          financialYearId: fy.id,
        },
      },
      update: { allocation },
      create: {
        projectId: project.id,
        financialYearId: fy.id,
        allocation,
        encumbranceTotal: allocation * 0.6,
        encumbranceBalance: allocation * 0.15,
      },
    });

    const existingUpdate = await prisma.statusUpdate.findFirst({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
    });

    if (!existingUpdate) {
      await prisma.statusUpdate.create({
        data: {
          projectId: project.id,
          progressAsOf: new Date(),
          physicalActual,
          physicalScheduled,
          paymentActual,
          paymentScheduled,
          remarks,
          actionsRequired: actionsRequired || null,
        },
      });
    }

    const warrantCount = await prisma.budgetLine.count({
      where: { projectId: project.id, type: "warrant" },
    });
    if (warrantCount === 0) {
      await prisma.budgetLine.create({
        data: {
          projectId: project.id,
          financialYearId: fy.id,
          type: "warrant",
          date: new Date("2025-06-15"),
          amountApproved: allocation * 0.85,
          amountBalance: allocation * 0.15,
          description: "Initial warrant approval",
        },
      });
      await prisma.budgetLine.createMany({
        data: [
          {
            projectId: project.id,
            financialYearId: fy.id,
            type: "payment",
            date: new Date("2025-09-01"),
            amountApproved: allocation * 0.3,
            amountCertified: allocation * 0.28,
            voucherRef: "BV-2025-001",
            description: "Progress payment 1",
          },
          {
            projectId: project.id,
            financialYearId: fy.id,
            type: "payment",
            date: new Date("2025-11-15"),
            amountApproved: allocation * 0.25,
            amountCertified: allocation * 0.25,
            voucherRef: "BV-2025-002",
            description: "Progress payment 2",
          },
        ],
      });
    }

    if (projectData.lifecycleStage !== "pre_contract") {
      await prisma.contractDetails.upsert({
        where: { projectId: project.id },
        update: {},
        create: {
          projectId: project.id,
          mainContractor: "ABC Construction Sdn Bhd",
          contractNo: `CTR-${projectData.projectNumber}`,
          contractSum: allocation * 0.9,
          contractStart: new Date("2025-05-01"),
          contractFinish: new Date("2026-02-28"),
        },
      });
    }

    const designData = design ?? {
      estimate: allocation,
      svAmount: allocation * 0.05,
      ...(projectData.lifecycleStage === "pre_contract"
        ? { archProgress: 80, qsProgress: 60 }
        : {}),
    };
    await prisma.projectDesign.upsert({
      where: { projectId: project.id },
      update: designData,
      create: { projectId: project.id, ...designData },
    });

    if (tendering) {
      await prisma.projectTendering.upsert({
        where: { projectId: project.id },
        update: tendering,
        create: { projectId: project.id, ...tendering },
      });
    }

    await prisma.projectCompletion.upsert({
      where: { projectId: project.id },
      update: {},
      create: { projectId: project.id },
    });
    await prisma.projectDocuments.upsert({
      where: { projectId: project.id },
      update: {},
      create: { projectId: project.id },
    });
  }

  console.log("Seed complete.");
  console.log("Login accounts (password: password123):");
  console.log("  Director:", director.email);
  console.log("  Admin:", admin.email);
  console.log("  HOS:", hos.email);
  console.log("  Officer 1:", officer1.email);
  console.log("  Officer 2:", officer2.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
