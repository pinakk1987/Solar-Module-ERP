import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { ApiError } from "../middleware/error.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { aiRoutes } from "./ai/ai.routes.js";
import { createCrudRouter } from "./crud/crud.router.js";
import { dashboardRoutes } from "./dashboard/dashboard.routes.js";
import { reportsRoutes } from "./reports/reports.routes.js";

export const apiRoutes = Router();

const id = z.string().min(1);
const text = z.string().trim().min(1);
const optionalText = z.string().trim().optional().nullable();
const amount = z.coerce.number();
const optionalAmount = z.coerce.number().optional().nullable();
const date = z.coerce.date();
const optionalDate = z.coerce.date().optional().nullable();
const nestedLines = z.array(z.record(z.unknown())).optional();

const stripNestedLines = (data: Record<string, unknown>) => {
  const copy = { ...data };
  delete copy.lines;
  return copy;
};

const withNestedLines = (data: Record<string, unknown>) => {
  const { lines, ...rest } = data;
  if (!Array.isArray(lines)) return rest;
  return {
    ...rest,
    lines: {
      create: lines
    }
  };
};

const documentStatus = z.enum([
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "OPEN",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CLOSED",
  "CANCELLED",
  "PENDING_IQC",
  "PASSED",
  "FAILED",
  "IN_PROGRESS",
  "COMPLETED",
  "ON_HOLD",
  "POSTED",
  "PAID",
  "OVERDUE"
]);

const itemSchema = z
  .object({
    code: text,
    description: text,
    category: z.enum(["RAW_MATERIAL", "FINISHED_GOOD", "CONSUMABLE", "SERVICE"]),
    uom: z.enum(["PCS", "ROLLS", "KG", "METRES", "LITRES", "SETS"]),
    hsnCode: optionalText,
    gstRate: amount.default(0),
    reorderLevel: optionalAmount,
    isActive: z.boolean().optional()
  })
  .passthrough();

const vendorSchema = z
  .object({
    code: text,
    name: text,
    category: optionalText,
    city: optionalText,
    phone: optionalText,
    email: z.string().email().optional().nullable(),
    gstin: optionalText,
    status: z.enum(["APPROVED", "UNDER_REVIEW", "BLOCKED"]).optional(),
    onTimeDelivery: amount.optional(),
    rating: amount.optional()
  })
  .passthrough();

const customerSchema = z
  .object({
    code: text,
    name: text,
    city: optionalText,
    phone: optionalText,
    email: z.string().email().optional().nullable(),
    gstin: optionalText,
    creditLimit: amount.optional(),
    isActive: z.boolean().optional()
  })
  .passthrough();

const purchaseRequisitionSchema = z
  .object({
    prNo: text,
    requestedBy: optionalText,
    requiredBy: optionalDate,
    source: optionalText,
    status: documentStatus.optional(),
    lines: nestedLines
  })
  .passthrough();

const rfqSchema = z
  .object({
    rfqNo: text,
    purchaseRequisitionId: id.optional().nullable(),
    vendorId: id.optional().nullable(),
    vendorName: optionalText,
    dueAt: optionalDate,
    status: documentStatus.optional(),
    lines: nestedLines
  })
  .passthrough();

const purchaseOrderSchema = z
  .object({
    poNo: text,
    vendorId: id,
    poDate: date,
    deliveryDate: optionalDate,
    status: documentStatus.optional(),
    currency: z.string().default("INR"),
    subtotal: amount.optional(),
    taxAmount: amount.optional(),
    totalAmount: amount.optional(),
    aiRisk: optionalText,
    lines: nestedLines
  })
  .passthrough();

const goodsReceiptSchema = z
  .object({
    grnNo: text,
    purchaseOrderId: id,
    vendorId: id,
    receivedAt: date.optional(),
    status: documentStatus.optional(),
    vehicleNo: optionalText,
    lrNo: optionalText,
    lines: nestedLines
  })
  .passthrough();

const vendorInvoiceSchema = z
  .object({
    invoiceNo: text,
    vendorId: id,
    purchaseOrderId: id.optional().nullable(),
    goodsReceiptId: id.optional().nullable(),
    invoiceDate: date,
    amount,
    varianceAmount: amount.optional(),
    matchStatus: z.string().optional(),
    paymentStatus: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE"]).optional()
  })
  .passthrough();

