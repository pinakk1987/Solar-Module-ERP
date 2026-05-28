import { Router } from "express";
import { prisma } from "../../db/prisma.js";
import { ApiError } from "../../middleware/error.js";
import { asyncHandler } from "../../utils/async-handler.js";

export const reportsRoutes = Router();

reportsRoutes.get(
  "/:domain",
  asyncHandler(async (req, res) => {
    const domain = req.params.domain;

    if (domain === "production") {
      const [orders, oee] = await Promise.all([
        prisma.productionOrder.findMany({ orderBy: { createdAt: "desc" }, take: 25, include: { item: true } }),
        prisma.oeeLog.findMany({ orderBy: { logDate: "desc" }, take: 25 })
      ]);
      res.json({ domain, orders, oee });
      return;
    }

    if (domain === "procurement") {
      const [purchaseOrders, spend] = await Promise.all([
        prisma.purchaseOrder.findMany({ orderBy: { poDate: "desc" }, take: 25, include: { vendor: true } }),
        prisma.purchaseOrder.aggregate({ _sum: { totalAmount: true } })
      ]);
      res.json({ domain, purchaseOrders, spendInr: spend._sum.totalAmount ?? 0 });
      return;
    }

    if (domain === "inventory") {
      const stock = await prisma.stockBatch.findMany({
        include: { item: true, warehouse: true },
        orderBy: { updatedAt: "desc" },
        take: 100
      });
      res.json({ domain, stock });
      return;
    }

    if (domain === "quality") {
      const [iqc, ncr] = await Promise.all([
        prisma.iqcInspection.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { item: true, vendor: true } }),
        prisma.ncr.findMany({ orderBy: { createdAt: "desc" }, take: 50 })
      ]);
      res.json({ domain, iqc, ncr });
      return;
    }

    if (domain === "finance") {
      const [journalEntries, ar, ap] = await Promise.all([
        prisma.journalEntry.findMany({ orderBy: { entryDate: "desc" }, take: 50 }),
        prisma.arInvoice.aggregate({ _sum: { amount: true } }),
        prisma.vendorInvoice.aggregate({ _sum: { amount: true } })
      ]);
      res.json({ domain, journalEntries, receivablesInr: ar._sum.amount ?? 0, payablesInr: ap._sum.amount ?? 0 });
      return;
    }

    if (domain === "sales") {
      const orders = await prisma.salesOrder.findMany({
        include: { customer: true, lines: { include: { item: true } } },
        orderBy: { orderDate: "desc" },
        take: 50
      });
      res.json({ domain, orders });
      return;
    }

    throw new ApiError(404, `Unknown report domain: ${domain}`);
  })
);
