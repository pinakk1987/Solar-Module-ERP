import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const day = (value: string) => new Date(`${value}T00:00:00.000+05:30`);

async function main() {
  const company = await prisma.company.upsert({
    where: { id: "seed-company-solaros" },
    update: {},
    create: {
      id: "seed-company-solaros",
      name: "SolarOS",
      legalName: "SolarOS Modules Private Limited",
      gstin: "24ABCDE1234F1Z5",
      pan: "ABCDE1234F",
      address: "Plot 42, Solar Industrial Park, Gujarat"
    }
  });

  const adminEmployee = await prisma.employee.upsert({
    where: { empNo: "EMP-000" },
    update: {},
    create: {
      empNo: "EMP-000",
      fullName: "Amit Kumar",
      department: "IT",
      role: "ERP Administrator",
      shift: "General",
      email: "admin@solaros.in",
      phone: "+91-9000000000",
      status: "PRESENT"
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@solaros.in" },
    update: {
      passwordHash: await bcrypt.hash("password123", 10),
      active: true
    },
    create: {
      companyId: company.id,
      employeeId: adminEmployee.id,
      email: "admin@solaros.in",
      passwordHash: await bcrypt.hash("password123", 10),
      name: "Amit Kumar",
      role: "ADMIN",
      active: true
    }
  });

  const items = {
    cells: await prisma.item.upsert({
      where: { code: "RM-001" },
      update: {},
      create: {
        code: "RM-001",
        description: "Solar Cells 182mm Monocrystalline",
        category: "RAW_MATERIAL",
        uom: "PCS",
        hsnCode: "85414020",
        gstRate: 5,
        reorderLevel: 20000
      }
    }),
    glass: await prisma.item.upsert({
      where: { code: "RM-002" },
      update: {},
      create: {
        code: "RM-002",
        description: "Toughened Glass 3.2mm",
        category: "RAW_MATERIAL",
        uom: "PCS",
        hsnCode: "70071900",
        gstRate: 18,
        reorderLevel: 1000
      }
    }),
    eva: await prisma.item.upsert({
      where: { code: "RM-003" },
      update: {},
      create: {
        code: "RM-003",
        description: "EVA Film Standard Grade",
        category: "RAW_MATERIAL",
        uom: "ROLLS",
        hsnCode: "39201090",
        gstRate: 18,
        reorderLevel: 500
      }
    }),
    ribbon: await prisma.item.upsert({
      where: { code: "RM-005" },
      update: {},
      create: {
        code: "RM-005",
        description: "Ribbon Wire",
        category: "RAW_MATERIAL",
        uom: "KG",
        hsnCode: "74081990",
        gstRate: 18,
        reorderLevel: 250
      }
    }),
    module600: await prisma.item.upsert({
      where: { code: "FG-001" },
      update: {},
      create: {
        code: "FG-001",
        description: "Solar Module 600W Mono PERC",
        category: "FINISHED_GOOD",
        uom: "PCS",
        hsnCode: "85414020",
        gstRate: 5
      }
    }),
    module595: await prisma.item.upsert({
      where: { code: "FG-002" },
      update: {},
      create: {
        code: "FG-002",
        description: "Solar Module 595W Mono",
        category: "FINISHED_GOOD",
        uom: "PCS",
        hsnCode: "85414020",
        gstRate: 5
      }
    }),
    module580: await prisma.item.upsert({
      where: { code: "FG-003" },
      update: {},
      create: {
        code: "FG-003",
        description: "Solar Module 580W Bifacial",
        category: "FINISHED_GOOD",
        uom: "PCS",
        hsnCode: "85414020",
        gstRate: 5
      }
    })
  };

  const vendors = {
    solarTech: await prisma.vendor.upsert({
      where: { code: "VND-001" },
      update: {},
      create: {
        code: "VND-001",
        name: "SolarTech Cells Pvt Ltd",
        category: "Solar Cells",
        city: "Bangalore",
        status: "APPROVED",
        onTimeDelivery: 88,
        rating: 4
      }
    }),
    glassCraft: await prisma.vendor.upsert({
      where: { code: "VND-002" },
      update: {},
      create: {
        code: "VND-002",
        name: "GlassCraft Industries",
        category: "Glass",
        city: "Surat",
        status: "APPROVED",
        onTimeDelivery: 96,
        rating: 5
      }
    }),
    evaIndustries: await prisma.vendor.upsert({
      where: { code: "VND-003" },
      update: {},
      create: {
        code: "VND-003",
        name: "EVA Industries",
        category: "EVA Film",
        city: "Vadodara",
        status: "APPROVED",
        onTimeDelivery: 82,
        rating: 3
      }
    }),
    ribbonTech: await prisma.vendor.upsert({
      where: { code: "VND-004" },
      update: {},
      create: {
        code: "VND-004",
        name: "RibbonTech Materials",
        category: "Ribbon Wire",
        city: "Pune",
        status: "UNDER_REVIEW",
        onTimeDelivery: 74,
        rating: 3
      }
    })
  };

  const customers = {
    greenEnergy: await prisma.customer.upsert({
      where: { code: "CUS-001" },
      update: {},
      create: {
        code: "CUS-001",
        name: "Green Energy Ltd",
        city: "Ahmedabad",
        creditLimit: 75000000
      }
    }),
    sunPower: await prisma.customer.upsert({
      where: { code: "CUS-002" },
      update: {},
      create: {
        code: "CUS-002",
        name: "SunPower Projects",
        city: "Jaipur",
        creditLimit: 50000000
      }
    }),
    rajasthan: await prisma.customer.upsert({
      where: { code: "CUS-003" },
      update: {},
      create: {
        code: "CUS-003",
        name: "Rajasthan Solar",
        city: "Jodhpur",
        creditLimit: 40000000
      }
    })
  };

  const rawWarehouse = await prisma.warehouse.upsert({
    where: { code: "WH-RM" },
    update: {},
    create: { code: "WH-RM", name: "Raw Material Store", location: "Plant A" }
  });
  const finishedWarehouse = await prisma.warehouse.upsert({
    where: { code: "WH-FG" },
    update: {},
    create: { code: "WH-FG", name: "Finished Goods Store", location: "Plant A" }
  });

  await prisma.stockBatch.upsert({
    where: {
      itemId_warehouseId_batchNo: {
        itemId: items.cells.id,
        warehouseId: rawWarehouse.id,
        batchNo: "B-892"
      }
    },
    update: { quantity: 10000, unitCost: 184 },
    create: {
      itemId: items.cells.id,
      warehouseId: rawWarehouse.id,
      batchNo: "B-892",
      quantity: 10000,
      unitCost: 184,
      receivedAt: day("2025-05-15")
    }
  });

  await prisma.stockBatch.upsert({
    where: {
      itemId_warehouseId_batchNo: {
        itemId: items.eva.id,
        warehouseId: rawWarehouse.id,
        batchNo: "EVA-LOW"
      }
    },
    update: { quantity: 180, unitCost: 9500 },
    create: {
      itemId: items.eva.id,
      warehouseId: rawWarehouse.id,
      batchNo: "EVA-LOW",
      quantity: 180,
      unitCost: 9500,
      receivedAt: day("2025-05-01")
    }
  });

  await prisma.stockBatch.upsert({
    where: {
      itemId_warehouseId_batchNo: {
        itemId: items.module600.id,
        warehouseId: finishedWarehouse.id,
        batchNo: "FG-600-MAY"
      }
    },
    update: { quantity: 3200, unitCost: 18500 },
    create: {
      itemId: items.module600.id,
      warehouseId: finishedWarehouse.id,
      batchNo: "FG-600-MAY",
      quantity: 3200,
      unitCost: 18500,
      receivedAt: day("2025-05-15")
    }
  });

  const po2487 = await prisma.purchaseOrder.upsert({
    where: { poNo: "PO-2487" },
    update: { status: "APPROVED", totalAmount: 1840000 },
    create: {
      poNo: "PO-2487",
      vendorId: vendors.solarTech.id,
      poDate: day("2025-05-10"),
      deliveryDate: day("2025-05-25"),
      status: "APPROVED",
      subtotal: 1840000,
      taxAmount: 92000,
      totalAmount: 1932000,
      aiRisk: "Clean",
      lines: {
        create: [
          {
            itemId: items.cells.id,
            quantity: 10000,
            receivedQty: 10000,
            unitPrice: 184,
            taxRate: 5,
            lineTotal: 1840000
          }
        ]
      }
    }
  });

  const po2488 = await prisma.purchaseOrder.upsert({
    where: { poNo: "PO-2488" },
    update: { status: "PENDING_APPROVAL", totalAmount: 620120 },
    create: {
      poNo: "PO-2488",
      vendorId: vendors.glassCraft.id,
      poDate: day("2025-05-11"),
      deliveryDate: day("2025-05-24"),
      status: "PENDING_APPROVAL",
      subtotal: 620120,
      taxAmount: 111622,
      totalAmount: 731742,
      aiRisk: "Variance watch",
      lines: {
        create: [
          {
            itemId: items.glass.id,
            quantity: 500,
            unitPrice: 1240.24,
            taxRate: 18,
            lineTotal: 620120
          }
        ]
      }
    }
  });

  await prisma.purchaseRequisition.upsert({
    where: { prNo: "PR-881" },
    update: { status: "PENDING_APPROVAL" },
    create: {
      prNo: "PR-881",
      requestedBy: "System",
      requiredBy: day("2025-05-20"),
      source: "System (MRP)",
      status: "PENDING_APPROVAL",
      lines: {
        create: [{ itemId: items.eva.id, quantity: 400, requiredBy: day("2025-05-20") }]
      }
    }
  });

  await prisma.rfq.upsert({
    where: { rfqNo: "RFQ-1021" },
    update: { status: "OPEN" },
    create: {
      rfqNo: "RFQ-1021",
      vendorId: vendors.evaIndustries.id,
      vendorName: vendors.evaIndustries.name,
      dueAt: day("2025-05-18"),
      status: "OPEN",
      lines: {
        create: [{ itemId: items.eva.id, quantity: 400, targetRate: 9400 }]
      }
    }
  });

  const grn1193 = await prisma.goodsReceipt.upsert({
    where: { grnNo: "GRN-1193" },
    update: { status: "PENDING_IQC" },
    create: {
      grnNo: "GRN-1193",
      purchaseOrderId: po2487.id,
      vendorId: vendors.solarTech.id,
      receivedAt: day("2025-05-15"),
      status: "PENDING_IQC",
      lrNo: "LR-1193",
      lines: {
        create: [
          {
            itemId: items.cells.id,
            batchNo: "B-892",
            quantity: 10000,
            acceptedQty: 0,
            rejectedQty: 0
          }
        ]
      }
    }
  });

  const grn1192 = await prisma.goodsReceipt.upsert({
    where: { grnNo: "GRN-1192" },
    update: { status: "PASSED" },
    create: {
      grnNo: "GRN-1192",
      purchaseOrderId: po2488.id,
      vendorId: vendors.glassCraft.id,
      receivedAt: day("2025-05-14"),
      status: "PASSED",
      lines: {
        create: [{ itemId: items.glass.id, batchNo: "G-412", quantity: 500, acceptedQty: 500 }]
      }
    }
  });

  const grn1190 = await prisma.goodsReceipt.upsert({
    where: { grnNo: "GRN-1190" },
    update: { status: "FAILED" },
    create: {
      grnNo: "GRN-1190",
      purchaseOrderId: po2487.id,
      vendorId: vendors.solarTech.id,
      receivedAt: day("2025-05-12"),
      status: "FAILED",
      lines: {
        create: [{ itemId: items.cells.id, batchNo: "B-881", quantity: 5000, rejectedQty: 5000 }]
      }
    }
  });

  const iqc441 = await prisma.iqcInspection.upsert({
    where: { iqcNo: "IQC-441" },
    update: { result: "PENDING" },
    create: {
      iqcNo: "IQC-441",
      goodsReceiptId: grn1193.id,
      itemId: items.cells.id,
      vendorId: vendors.solarTech.id,
      inspector: "Ramesh K.",
      quantity: 10000,
      result: "PENDING"
    }
  });

  await prisma.iqcInspection.upsert({
    where: { iqcNo: "IQC-440" },
    update: { result: "PASS" },
    create: {
      iqcNo: "IQC-440",
      goodsReceiptId: grn1192.id,
      itemId: items.glass.id,
      vendorId: vendors.glassCraft.id,
      inspector: "Priya Sharma",
      quantity: 500,
      result: "PASS",
      inspectedAt: day("2025-05-14")
    }
  });

  const iqc438 = await prisma.iqcInspection.upsert({
    where: { iqcNo: "IQC-438" },
    update: { result: "FAIL" },
    create: {
      iqcNo: "IQC-438",
      goodsReceiptId: grn1190.id,
      itemId: items.cells.id,
      vendorId: vendors.solarTech.id,
      inspector: "Priya Sharma",
      quantity: 5000,
      result: "FAIL",
      remarks: "Micro-cracks detected in sample cells.",
      inspectedAt: day("2025-05-12")
    }
  });

  await prisma.ncr.upsert({
    where: { ncrNo: "NCR-217" },
    update: { status: "OPEN" },
    create: {
      ncrNo: "NCR-217",
      iqcInspectionId: iqc438.id,
      severity: "HIGH",
      description: "Solar cell batch B-881 failed incoming quality inspection.",
      disposition: "Vendor replacement requested",
      status: "OPEN"
    }
  });

  await prisma.fqcInspection.upsert({
    where: { fqcNo: "FQC-881" },
    update: {},
    create: {
      fqcNo: "FQC-881",
      itemId: items.module600.id,
      serialNo: "SM600-0001",
      productionOrderNo: "PRD-4421",
      flashPowerWatts: 603.2,
      result: "PASS",
      inspectedAt: day("2025-05-15")
    }
  });

  const prd4421 = await prisma.productionOrder.upsert({
    where: { orderNo: "PRD-4421" },
    update: { status: "IN_PROGRESS", producedQty: 1840 },
    create: {
      orderNo: "PRD-4421",
      itemId: items.module600.id,
      plannedQty: 2000,
      producedQty: 1840,
      lineName: "Line 1",
      plannedDate: day("2025-05-15"),
      status: "IN_PROGRESS"
    }
  });

  await prisma.productionOrder.upsert({
    where: { orderNo: "PRD-4422" },
    update: { status: "IN_PROGRESS", producedQty: 980 },
    create: {
      orderNo: "PRD-4422",
      itemId: items.module595.id,
      plannedQty: 1500,
      producedQty: 980,
      lineName: "Line 2",
      plannedDate: day("2025-05-15"),
      status: "IN_PROGRESS"
    }
  });

  await prisma.productionOrder.upsert({
    where: { orderNo: "PRD-4418" },
    update: { status: "ON_HOLD" },
    create: {
      orderNo: "PRD-4418",
      itemId: items.module600.id,
      plannedQty: 1200,
      producedQty: 0,
      lineName: "Line 3",
      plannedDate: day("2025-05-15"),
      status: "ON_HOLD"
    }
  });

  await prisma.productionOrder.upsert({
    where: { orderNo: "PRD-4415" },
    update: { status: "COMPLETED", producedQty: 800 },
    create: {
      orderNo: "PRD-4415",
      itemId: items.module580.id,
      plannedQty: 800,
      producedQty: 800,
      lineName: "Line 4",
      plannedDate: day("2025-05-14"),
      status: "COMPLETED"
    }
  });

  await prisma.workOrder.upsert({
    where: { workOrderNo: "WO-9001" },
    update: { status: "IN_PROGRESS" },
    create: {
      workOrderNo: "WO-9001",
      productionOrderId: prd4421.id,
      station: "Stringer",
      status: "IN_PROGRESS",
      assignedTo: "Ankit Mehta",
      startedAt: day("2025-05-15")
    }
  });

  await prisma.oeeLog.upsert({
    where: { id: "seed-oee-line-3-2025-05-15" },
    update: {
      oee: 61,
      downtimeMinutes: 126
    },
    create: {
      id: "seed-oee-line-3-2025-05-15",
      productionOrderId: prd4421.id,
      lineName: "Line 3",
      logDate: day("2025-05-15"),
      availability: 68,
      performance: 71,
      quality: 90,
      oee: 61,
      downtimeMinutes: 126,
      notes: "Laminator temperature instability"
    }
  });

  const so3312 = await prisma.salesOrder.upsert({
    where: { soNo: "SO-3312" },
    update: { status: "OPEN", totalAmount: 50000000 },
    create: {
      soNo: "SO-3312",
      customerId: customers.greenEnergy.id,
      orderDate: day("2025-05-12"),
      deliveryDate: day("2025-05-20"),
      status: "OPEN",
      totalAmount: 50000000,
      lines: {
        create: [{ itemId: items.module600.id, quantity: 2000, dispatchedQty: 1000, unitPrice: 25000, lineTotal: 50000000 }]
      }
    }
  });

  const so3305 = await prisma.salesOrder.upsert({
    where: { soNo: "SO-3305" },
    update: { status: "OVERDUE", totalAmount: 20000000 },
    create: {
      soNo: "SO-3305",
      customerId: customers.rajasthan.id,
      orderDate: day("2025-05-01"),
      deliveryDate: day("2025-05-10"),
      status: "OVERDUE",
      totalAmount: 20000000,
      lines: {
        create: [{ itemId: items.module600.id, quantity: 800, unitPrice: 25000, lineTotal: 20000000 }]
      }
    }
  });

  await prisma.dispatch.upsert({
    where: { dispatchNo: "DSP-881" },
    update: { status: "OPEN" },
    create: {
      dispatchNo: "DSP-881",
      salesOrderId: so3312.id,
      customerName: customers.greenEnergy.name,
      quantity: 1000,
      transporter: "Blue Dart Cargo",
      lrNo: "BD-44821",
      status: "OPEN",
      dispatchedAt: day("2025-05-15")
    }
  });

  await prisma.dispatch.upsert({
    where: { dispatchNo: "DSP-876" },
    update: { status: "COMPLETED" },
    create: {
      dispatchNo: "DSP-876",
      salesOrderId: so3305.id,
      customerName: customers.rajasthan.name,
      quantity: 800,
      transporter: "TCI Express",
      lrNo: "TCI-88221",
      status: "COMPLETED",
      dispatchedAt: day("2025-05-10"),
      deliveredAt: day("2025-05-12")
    }
  });

  await prisma.vendorInvoice.upsert({
    where: { vendorId_invoiceNo: { vendorId: vendors.solarTech.id, invoiceNo: "VINV-2210" } },
    update: { matchStatus: "MATCHED", paymentStatus: "PENDING" },
    create: {
      invoiceNo: "VINV-2210",
      vendorId: vendors.solarTech.id,
      purchaseOrderId: po2487.id,
      goodsReceiptId: grn1193.id,
      invoiceDate: day("2025-05-15"),
      amount: 1840000,
      varianceAmount: 0,
      matchStatus: "MATCHED",
      paymentStatus: "PENDING"
    }
  });

  await prisma.vendorInvoice.upsert({
    where: { vendorId_invoiceNo: { vendorId: vendors.glassCraft.id, invoiceNo: "VINV-2209" } },
    update: { matchStatus: "VARIANCE", paymentStatus: "PENDING" },
    create: {
      invoiceNo: "VINV-2209",
      vendorId: vendors.glassCraft.id,
      purchaseOrderId: po2488.id,
      invoiceDate: day("2025-05-14"),
      amount: 620120,
      varianceAmount: 1200,
      matchStatus: "VARIANCE",
      paymentStatus: "PENDING"
    }
  });

  const arInv = await prisma.arInvoice.upsert({
    where: { invoiceNo: "INV-8821" },
    update: { status: "PENDING" },
    create: {
      invoiceNo: "INV-8821",
      customerId: customers.greenEnergy.id,
      salesOrderId: so3312.id,
      invoiceDate: day("2025-05-14"),
      amount: 12500000,
      status: "PENDING"
    }
  });

  await prisma.arPayment.upsert({
    where: { receiptNo: "RCT-5512" },
    update: { status: "PAID" },
    create: {
      receiptNo: "RCT-5512",
      customerId: customers.greenEnergy.id,
      arInvoiceId: arInv.id,
      receiptDate: day("2025-05-15"),
      amount: 5000000,
      mode: "NEFT",
      bankReference: "UTR5512",
      status: "PAID"
    }
  });

  const accounts = {
    cash: await prisma.account.upsert({
      where: { code: "1001" },
      update: {},
      create: { code: "1001", name: "Cash in Hand", type: "ASSET", openingDr: 1240000 }
    }),
    bank: await prisma.account.upsert({
      where: { code: "1002" },
      update: {},
      create: { code: "1002", name: "Bank - HDFC", type: "ASSET", openingDr: 10760000 }
    }),
    ar: await prisma.account.upsert({
      where: { code: "1100" },
      update: {},
      create: { code: "1100", name: "Accounts Receivable", type: "ASSET", openingDr: 38000000 }
    }),
    ap: await prisma.account.upsert({
      where: { code: "3001" },
      update: {},
      create: { code: "3001", name: "Accounts Payable", type: "LIABILITY", openingCr: 24000000 }
    }),
    revenue: await prisma.account.upsert({
      where: { code: "4001" },
      update: {},
      create: { code: "4001", name: "Revenue - Module Sales", type: "INCOME", openingCr: 68000000 }
    }),
    rawCost: await prisma.account.upsert({
      where: { code: "5001" },
      update: {},
      create: { code: "5001", name: "Raw Material Cost", type: "EXPENSE", openingDr: 38000000 }
    })
  };

  await prisma.journalEntry.upsert({
    where: { jeNo: "JE-4421" },
    update: { status: "POSTED" },
    create: {
      jeNo: "JE-4421",
      entryDate: day("2025-05-15"),
      entryType: "Purchase",
      description: "GRN Receipt B-892",
      amount: 1840000,
      status: "POSTED",
      postedBy: "System",
      postedAt: day("2025-05-15"),
      lines: {
        create: [
          { accountId: accounts.rawCost.id, debit: 1840000, credit: 0, memo: "Inventory receipt" },
          { accountId: accounts.ap.id, debit: 0, credit: 1840000, memo: "GR/IR clearing" }
        ]
      }
    }
  });

  await prisma.journalEntry.upsert({
    where: { jeNo: "JE-4419" },
    update: { status: "PENDING_APPROVAL" },
    create: {
      jeNo: "JE-4419",
      entryDate: day("2025-05-13"),
      entryType: "Manual",
      description: "Depreciation May 2025",
      amount: 850000,
      status: "PENDING_APPROVAL",
      postedBy: "Kavita Joshi",
      lines: {
        create: [
          { accountId: accounts.rawCost.id, debit: 850000, credit: 0, memo: "Depreciation expense" },
          { accountId: accounts.ap.id, debit: 0, credit: 850000, memo: "Accumulated depreciation" }
        ]
      }
    }
  });

  await prisma.bankReconciliation.upsert({
    where: { reconNo: "BR-2025-05" },
    update: {},
    create: {
      reconNo: "BR-2025-05",
      bankAccount: "Bank - HDFC",
      statementDate: day("2025-05-15"),
      bookBalance: 10760000,
      bankBalance: 10760000,
      varianceAmount: 0,
      status: "COMPLETED"
    }
  });

  await prisma.budget.upsert({
    where: { id: "seed-budget-production-2025-05" },
    update: {
      budgetAmount: 45000000,
      actualAmount: 38000000
    },
    create: {
      id: "seed-budget-production-2025-05",
      period: "2025-05",
      department: "Production",
      accountCode: "5001",
      budgetAmount: 45000000,
      actualAmount: 38000000
    }
  });

  await prisma.taxReport.upsert({
    where: { reportNo: "GSTR1-2025-05" },
    update: { status: "DRAFT" },
    create: {
      reportNo: "GSTR1-2025-05",
      period: "2025-05",
      reportType: "GSTR-1",
      status: "DRAFT",
      taxableValue: 68000000,
      taxAmount: 3400000
    }
  });

  const employees = [
    ["EMP-001", "Ramesh Patel", "Procurement", "Manager", "PRESENT"],
    ["EMP-002", "Priya Sharma", "Quality", "QC Engineer", "PRESENT"],
    ["EMP-003", "Ankit Mehta", "Production", "Line Supervisor", "PRESENT"],
    ["EMP-004", "Kavita Joshi", "Finance", "Accounts Executive", "ON_LEAVE"]
  ] as const;

  for (const [empNo, fullName, department, role, status] of employees) {
    const employee = await prisma.employee.upsert({
      where: { empNo },
      update: { status },
      create: {
        empNo,
        fullName,
        department,
        role,
        shift: "General",
        status
      }
    });

    await prisma.attendance.upsert({
      where: { employeeId_workDate: { employeeId: employee.id, workDate: day("2025-05-15") } },
      update: { status },
      create: {
        employeeId: employee.id,
        workDate: day("2025-05-15"),
        status
      }
    });
  }

  const kavita = await prisma.employee.findUniqueOrThrow({ where: { empNo: "EMP-004" } });
  await prisma.leaveRequest.upsert({
    where: { id: "seed-leave-emp-004-2025-05" },
    update: {
      status: "APPROVED"
    },
    create: {
      id: "seed-leave-emp-004-2025-05",
      employeeId: kavita.id,
      leaveType: "Annual Leave",
      fromDate: day("2025-05-14"),
      toDate: day("2025-05-16"),
      reason: "Personal work",
      status: "APPROVED"
    }
  });

  await prisma.payrollRun.upsert({
    where: { payrollNo: "PAY-2025-05" },
    update: { status: "POSTED", netAmount: 12400000 },
    create: {
      payrollNo: "PAY-2025-05",
      period: "2025-05",
      status: "POSTED",
      grossAmount: 13800000,
      netAmount: 12400000,
      lines: {
        create: {
          employeeId: adminEmployee.id,
          grossAmount: 250000,
          deductions: 25000,
          netAmount: 225000
        }
      }
    }
  });

  await prisma.recruitmentJob.upsert({
    where: { jobNo: "JOB-102" },
    update: { status: "OPEN" },
    create: {
      jobNo: "JOB-102",
      title: "QC Engineer",
      department: "Quality",
      experience: "3-5 years",
      priority: "HIGH",
      status: "OPEN"
    }
  });

  await prisma.bom.upsert({
    where: { bomNo: "BOM-FG-001" },
    update: { isActive: true },
    create: {
      bomNo: "BOM-FG-001",
      outputItemId: items.module600.id,
      version: "1",
      isActive: true,
      lines: {
        create: [
          { componentItemId: items.cells.id, quantity: 72, scrapPercent: 1 },
          { componentItemId: items.glass.id, quantity: 1, scrapPercent: 0.5 },
          { componentItemId: items.eva.id, quantity: 0.03, scrapPercent: 2 },
          { componentItemId: items.ribbon.id, quantity: 0.15, scrapPercent: 1.5 }
        ]
      }
    }
  });

  await prisma.supplierScorecard.upsert({
    where: { id: "seed-scorecard-vnd-001-2025-05" },
    update: {
      overallScore: 88
    },
    create: {
      id: "seed-scorecard-vnd-001-2025-05",
      vendorId: vendors.solarTech.id,
      period: "2025-05",
      qualityScore: 92,
      deliveryScore: 88,
      costScore: 84,
      overallScore: 88,
      notes: "Good quality with one failed batch under NCR."
    }
  });

  await prisma.setting.upsert({
    where: { companyId_key: { companyId: company.id, key: "company.profile" } },
    update: {
      value: JSON.stringify({
        name: company.name,
        timezone: "Asia/Kolkata",
        currency: "INR"
      })
    },
    create: {
      companyId: company.id,
      key: "company.profile",
      value: JSON.stringify({
        name: company.name,
        timezone: "Asia/Kolkata",
        currency: "INR"
      })
    }
  });

  await prisma.notification.upsert({
    where: { id: "seed-notification-backend-ready" },
    update: {
      readAt: null
    },
    create: {
      id: "seed-notification-backend-ready",
      userId: admin.id,
      title: "ERP backend seeded",
      message: "SolarOS ERP backend sample data is ready.",
      severity: "SUCCESS"
    }
  });

  await prisma.aiConversation.upsert({
    where: { id: "seed-ai-initial-insight" },
    update: {},
    create: {
      id: "seed-ai-initial-insight",
      userId: admin.id,
      title: "Initial ERP insight",
      messages: {
        create: [
          {
            role: "assistant",
            content:
              "Watch EVA Film stock, Line 3 OEE, pending IQC, and SO-3305 dispatch risk."
          }
        ]
      }
    }
  });

  console.log("Seed complete.");
  console.log("Login: admin@solaros.in / password123 / MFA 123456");
  console.log(`Pending IQC sample: ${iqc441.iqcNo}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