const apPaymentSchema = z
  .object({
    paymentNo: text,
    vendorId: id,
    vendorInvoiceId: id.optional().nullable(),
    purchaseOrderId: id.optional().nullable(),
    paymentDate: date,
    amount,
    mode: text,
    bankReference: optionalText,
    status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE"]).optional()
  })
  .passthrough();

const stockBatchSchema = z
  .object({
    itemId: id,
    warehouseId: id,
    batchNo: text,
    quantity: amount,
    unitCost: amount.optional(),
    receivedAt: optionalDate,
    expiryAt: optionalDate,
    status: z.string().optional()
  })
  .passthrough();

const stockMovementSchema = z
  .object({
    itemId: id,
    stockBatchId: id.optional().nullable(),
    movementType: z.enum(["RECEIPT", "ISSUE", "TRANSFER", "ADJUSTMENT", "PRODUCTION_OUTPUT", "DISPATCH"]),
    quantity: amount,
    fromWarehouseId: id.optional().nullable(),
    toWarehouseId: id.optional().nullable(),
    referenceType: optionalText,
    referenceNo: optionalText,
    notes: optionalText,
    movedAt: date.optional()
  })
  .passthrough();

const warehouseTransferSchema = z
  .object({
    transferNo: text,
    fromWarehouseId: id,
    toWarehouseId: id,
    status: documentStatus.optional(),
    notes: optionalText
  })
  .passthrough();

const cycleCountSchema = z
  .object({
    countNo: text,
    warehouseId: id,
    countDate: date,
    status: documentStatus.optional(),
    countedBy: optionalText,
    lines: nestedLines
  })
  .passthrough();

const iqcSchema = z
  .object({
    iqcNo: text,
    goodsReceiptId: id,
    itemId: id,
    vendorId: id.optional().nullable(),
    inspector: optionalText,
    quantity: amount,
    result: z.enum(["PENDING", "PASS", "CONDITIONAL_PASS", "FAIL"]).optional(),
    remarks: optionalText,
    inspectedAt: optionalDate
  })
  .passthrough();

const fqcSchema = z
  .object({
    fqcNo: text,
    itemId: id,
    serialNo: optionalText,
    productionOrderNo: optionalText,
    flashPowerWatts: optionalAmount,
    result: z.enum(["PENDING", "PASS", "CONDITIONAL_PASS", "FAIL"]).optional(),
    remarks: optionalText,
    inspectedAt: optionalDate
  })
  .passthrough();

const ncrSchema = z
  .object({
    ncrNo: text,
    iqcInspectionId: id.optional().nullable(),
    severity: z.string().optional(),
    description: text,
    disposition: optionalText,
    status: documentStatus.optional()
  })
  .passthrough();

const bomSchema = z
  .object({
    bomNo: text,
    outputItemId: id,
    version: z.string().optional(),
    isActive: z.boolean().optional(),
    lines: nestedLines
  })
  .passthrough();

