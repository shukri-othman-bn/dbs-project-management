import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { defaultUnitAllocation, UNIT_CODES } from "../src/lib/units";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const units: Record<string, { id: string }> = {};
  const officers: Record<string, { id: string }> = {};

  for (let i = 0; i < UNIT_CODES.length; i++) {
    const code = UNIT_CODES[i];
    const unit = await prisma.section.upsert({
      where: { code },
      update: { name: code, unitLabel: code },
      create: { name: code, code, unitLabel: code },
    });
    units[code] = unit;

    const email = `officer${i + 1}@dbs.gov.bn`;
    const officer = await prisma.user.upsert({
      where: { email },
      update: {
        name: `Officer ${i + 1}`,
        sectionId: unit.id,
        role: Role.OFFICER,
      },
      create: {
        email,
        name: `Officer ${i + 1}`,
        passwordHash,
        role: Role.OFFICER,
        sectionId: unit.id,
      },
    });
    officers[code] = officer;
  }

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

  for (const code of UNIT_CODES) {
    const allocation = defaultUnitAllocation(code);
    await prisma.sectionBudget.upsert({
      where: {
        sectionId_financialYearId: {
          sectionId: units[code].id,
          financialYearId: fy.id,
        },
      },
      update: { allocation },
      create: {
        sectionId: units[code].id,
        financialYearId: fy.id,
        allocation,
      },
    });
  }

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

  const projects = [
    {
      projectNumber: "QBM/46/2026",
      quotationOrContractNo: "QBM/46/2026",
      projectType: "quotations" as const,
      title:
        "TWELVE (12) WEEKS TERM CONTRACT FOR GRASS CUTTING WORKS FOR BUILDING ASSETS UNDER MINISTRY OF DEVELOPMENT, NEGARA BRUNEI DARUSSALAM",
      lifecycleStage: "ongoing" as const,
      unitCode: "BM3",
      clientId: clientMod.id,
      fundingTypeId: fundingDts.id,
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
      unitCode: "BM7",
      clientId: clientMoe.id,
      fundingTypeId: fundingDts.id,
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
      unitCode: "BM2",
      clientId: clientMoh.id,
      fundingTypeId: fundingDts.id,
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
      unitCode: "IMU1",
      clientId: clientMoe.id,
      fundingTypeId: fundingGov.id,
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
      unitCode: "BM1",
      clientId: clientMoe.id,
      fundingTypeId: fundingDts.id,
      toMonitor: false,
      allocation: 95000,
      physicalActual: 100,
      physicalScheduled: 100,
      paymentActual: 98,
      paymentScheduled: 100,
      remarks: "Project closed. Final account settled.",
      actionsRequired: "",
    },
    {
      projectNumber: "DBS-2025-004",
      title: "Hospital Ward Refurbishment",
      lifecycleStage: "ongoing" as const,
      unitCode: "BM5",
      clientId: clientMoh.id,
      fundingTypeId: fundingDts.id,
      toMonitor: false,
      allocation: 320000,
      physicalActual: 55,
      physicalScheduled: 60,
      paymentActual: 40,
      paymentScheduled: 45,
      remarks: "Works progressing on schedule.",
      actionsRequired: "",
    },
    {
      projectNumber: "DBS-2025-005",
      title: "Infrastructure Monitoring System",
      lifecycleStage: "pre_contract" as const,
      unitCode: "IMU2",
      clientId: clientMod.id,
      fundingTypeId: fundingGov.id,
      toMonitor: false,
      allocation: 180000,
      physicalActual: 20,
      physicalScheduled: 25,
      paymentActual: 10,
      paymentScheduled: 15,
      remarks: "Consultancy phase.",
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
      unitCode,
      ...projectData
    } = p;

    const sectionId = units[unitCode].id;
    const oicUserId = officers[unitCode].id;

    const project = await prisma.project.upsert({
      where: { projectNumber: projectData.projectNumber },
      update: {
        title: projectData.title,
        lifecycleStage: projectData.lifecycleStage,
        sectionId,
        clientId: projectData.clientId,
        fundingTypeId: projectData.fundingTypeId,
        oicUserId,
        toMonitor: projectData.toMonitor,
        quotationOrContractNo: projectData.quotationOrContractNo,
        projectType: projectData.projectType,
        contractorName:
          "contractorName" in projectData
            ? (projectData as { contractorName?: string }).contractorName
            : undefined,
        supervisingOfficer:
          "supervisingOfficer" in projectData
            ? (projectData as { supervisingOfficer?: string }).supervisingOfficer
            : undefined,
      },
      create: {
        ...projectData,
        sectionId,
        oicUserId,
      },
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
            claimDate: new Date("2025-08-15"),
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
            claimDate: new Date("2025-11-01"),
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
          contractPeriod: "12 Weeks",
          contractStart: new Date("2025-05-01"),
          contractFinish: new Date("2026-02-28"),
          revisedContractFinish: new Date("2026-05-28"),
        },
      });

      const voCount = await prisma.variationOrder.count({ where: { projectId: project.id } });
      if (voCount === 0) {
        await prisma.variationOrder.createMany({
          data: [
            {
              projectId: project.id,
              voNo: `VO-${projectData.projectNumber}-01`,
              amount: allocation * 0.05,
              submittedDate: new Date("2025-08-01"),
              approvedDate: new Date("2025-09-10"),
            },
            {
              projectId: project.id,
              voNo: `VO-${projectData.projectNumber}-02`,
              amount: allocation * 0.03,
              submittedDate: new Date("2025-10-15"),
              approvedDate: null,
            },
          ],
        });
      }

      await prisma.extensionOfTime.deleteMany({ where: { projectId: project.id } });
      await prisma.extensionOfTime.createMany({
          data: [
            {
              projectId: project.id,
              eotNo: `EOT-${projectData.projectNumber}-01`,
              eotPeriod: "4 Weeks",
              submittedDate: new Date("2025-07-20"),
              approvedDate: new Date("2025-08-05"),
            },
            {
              projectId: project.id,
              eotNo: `EOT-${projectData.projectNumber}-02`,
              eotPeriod: "2 Weeks",
              submittedDate: new Date("2025-11-01"),
              approvedDate: null,
            },
          ],
        });

      await prisma.jobOrder.deleteMany({ where: { projectId: project.id } });
      await prisma.jobOrder.createMany({
        data: [
          {
            projectId: project.id,
            joNo: `JO-${projectData.projectNumber}-01`,
            joAmount: allocation * 0.08,
            fsorPercent: 92,
            joStart: new Date("2025-06-01"),
            actualJoFinish: new Date("2025-08-15"),
            joEdlpDue: new Date("2025-09-01"),
            cmgdIssued: new Date("2025-08-20"),
          },
          {
            projectId: project.id,
            joNo: `JO-${projectData.projectNumber}-02`,
            joAmount: allocation * 0.04,
            fsorPercent: 88,
            joStart: new Date("2025-10-01"),
            actualJoFinish: null,
            joEdlpDue: new Date("2025-12-01"),
            cmgdIssued: null,
          },
        ],
      });

      await prisma.purchaseOrder.deleteMany({ where: { projectId: project.id } });
      await prisma.purchaseOrder.createMany({
        data: [
          {
            projectId: project.id,
            claimDate: new Date("2025-07-01"),
            claimCertified: allocation * 0.06,
            poAmount: allocation * 0.06,
            sesDate: new Date("2025-07-15"),
            invoiceDate: new Date("2025-08-01"),
            eDispatchedDate: new Date("2025-08-20"),
            paidDate: new Date("2025-09-05"),
          },
          {
            projectId: project.id,
            claimDate: new Date("2025-11-10"),
            claimCertified: allocation * 0.04,
            poAmount: allocation * 0.04,
            sesDate: new Date("2025-11-20"),
            invoiceDate: null,
            eDispatchedDate: null,
            paidDate: null,
          },
        ],
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

  await prisma.matterRequest.deleteMany();
  const requestSamples = [
    {
      unitCode: "BM1",
      ticketNo: "TKT-2025-001",
      complainant: "Ahmad bin Haji Yusof",
      contactNo: "+673 712 3456",
      address: "Kg Sengkurong, Brunei-Muara",
      complaintReceived: new Date("2025-06-12"),
      receivedMethod: "Walk-in",
      typeOfComplaint: "Road defect",
      status: "Open",
    },
    {
      unitCode: "BM1",
      ticketNo: "TKT-2025-002",
      complainant: "Siti binti Abdullah",
      contactNo: "+673 823 4567",
      address: "Jalan Berakas, Brunei-Muara",
      complaintReceived: new Date("2025-07-03"),
      receivedMethod: "Email",
      typeOfComplaint: "Drainage",
      status: "In Progress",
    },
    {
      unitCode: "BM2",
      ticketNo: "TKT-2025-003",
      complainant: "Haji Omar bin Bakar",
      contactNo: "+673 734 5678",
      address: "Kg Tutong",
      complaintReceived: new Date("2025-08-15"),
      receivedMethod: "Phone",
      typeOfComplaint: "Street lighting",
      status: "Closed",
    },
    {
      unitCode: "BM3",
      ticketNo: "TKT-2025-004",
      complainant: "Nurul Izzati",
      contactNo: "+673 845 6789",
      address: "Seria, Belait",
      complaintReceived: new Date("2025-09-01"),
      receivedMethod: "Online form",
      typeOfComplaint: "Pothole",
      status: "Open",
    },
    {
      unitCode: "IMU1",
      ticketNo: "TKT-2025-005",
      complainant: "Lim Wei Ming",
      contactNo: "+673 756 7890",
      address: "Kg Kiudang, Tutong",
      complaintReceived: new Date("2025-10-20"),
      receivedMethod: "Walk-in",
      typeOfComplaint: "Footpath damage",
      status: "In Progress",
    },
    {
      unitCode: "IMU2",
      ticketNo: "TKT-2025-006",
      complainant: "Rosnah binti Haji",
      contactNo: "+673 867 8901",
      address: "Kg Lamunin, Tutong",
      complaintReceived: new Date("2025-11-05"),
      receivedMethod: "Email",
      typeOfComplaint: "Flooding",
      status: "Open",
    },
  ] as const;

  await prisma.matterRequest.createMany({
    data: requestSamples.map((sample) => ({
      sectionId: units[sample.unitCode].id,
      ticketNo: sample.ticketNo,
      complainant: sample.complainant,
      contactNo: sample.contactNo,
      address: sample.address,
      complaintReceived: sample.complaintReceived,
      receivedMethod: sample.receivedMethod,
      typeOfComplaint: sample.typeOfComplaint,
      status: sample.status,
    })),
  });

  console.log("Seed complete.");
  console.log("Login accounts (password: password123):");
  console.log("  Director:", director.email);
  console.log("  Admin:", admin.email);
  for (let i = 0; i < UNIT_CODES.length; i++) {
    console.log(`  Officer ${i + 1} (${UNIT_CODES[i]}):`, `officer${i + 1}@dbs.gov.bn`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
