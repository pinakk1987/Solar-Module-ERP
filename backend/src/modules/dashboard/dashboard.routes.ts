import { Router } from "express";
import { prisma } from "../../db/prisma.js";
import { asyncHandler } from "../../utils/async-handler.js";

export const dashboardRoutes = Router();

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

dashboardRoutes.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    const [
      production,
      openPurchaseOrders,
      pendingPoApprovals,
      pendingIqc,
      salesOrderBook,
      overdueReceivables,
      dispatchedToday
    ] = await Promise.all([
      prisma.productionOrder.aggregate({ _sum: { producedQty: true } }),
      prisma.purchaseOrder.count({
        where: { status: { in: ["OPEN", "PENDING_APPROVAL", "APPROVED", "PARTIALLY_RECEIVED"] } }
      }),
      prisma.purchaseOrder.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.iqcInspection.count({ where: { result: "PENDING" } }),
      prisma.salesOrder.aggregate({ _sum: { totalAmount: true }, where: { status: { not: "CLOSED" } } }),
      prisma.arInvoice.aggregate({ _sum: { amount: true }, where: { status: "OVERDUE" } }),
      prisma.dispatch.aggregate({
        _sum: { quantity: true },
        where: { dispatchedAt: { gte: startOfToday() } }
      })
    ]);

    res.json({
      kpis: {
        producedTodayQty: production._sum.producedQty ?? 0,
        plantOeePercent: 74,
        inventoryValueInr: 84000000,
        openPurchaseOrders,
        pendingPoApprovals,
        pendingIqc,
        salesOrderBookInr: salesOrderBook._sum.totalAmount ?? 0,
        overdueReceivablesInr: overdueReceivables._sum.amount ?? 0,
        dispatchedTodayQty: dispatchedToday._sum.quantity ?? 0
      }
    });
  })
);

dashboardRoutes.get(
  "/control-tower",
  asyncHandler(async (_req, res) => {
    const [items, overdueSalesOrders, lowOeeLogs, pendingIqc] = await Promise.all([
      prisma.item.findMany({
        where: { reorderLevel: { not: null } },
        include: { stockBatches: true },
        take: 50
      }),
      prisma.salesOrder.findMany({
        where: {
          deliveryDate: { lt: new Date() },
          status: { notIn: ["CLOSED", "COMPLETED", "CANCELLED"] }
        },
        include: { customer: true },
        take: 10
      }),
      prisma.oeeLog.findMany({
        where: { oee: { lt: 70 } },
        orderBy: { logDate: "desc" },
        take: 10
      }),
      prisma.iqcInspection.findMany({
        where: { result: "PENDING" },
        include: { item: true, vendor: true, goodsReceipt: true },
        orderBy: { createdAt: "asc" },
        take: 10
      })
    ]);

    const lowStockAlerts = items
      .map((item) => {
        const onHand = item.stockBatches.reduce((sum, batch) => sum + Number(batch.quantity), 0);
        return { item, onHand };
      })
      .filter(({ item, onHand }) => item.reorderLevel && onHand < Number(item.reorderLevel))
      .map(({ item, onHand }) => ({
        severity: "P1",
        title: `${item.description} critical stock`,
        module: "Inventory",
        impact: "Production risk",
        action: "CREATE_PR",
        data: { itemId: item.id, code: item.code, onHand, reorderLevel: item.reorderLevel }
      }));

    res.json({
      alerts: [
        ...lowStockAlerts,
        ...lowOeeLogs.map((log) => ({
          severity: "P1",
          title: `${log.lineName} OEE at ${log.oee}%`,
          module: "Production",
          impact: `${log.downtimeMinutes} downtime minutes`,
          action: "VIEW_OEE",
          data: log
        })),
        ...overdueSalesOrders.map((order) => ({
          severity: "P2",
          title: `${order.soNo} delivery overdue`,
          module: "Sales",
          impact: "Penalty clause risk",
          action: "CREATE_DISPATCH",
          data: order
        })),
        ...pendingIqc.map((inspection) => ({
          severity: "P3",
          title: `${inspection.iqcNo} pending`,
          module: "Quality",
          impact: `${inspection.quantity} ${inspection.item.uom} blocked`,
          action: "START_IQC",
          data: inspection
        }))
      ]
    });
  })
);