const productionOrderSchema = z
  .object({
    orderNo: text,
    itemId: id,
    plannedQty: amount,
    producedQty: amount.optional(),
    lineName: text,
    plannedDate: optionalDate,
    status: z.enum(["PLANNED", "RELEASED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional()
  })
  .passthrough();

const workOrderSchema = z
  .object({
    workOrderNo: text,
    productionOrderId: id,
    station: optionalText,
    status: z.enum(["PLANNED", "RELEASED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
    assignedTo: optionalText,
    startedAt: optionalDate,
    completedAt: optionalDate
  })
  .passthrough();

const oeeSchema = z
  .object({
    productionOrderId: id.optional().nullable(),
    lineName: text,
    logDate: date,
    availability: amount,
    performance: amount,
    quality: amount,
    oee: amount,
    downtimeMinutes: z.coerce.number().int().optional(),
    notes: optionalText
  })
  .passthrough();

const salesOrderSchema = z
  .object({
    soNo: text,
    customerId: id,
    orderDate: date,
    deliveryDate: optionalDate,
    status: documentStatus.optional(),
    totalAmount: amount.optional(),
    lines: nestedLines
  })
  .passthrough();

const dispatchSchema = z
  .object({
    dispatchNo: text,
    salesOrderId: id,
    customerName: text,
    quantity: amount,
    transporter: optionalText,
    lrNo: optionalText,
    status: documentStatus.optional(),
    dispatchedAt: optionalDate,
    deliveredAt: optionalDate
  })
  .passthrough();

const arInvoiceSchema = z
  .object({
    invoiceNo: text,
    customerId: id,
    salesOrderId: id.optional().nullable(),
    invoiceDate: date,
    amount,
    status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE"]).optional()
  })
  .passthrough();

const arPaymentSchema = z
  .object({
    receiptNo: text,
    customerId: id,
    arInvoiceId: id.optional().nullable(),
    receiptDate: date,
    amount,
    mode: text,
    bankReference: optionalText,
    status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE"]).optional()
  })
  .passthrough();

const accountSchema = z
  .object({
    code: text,
    name: text,
    type: z.enum(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"]),
    openingDr: amount.optional(),
    openingCr: amount.optional(),
    isActive: z.boolean().optional()
  })
  .passthrough();

const journalEntrySchema = z
  .object({
    jeNo: text,
    entryDate: date,
    entryType: text,
    description: text,
    amount,
    status: z.enum(["DRAFT", "PENDING_APPROVAL", "POSTED"]).optional(),
    postedBy: optionalText,
    postedAt: optionalDate,
    lines: nestedLines
  })
  .passthrough();

const bankReconSchema = z
  .object({
    reconNo: text,
    bankAccount: text,
    statementDate: date,
    bookBalance: amount,
    bankBalance: amount,
    varianceAmount: amount.optional(),
    status: documentStatus.optional()
  })
  .passthrough();

const budgetSchema = z
  .object({
    period: text,
    department: text,
    accountCode: text,
    budgetAmount: amount,
    actualAmount: amount.optional()
  })
  .passthrough();

const taxReportSchema = z
  .object({
    reportNo: text,
    period: text,
    reportType: text,
    status: documentStatus.optional(),
    taxableValue: amount.optional(),
    taxAmount: amount.optional(),
    filedAt: optionalDate
  })
  .passthrough();

const employeeSchema = z
  .object({
    empNo: text,
    fullName: text,
    department: text,
    role: text,
    shift: optionalText,
    email: z.string().email().optional().nullable(),
    phone: optionalText,
    status: z.enum(["PRESENT", "ON_LEAVE", "ABSENT", "INACTIVE"]).optional()
  })
  .passthrough();

const attendanceSchema = z
  .object({
    employeeId: id,
    workDate: date,
    status: z.enum(["PRESENT", "ON_LEAVE", "ABSENT", "INACTIVE"]).optional(),
    checkIn: optionalDate,
    checkOut: optionalDate
  })
  .passthrough();

const leaveRequestSchema = z
  .object({
    employeeId: id,
    leaveType: text,
    fromDate: date,
    toDate: date,
    reason: optionalText,
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional()
  })
  .passthrough();

const payrollRunSchema = z
  .object({
    payrollNo: text,
    period: text,
    status: documentStatus.optional(),
    grossAmount: amount.optional(),
    netAmount: amount.optional(),
    lines: nestedLines
  })
  .passthrough();

const recruitmentJobSchema = z
  .object({
    jobNo: text,
    title: text,
    department: text,
    experience: optionalText,
    priority: z.string().optional(),
    status: documentStatus.optional()
  })
  .passthrough();

const settingSchema = z
  .object({
    companyId: id.optional().nullable(),
    key: text,
    value: z.unknown()
  })
  .passthrough();

apiRoutes.use("/dashboard", dashboardRoutes);
apiRoutes.use("/ai", aiRoutes);
apiRoutes.use("/reports", reportsRoutes);

apiRoutes.get(
  "/profile",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        company: true,
        employee: true,
        notifications: {
          orderBy: { createdAt: "desc" },
          take: 20
        }
      }
    });

    if (!user) throw new ApiError(404, "Profile not found.");
    res.json({ data: user });
  })
);

apiRoutes.patch(
  "/profile",
  validateBody(z.object({ name: text.optional() })),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({
      where: { id: req.user?.id },
      data: req.body,
      select: { id: true, email: true, name: true, role: true }
    });
    res.json({ data: user });
  })
);

