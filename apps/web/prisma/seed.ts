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
  const admin =   await prisma.user.upsert({
    where: { email: "admin@dbs.gov.bn" },
    update: {},
    create: {
      email: "admin@dbs.gov.bn",
      name: "System Admin",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const projectAdminPasswordHash = await bcrypt.hash("ProjectAdmin2026!", 10);
  const projectAdmin = await prisma.user.upsert({
    where: { email: "projectadmin@dbs.gov.bn" },
    update: {
      name: "Project Admin",
      role: Role.PROJECT_ADMIN,
      passwordHash: projectAdminPasswordHash,
    },
    create: {
      email: "projectadmin@dbs.gov.bn",
      name: "Project Admin",
      passwordHash: projectAdminPasswordHash,
      role: Role.PROJECT_ADMIN,
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
      contractorName: "GreenField Maintenance Sdn Bhd",
      tendering: {
        tenderNo: "QBM/46/2026",
        openDate: new Date("2026-04-27"),
        closingDate: new Date("2026-05-11"),
        receivedDate: new Date("2026-05-10"),
        assessmentSubmittedDate: new Date("2026-05-18"),
        recommendationDate: new Date("2026-05-20"),
        awardedDate: new Date("2026-05-25"),
        approvedDate: new Date("2026-05-25"),
        loaDate: new Date("2026-05-25"),
        startDateInLoa: new Date("2026-05-31"),
        completeDateInLoa: new Date("2026-08-22"),
      },
      contract: {
        mainContractor: "GreenField Maintenance Sdn Bhd",
        contractNo: "QBM/46/2026",
        contractSum: 36000,
        contractPeriod: "12 Weeks",
        loaIssued: new Date("2026-05-25"),
        sitePossessionDate: new Date("2026-05-31"),
        contractStart: new Date("2026-05-31"),
        contractFinish: new Date("2026-08-22"),
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
      contractorName: "BuildRight Contractors Sdn Bhd",
      tendering: {
        tenderNo: "TND/MOE/2025-001",
        loaDate: new Date("2025-03-15"),
        approvedDate: new Date("2025-03-10"),
      },
      contract: {
        mainContractor: "BuildRight Contractors Sdn Bhd",
        contractNo: "CTR/DBS-2025-001",
        contractSum: 420000,
        revisedContractSum: 435000,
        contractPeriod: "18 months",
        loaIssued: new Date("2025-03-15"),
        sitePossessionDate: new Date("2025-04-01"),
        contractStart: new Date("2025-04-15"),
        contractFinish: new Date("2026-10-15"),
        revisedContractFinish: new Date("2026-12-15"),
      },
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
        extendedClosingDate: new Date("2026-03-15"),
        receivedDate: new Date("2026-03-05"),
        assessmentSubmittedDate: new Date("2026-03-22"),
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
      tendering: {
        tenderNo: "TND/MOE/2025-003",
        openDate: new Date("2025-08-01"),
        closingDate: new Date("2025-09-15"),
        receivedDate: new Date("2025-09-10"),
        assessmentSubmittedDate: new Date("2025-10-05"),
        approvedDate: new Date("2025-11-20"),
        loaDate: new Date("2025-12-01"),
        awardedDate: new Date("2025-11-20"),
      },
    },
    {
      projectNumber: "DBS-2026-TND-001",
      title: "Roof Replacement Quotation - Lambak Kanan School",
      lifecycleStage: "pre_contract" as const,
      unitCode: "BM4",
      clientId: clientMoe.id,
      fundingTypeId: fundingDts.id,
      toMonitor: false,
      allocation: 195000,
      physicalActual: 0,
      physicalScheduled: 5,
      paymentActual: 0,
      paymentScheduled: 0,
      remarks: "Quotation evaluation in progress.",
      actionsRequired: "",
      quotationOrContractNo: "QTN/BM4/2026-001",
      projectType: "quotations" as const,
      tendering: {
        tenderNo: "QTN/BM4/2026-001",
        openDate: new Date("2026-02-01"),
        closingDate: new Date("2026-02-28"),
        receivedDate: new Date("2026-02-25"),
        assessmentSubmittedDate: new Date("2026-03-10"),
        approvedDate: new Date("2026-03-25"),
      },
    },
    {
      projectNumber: "DBS-2026-TND-002",
      title: "Civil Works Tender - Telisai Community Hall",
      lifecycleStage: "pre_contract" as const,
      unitCode: "BM6",
      clientId: clientMod.id,
      fundingTypeId: fundingDts.id,
      toMonitor: true,
      allocation: 520000,
      physicalActual: 0,
      physicalScheduled: 0,
      paymentActual: 0,
      paymentScheduled: 0,
      remarks: "Tender closing extended.",
      actionsRequired: "Confirm extended closing with JPPE.",
      tendering: {
        tenderNo: "TND/MOD/2026-002",
        openDate: new Date("2026-01-20"),
        closingDate: new Date("2026-03-01"),
        extendedClosingDate: new Date("2026-03-31"),
        receivedDate: new Date("2026-03-28"),
      },
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
      contractorName: "RoadWorks Contractors Sdn Bhd",
      tendering: {
        tenderNo: "TND/MOE/2024-089",
        loaDate: new Date("2024-06-01"),
        approvedDate: new Date("2024-05-20"),
      },
      contract: {
        mainContractor: "RoadWorks Contractors Sdn Bhd",
        contractNo: "CTR/DBS-2024-089",
        contractSum: 90000,
        revisedContractSum: 91500,
        finalAccountSum: 93200,
        contractPeriod: "10 months",
        cpcDate: new Date("2025-08-15"),
        edlp: new Date("2025-11-30"),
      },
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
      contractorName: "MediBuild Engineering Sdn Bhd",
      tendering: {
        tenderNo: "TND/MOH/2025-004",
        loaDate: new Date("2025-06-20"),
        approvedDate: new Date("2025-06-10"),
      },
      contract: {
        mainContractor: "MediBuild Engineering Sdn Bhd",
        contractNo: "CTR/DBS-2025-004",
        contractSum: 295000,
        contractPeriod: "14 months",
        loaIssued: new Date("2025-06-20"),
        sitePossessionDate: new Date("2025-07-01"),
        contractStart: new Date("2025-07-15"),
        contractFinish: new Date("2026-09-15"),
        cncDate: new Date("2026-01-20"),
      },
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
      design: {
        vote: "GOBRN",
        estimate: 180000,
        dateConfirmed: new Date("2026-01-15"),
        quotationTenderDueDate: new Date("2026-06-30"),
        actualQuotationTenderDate: new Date("2026-05-20"),
        archProgress: 65,
        qsProgress: 50,
      },
    },
    {
      projectNumber: "DBS-2026-DES-001",
      title: "Library Extension Design - Rimba Secondary",
      lifecycleStage: "pre_contract" as const,
      unitCode: "BM5",
      clientId: clientMoe.id,
      fundingTypeId: fundingDts.id,
      toMonitor: false,
      allocation: 240000,
      physicalActual: 10,
      physicalScheduled: 15,
      paymentActual: 5,
      paymentScheduled: 10,
      remarks: "Design drawings under QS review.",
      actionsRequired: "",
      design: {
        vote: "OCAR",
        designProjectNo: "DES/BM5/2026-001",
        estimate: 240000,
        dateConfirmed: new Date("2026-02-01"),
        quotationTenderDueDate: new Date("2026-07-15"),
        archProgress: 90,
        qsProgress: 70,
      },
    },
    {
      projectNumber: "DBS-2026-DES-002",
      title: "Office Renovation Design - Bandar Seri Begawan",
      lifecycleStage: "pre_contract" as const,
      unitCode: "BM9",
      clientId: clientMod.id,
      fundingTypeId: fundingDts.id,
      toMonitor: true,
      allocation: 155000,
      physicalActual: 5,
      physicalScheduled: 10,
      paymentActual: 0,
      paymentScheduled: 5,
      remarks: "Awaiting client confirmation on layout.",
      actionsRequired: "Follow up on vote allocation.",
      design: {
        vote: "OCAR",
        estimate: 155000,
        dateConfirmed: new Date("2025-12-10"),
        quotationTenderDueDate: new Date("2026-04-30"),
        actualQuotationTenderDate: new Date("2026-03-28"),
        archProgress: 100,
        qsProgress: 85,
      },
    },
    {
      projectNumber: "DBS-2026-DES-003",
      title: "Carpark Structure Design - Jerudong Park",
      lifecycleStage: "pre_contract" as const,
      unitCode: "BM10",
      clientId: clientMoe.id,
      fundingTypeId: fundingGov.id,
      toMonitor: false,
      allocation: 310000,
      physicalActual: 0,
      physicalScheduled: 5,
      paymentActual: 0,
      paymentScheduled: 0,
      remarks: "Structural design in progress.",
      actionsRequired: "",
      design: {
        vote: "GOBRN",
        designProjectNo: "DES/BM10/2026-003",
        estimate: 310000,
        quotationTenderDueDate: new Date("2026-08-31"),
        archProgress: 55,
        steProgress: 40,
      },
    },
    {
      projectNumber: "DBS-2026-BCA-001",
      title: "New Classroom Block - Berakas Primary",
      lifecycleStage: "planning" as const,
      unitCode: "BM1",
      clientId: clientMoe.id,
      fundingTypeId: fundingDts.id,
      toMonitor: false,
      allocation: 850000,
      physicalActual: 0,
      physicalScheduled: 0,
      paymentActual: 0,
      paymentScheduled: 0,
      remarks: "BCA submission in progress.",
      actionsRequired: "Prepare cost estimate for client review.",
      design: {
        vote: "OCAR",
        designProjectNo: "DES/BM1/2026-001",
        estimate: 850000,
      },
      bca: {
        dateAssigned: new Date("2026-01-10"),
        dateDue: new Date("2026-04-30"),
        estimate: 850000,
        letterDate: new Date("2026-01-15"),
      },
    },
    {
      projectNumber: "DBS-2026-BCA-002",
      title: "Health Clinic Structural Assessment - Kuala Belait",
      lifecycleStage: "planning" as const,
      unitCode: "BM2",
      clientId: clientMoh.id,
      fundingTypeId: fundingDts.id,
      toMonitor: true,
      allocation: 125000,
      physicalActual: 0,
      physicalScheduled: 0,
      paymentActual: 0,
      paymentScheduled: 0,
      remarks: "Awaiting site survey report.",
      actionsRequired: "",
      design: {
        vote: "OCAR",
        designProjectNo: "DES/BM2/2026-002",
        estimate: 125000,
      },
      bca: {
        dateAssigned: new Date("2026-02-03"),
        dateDue: new Date("2026-05-15"),
        estimate: 125000,
        letterDate: new Date("2026-02-07"),
      },
    },
    {
      projectNumber: "DBS-2026-BCA-003",
      title: "Staff Quarters Feasibility - Tutong District",
      lifecycleStage: "planning" as const,
      unitCode: "BM7",
      clientId: clientMod.id,
      fundingTypeId: fundingGov.id,
      toMonitor: false,
      allocation: 420000,
      physicalActual: 0,
      physicalScheduled: 0,
      paymentActual: 0,
      paymentScheduled: 0,
      remarks: "BCA completed; pending client endorsement.",
      actionsRequired: "",
      design: {
        vote: "GOBRN",
        designProjectNo: "DES/BM7/2026-003",
        estimate: 420000,
      },
      bca: {
        dateAssigned: new Date("2025-11-01"),
        dateDue: new Date("2026-01-31"),
        dateCompleted: new Date("2026-01-28"),
        estimate: 420000,
        letterDate: new Date("2025-11-05"),
      },
    },
    {
      projectNumber: "DBS-2026-BCA-004",
      title: "Bridge Load Capacity Study - Temburong",
      lifecycleStage: "planning" as const,
      unitCode: "IMU1",
      clientId: clientMod.id,
      fundingTypeId: fundingDts.id,
      toMonitor: false,
      allocation: 95000,
      physicalActual: 0,
      physicalScheduled: 0,
      paymentActual: 0,
      paymentScheduled: 0,
      remarks: "Assigned to structural unit.",
      actionsRequired: "Confirm survey access dates with client.",
      design: {
        vote: "OCAR",
        designProjectNo: "DES/IMU1/2026-004",
        govtEstimate: 95000,
        estimate: 95000,
      },
      bca: {
        dateAssigned: new Date("2026-03-01"),
        dateDue: new Date("2026-06-30"),
        estimate: 95000,
        letterDate: new Date("2026-03-04"),
      },
    },
    {
      projectNumber: "DBS-2026-FEA-001",
      title: "Sports Hall Feasibility Study - Seria",
      lifecycleStage: "planning" as const,
      unitCode: "BM3",
      clientId: clientMoe.id,
      fundingTypeId: fundingDts.id,
      toMonitor: false,
      allocation: 650000,
      physicalActual: 0,
      physicalScheduled: 0,
      paymentActual: 0,
      paymentScheduled: 0,
      remarks: "Initial client request received.",
      actionsRequired: "Schedule site inspection with school authority.",
      feasibility: {
        requestDate: new Date("2026-01-20"),
        siteInspection: new Date("2026-02-05"),
        estimate: 650000,
        proposedPeriod: "8 months",
        estimateSubmitted: new Date("2026-02-28"),
      },
    },
    {
      projectNumber: "DBS-2026-FEA-002",
      title: "Rural Clinic Access Road Feasibility",
      lifecycleStage: "planning" as const,
      unitCode: "BM4",
      clientId: clientMoh.id,
      fundingTypeId: fundingDts.id,
      toMonitor: true,
      allocation: 180000,
      physicalActual: 0,
      physicalScheduled: 0,
      paymentActual: 0,
      paymentScheduled: 0,
      remarks: "Awaiting topographical survey.",
      actionsRequired: "",
      feasibility: {
        requestDate: new Date("2026-02-10"),
        siteInspection: new Date("2026-02-25"),
        estimate: 180000,
        proposedPeriod: "6 months",
      },
    },
    {
      projectNumber: "DBS-2026-FEA-003",
      title: "Warehouse Conversion Feasibility - Muara",
      lifecycleStage: "planning" as const,
      unitCode: "BM6",
      clientId: clientMod.id,
      fundingTypeId: fundingGov.id,
      toMonitor: false,
      allocation: 320000,
      physicalActual: 0,
      physicalScheduled: 0,
      paymentActual: 0,
      paymentScheduled: 0,
      remarks: "Client confirmed feasibility estimate.",
      actionsRequired: "",
      feasibility: {
        requestDate: new Date("2025-10-15"),
        siteInspection: new Date("2025-11-02"),
        estimate: 320000,
        proposedPeriod: "10 months",
        estimateSubmitted: new Date("2025-12-10"),
        dateClientConfirm: new Date("2026-01-08"),
      },
    },
    {
      projectNumber: "DBS-2026-FEA-004",
      title: "Drainage Improvement Feasibility - Sengkurong",
      lifecycleStage: "planning" as const,
      unitCode: "BM8",
      clientId: clientMoe.id,
      fundingTypeId: fundingDts.id,
      toMonitor: false,
      allocation: 95000,
      physicalActual: 0,
      physicalScheduled: 0,
      paymentActual: 0,
      paymentScheduled: 0,
      remarks: "Estimate preparation in progress.",
      actionsRequired: "Confirm hydrology data from client.",
      feasibility: {
        requestDate: new Date("2026-03-05"),
        siteInspection: new Date("2026-03-18"),
        estimate: 95000,
        proposedPeriod: "4 months",
        estimateSubmitted: new Date("2026-04-01"),
      },
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
      bca,
      feasibility,
      contract,
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
      const contractData = {
        mainContractor: "ABC Construction Sdn Bhd",
        contractNo: `CTR-${projectData.projectNumber}`,
        contractSum: allocation * 0.9,
        contractPeriod: "12 Weeks",
        contractStart: new Date("2025-05-01"),
        contractFinish: new Date("2026-02-28"),
        revisedContractFinish: new Date("2026-05-28"),
        ...contract,
      };
      await prisma.contractDetails.upsert({
        where: { projectId: project.id },
        update: contractData,
        create: {
          projectId: project.id,
          ...contractData,
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
            poId: `PO-${projectData.projectNumber}-01`,
            claimDate: new Date("2025-07-01"),
            claimCertified: allocation * 0.06,
            poAmount: allocation * 0.06,
            sesDate: new Date("2025-07-15"),
            invoiceDate: new Date("2025-08-01"),
            eDispatchedDate: new Date("2025-08-20"),
            eDispatchRef: `ED-${projectData.projectNumber}-01`,
            paidDate: new Date("2025-09-05"),
          },
          {
            projectId: project.id,
            poId: `PO-${projectData.projectNumber}-02`,
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

    if (bca) {
      await prisma.projectBca.upsert({
        where: { projectId: project.id },
        update: bca,
        create: { projectId: project.id, ...bca },
      });
    }

    if (feasibility) {
      await prisma.projectFeasibility.upsert({
        where: { projectId: project.id },
        update: feasibility,
        create: { projectId: project.id, ...feasibility },
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
  console.log("  Project Admin:", projectAdmin.email, "(password: ProjectAdmin2026!)");
  for (let i = 0; i < UNIT_CODES.length; i++) {
    console.log(`  Officer ${i + 1} (${UNIT_CODES[i]}):`, `officer${i + 1}@dbs.gov.bn`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