apiRoutes.get(
  "/inventory/stock-overview",
  asyncHandler(async (_req, res) => {
    const batches = await prisma.stockBatch.findMany({
      include: { item: true, warehouse: true },
      orderBy: { updatedAt: "desc" }
    });

    const totals = batches.reduce(
      (acc, batch) => {
        const qty = Number(batch.quantity);
        const value = qty * Number(batch.unitCost);
        acc.quantity += qty;
        acc.valueInr += value;
        return acc;
      },
      { quantity: 0, valueInr: 0 }
    );

    res.json({ data: batches, totals });
  })
);

apiRoutes.get(
  "/finance/dashboard",
  asyncHandler(async (_req, res) => {
    const [cash, ar, ap, revenue, expenses, pendingJournals] = await Promise.all([
      prisma.account.aggregate({ _sum: { openingDr: true }, where: { type: "ASSET" } }),
      prisma.arInvoice.aggregate({ _sum: { amount: true }, where: { status: { not: "PAID" } } }),
      prisma.vendorInvoice.aggregate({ _sum: { amount: true }, where: { paymentStatus: { not: "PAID" } } }),
      prisma.account.aggregate({ _sum: { openingCr: true }, where: { type: "INCOME" } }),
      prisma.account.aggregate({ _sum: { openingDr: true }, where: { type: "EXPENSE" } }),
      prisma.journalEntry.count({ where: { status: "PENDING_APPROVAL" } })
    ]);

    res.json({
      kpis: {
        cashAndBankInr: cash._sum.openingDr ?? 0,
        receivablesInr: ar._sum.amount ?? 0,
        payablesInr: ap._sum.amount ?? 0,
        revenueInr: revenue._sum.openingCr ?? 0,
        expensesInr: expenses._sum.openingDr ?? 0,
        pendingJournals
      }
    });
  })
);

apiRoutes.post(
  "/procurement/purchase-orders/:id/approve",
  asyncHandler(async (req, res) => {
    const po = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: {
        status: "APPROVED",
        approvals: {
          create: {
            approverId: req.user?.id,
            documentType: "PURCHASE_ORDER",
            documentNo: "AUTO",
            status: "APPROVED",
            actedAt: new Date()
          }
        }
      },
      include: { vendor: true, lines: { include: { item: true } }, approvals: true }
    });

    await prisma.notification.create({
      data: {
        userId: req.user?.id,
        title: "Purchase order approved",
        message: `${po.poNo} was approved successfully.`,
        severity: "SUCCESS"
      }
    });

    res.json({ data: po });
  })
);

apiRoutes.post(
  "/quality/iqc/:id/result",
  validateBody(
    z.object({
      result: z.enum(["PASS", "CONDITIONAL_PASS", "FAIL"]),
      remarks: optionalText,
      inspectedAt: optionalDate
    })
  ),
  asyncHandler(async (req, res) => {
    const inspection = await prisma.iqcInspection.update({
      where: { id: req.params.id },
      data: {
        result: req.body.result,
        remarks: req.body.remarks,
        inspectedAt: req.body.inspectedAt ?? new Date()
      },
      include: { item: true, vendor: true, goodsReceipt: true }
    });

    const ncr =
      req.body.result === "FAIL"
        ? await prisma.ncr.create({
            data: {
              ncrNo: `NCR-${Date.now()}`,
              iqcInspectionId: inspection.id,
              severity: "HIGH",
              description: req.body.remarks ?? `${inspection.iqcNo} failed incoming quality inspection.`,
              status: "OPEN"
            }
          })
        : null;

    res.json({ data: inspection, ncr });
  })
);

apiRoutes.post(
  "/finance/journal-entries/:id/post",
  asyncHandler(async (req, res) => {
    const entry = await prisma.journalEntry.update({
      where: { id: req.params.id },
      data: {
        status: "POSTED",
        postedBy: req.user?.name,
        postedAt: new Date()
      },
      include: { lines: { include: { account: true } } }
    });

    res.json({ data: entry });
  })
);

apiRoutes.use(
  "/masters/items",
  createCrudRouter({
    modelName: "item",
    createSchema: itemSchema,
    updateSchema: itemSchema.partial(),
    searchFields: ["code", "description"],
    defaultOrderBy: { code: "asc" }
  })
);
apiRoutes.use(
  "/masters/vendors",
  createCrudRouter({
    modelName: "vendor",
    createSchema: vendorSchema,
    updateSchema: vendorSchema.partial(),
    searchFields: ["code", "name", "category", "city"],
    defaultOrderBy: { code: "asc" }
  })
);
apiRoutes.use(
  "/masters/customers",
  createCrudRouter({
    modelName: "customer",
    createSchema: customerSchema,
    updateSchema: customerSchema.partial(),
    searchFields: ["code", "name", "city"],
    defaultOrderBy: { code: "asc" }
  })
);
apiRoutes.use(
  "/masters/boms",
  createCrudRouter({
    modelName: "bom",
    createSchema: bomSchema,
    updateSchema: bomSchema.partial(),
    include: { outputItem: true, lines: { include: { componentItem: true } } },
    searchFields: ["bomNo", "version"],
    defaultOrderBy: { bomNo: "asc" },
    transformCreate: withNestedLines,
    transformUpdate: stripNestedLines
  })
);

apiRoutes.use(
  "/procurement/purchase-requisitions",
  createCrudRouter({
    modelName: "purchaseRequisition",
    createSchema: purchaseRequisitionSchema,
    updateSchema: purchaseRequisitionSchema.partial(),
    include: { lines: { include: { item: true } } },
    searchFields: ["prNo", "requestedBy", "source"],
    defaultOrderBy: { createdAt: "desc" },
    transformCreate: withNestedLines,
    transformUpdate: stripNestedLines
  })
);
apiRoutes.use(
  "/procurement/rfqs",
  createCrudRouter({
    modelName: "rfq",
    createSchema: rfqSchema,
    updateSchema: rfqSchema.partial(),
    include: { lines: { include: { item: true } }, purchaseRequisition: true },
    searchFields: ["rfqNo", "vendorName"],
    transformCreate: withNestedLines,
    transformUpdate: stripNestedLines
  })
);
apiRoutes.use(
  "/procurement/purchase-orders",
  createCrudRouter({
    modelName: "purchaseOrder",
    createSchema: purchaseOrderSchema,
    updateSchema: purchaseOrderSchema.partial(),
    include: { vendor: true, lines: { include: { item: true } }, goodsReceipts: true, approvals: true },
    searchFields: ["poNo", "aiRisk"],
    defaultOrderBy: { poDate: "desc" },
    transformCreate: withNestedLines,
    transformUpdate: stripNestedLines
  })
);
apiRoutes.use(
  "/procurement/goods-receipts",
  createCrudRouter({
    modelName: "goodsReceipt",
    createSchema: goodsReceiptSchema,
    updateSchema: goodsReceiptSchema.partial(),
    include: { purchaseOrder: true, vendor: true, lines: { include: { item: true } }, iqcInspections: true },
    searchFields: ["grnNo", "vehicleNo", "lrNo"],
    defaultOrderBy: { receivedAt: "desc" },
    transformCreate: withNestedLines,
    transformUpdate: stripNestedLines
  })
);
apiRoutes.use(
  "/procurement/vendor-invoices",
  createCrudRouter({
    modelName: "vendorInvoice",
    createSchema: vendorInvoiceSchema,
    updateSchema: vendorInvoiceSchema.partial(),
    include: { vendor: true, purchaseOrder: true, goodsReceipt: true },
    searchFields: ["invoiceNo", "matchStatus"],
    defaultOrderBy: { invoiceDate: "desc" }
  })
);
apiRoutes.use(
  "/procurement/ap-payments",
  createCrudRouter({
    modelName: "apPayment",
    createSchema: apPaymentSchema,
    updateSchema: apPaymentSchema.partial(),
    include: { vendor: true, vendorInvoice: true, purchaseOrder: true },
    searchFields: ["paymentNo", "mode", "bankReference"],
    defaultOrderBy: { paymentDate: "desc" }
  })
);
apiRoutes.use(
  "/procurement/supplier-scorecards",
  createCrudRouter({
    modelName: "supplierScorecard",
    createSchema: z.object({ vendorId: id, period: text }).passthrough(),
    updateSchema: z.object({}).passthrough(),
    include: { vendor: true },
    defaultOrderBy: { createdAt: "desc" }
  })
);

apiRoutes.use(
  "/inventory/stock-batches",
  createCrudRouter({
    modelName: "stockBatch",
    createSchema: stockBatchSchema,
    updateSchema: stockBatchSchema.partial(),
    include: { item: true, warehouse: true },
    searchFields: ["batchNo", "status"],
    defaultOrderBy: { updatedAt: "desc" }
  })
);
apiRoutes.use(
  "/inventory/movements",
  createCrudRouter({
    modelName: "stockMovement",
    createSchema: stockMovementSchema,
    updateSchema: stockMovementSchema.partial(),
    include: { item: true, stockBatch: true, fromWarehouse: true, toWarehouse: true },
    searchFields: ["referenceType", "referenceNo", "notes"],
    defaultOrderBy: { movedAt: "desc" }
  })
);
apiRoutes.use(
  "/inventory/transfers",
  createCrudRouter({
    modelName: "warehouseTransfer",
    createSchema: warehouseTransferSchema,
    updateSchema: warehouseTransferSchema.partial(),
    include: { fromWarehouse: true, toWarehouse: true },
    searchFields: ["transferNo", "notes"]
  })
);
apiRoutes.use(
  "/inventory/cycle-counts",
  createCrudRouter({
    modelName: "cycleCount",
    createSchema: cycleCountSchema,
    updateSchema: cycleCountSchema.partial(),
    include: { warehouse: true, lines: { include: { item: true } } },
    searchFields: ["countNo", "countedBy"],
    transformCreate: withNestedLines,
    transformUpdate: stripNestedLines
  })
);

apiRoutes.use(
  "/quality/iqc",
  createCrudRouter({
    modelName: "iqcInspection",
    createSchema: iqcSchema,
    updateSchema: iqcSchema.partial(),
    include: { goodsReceipt: true, item: true, vendor: true, ncrs: true },
    searchFields: ["iqcNo", "inspector", "remarks"]
  })
);
apiRoutes.use(
  "/quality/fqc",
  createCrudRouter({
    modelName: "fqcInspection",
    createSchema: fqcSchema,
    updateSchema: fqcSchema.partial(),
    include: { item: true },
    searchFields: ["fqcNo", "serialNo", "productionOrderNo", "remarks"]
  })
);
apiRoutes.use(
  "/quality/ncr",
  createCrudRouter({
    modelName: "ncr",
    createSchema: ncrSchema,
    updateSchema: ncrSchema.partial(),
    include: { iqcInspection: true },
    searchFields: ["ncrNo", "severity", "description", "disposition"]
  })
);

apiRoutes.use(
  "/production/orders",
  createCrudRouter({
    modelName: "productionOrder",
    createSchema: productionOrderSchema,
    updateSchema: productionOrderSchema.partial(),
    include: { item: true, workOrders: true, oeeLogs: true },
    searchFields: ["orderNo", "lineName"],
    defaultOrderBy: { createdAt: "desc" }
  })
);
apiRoutes.use(
  "/production/work-orders",
  createCrudRouter({
    modelName: "workOrder",
    createSchema: workOrderSchema,
    updateSchema: workOrderSchema.partial(),
    include: { productionOrder: true },
    searchFields: ["workOrderNo", "station", "assignedTo"]
  })
);
apiRoutes.use(
  "/production/oee",
  createCrudRouter({
    modelName: "oeeLog",
    createSchema: oeeSchema,
    updateSchema: oeeSchema.partial(),
    include: { productionOrder: true },
    searchFields: ["lineName", "notes"],
    defaultOrderBy: { logDate: "desc" }
  })
);

apiRoutes.use(
  "/sales/orders",
  createCrudRouter({
    modelName: "salesOrder",
    createSchema: salesOrderSchema,
    updateSchema: salesOrderSchema.partial(),
    include: { customer: true, lines: { include: { item: true } }, dispatches: true, arInvoices: true },
    searchFields: ["soNo"],
    defaultOrderBy: { orderDate: "desc" },
    transformCreate: withNestedLines,
    transformUpdate: stripNestedLines
  })
);
apiRoutes.use(
  "/sales/dispatches",
  createCrudRouter({
    modelName: "dispatch",
    createSchema: dispatchSchema,
    updateSchema: dispatchSchema.partial(),
    include: { salesOrder: true },
    searchFields: ["dispatchNo", "customerName", "transporter", "lrNo"],
    defaultOrderBy: { createdAt: "desc" }
  })
);
apiRoutes.use(
  "/sales/ar-invoices",
  createCrudRouter({
    modelName: "arInvoice",
    createSchema: arInvoiceSchema,
    updateSchema: arInvoiceSchema.partial(),
    include: { customer: true, salesOrder: true, arPayments: true },
    searchFields: ["invoiceNo"],
    defaultOrderBy: { invoiceDate: "desc" }
  })
);
apiRoutes.use(
  "/sales/ar-payments",
  createCrudRouter({
    modelName: "arPayment",
    createSchema: arPaymentSchema,
    updateSchema: arPaymentSchema.partial(),
    include: { customer: true, arInvoice: true },
    searchFields: ["receiptNo", "mode", "bankReference"],
    defaultOrderBy: { receiptDate: "desc" }
  })
);

apiRoutes.use(
  "/finance/accounts",
  createCrudRouter({
    modelName: "account",
    createSchema: accountSchema,
    updateSchema: accountSchema.partial(),
    searchFields: ["code", "name"],
    defaultOrderBy: { code: "asc" }
  })
);
apiRoutes.use(
  "/finance/journal-entries",
  createCrudRouter({
    modelName: "journalEntry",
    createSchema: journalEntrySchema,
    updateSchema: journalEntrySchema.partial(),
    include: { lines: { include: { account: true } } },
    searchFields: ["jeNo", "entryType", "description", "postedBy"],
    defaultOrderBy: { entryDate: "desc" },
    transformCreate: withNestedLines,
    transformUpdate: stripNestedLines
  })
);
apiRoutes.use(
  "/finance/bank-reconciliations",
  createCrudRouter({
    modelName: "bankReconciliation",
    createSchema: bankReconSchema,
    updateSchema: bankReconSchema.partial(),
    searchFields: ["reconNo", "bankAccount"],
    defaultOrderBy: { statementDate: "desc" }
  })
);
apiRoutes.use(
  "/finance/budgets",
  createCrudRouter({
    modelName: "budget",
    createSchema: budgetSchema,
    updateSchema: budgetSchema.partial(),
    searchFields: ["period", "department", "accountCode"]
  })
);
apiRoutes.use(
  "/finance/tax-reports",
  createCrudRouter({
    modelName: "taxReport",
    createSchema: taxReportSchema,
    updateSchema: taxReportSchema.partial(),
    searchFields: ["reportNo", "period", "reportType"],
    defaultOrderBy: { createdAt: "desc" }
  })
);

apiRoutes.use(
  "/hr/employees",
  createCrudRouter({
    modelName: "employee",
    createSchema: employeeSchema,
    updateSchema: employeeSchema.partial(),
    include: { user: true },
    searchFields: ["empNo", "fullName", "department", "role"],
    defaultOrderBy: { empNo: "asc" }
  })
);
apiRoutes.use(
  "/hr/attendance",
  createCrudRouter({
    modelName: "attendance",
    createSchema: attendanceSchema,
    updateSchema: attendanceSchema.partial(),
    include: { employee: true },
    defaultOrderBy: { workDate: "desc" }
  })
);
apiRoutes.use(
  "/hr/leave-requests",
  createCrudRouter({
    modelName: "leaveRequest",
    createSchema: leaveRequestSchema,
    updateSchema: leaveRequestSchema.partial(),
    include: { employee: true },
    defaultOrderBy: { createdAt: "desc" }
  })
);
apiRoutes.use(
  "/hr/payroll-runs",
  createCrudRouter({
    modelName: "payrollRun",
    createSchema: payrollRunSchema,
    updateSchema: payrollRunSchema.partial(),
    include: { lines: { include: { employee: true } } },
    searchFields: ["payrollNo", "period"],
    transformCreate: withNestedLines,
    transformUpdate: stripNestedLines
  })
);
apiRoutes.use(
  "/hr/jobs",
  createCrudRouter({
    modelName: "recruitmentJob",
    createSchema: recruitmentJobSchema,
    updateSchema: recruitmentJobSchema.partial(),
    searchFields: ["jobNo", "title", "department", "experience", "priority"]
  })
);

apiRoutes.use(
  "/settings",
  createCrudRouter({
    modelName: "setting",
    createSchema: settingSchema,
    updateSchema: settingSchema.partial(),
    include: { company: true },
    searchFields: ["key"],
    transformCreate: (data) => ({
      ...data,
      value: typeof data.value === "string" ? data.value : JSON.stringify(data.value)
    }),
    transformUpdate: (data) => ({
      ...data,
      ...(Object.prototype.hasOwnProperty.call(data, "value")
        ? { value: typeof data.value === "string" ? data.value : JSON.stringify(data.value) }
        : {})
    })
  })
);
