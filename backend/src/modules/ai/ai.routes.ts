import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";

export const aiRoutes = Router();

const chatSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1)
});

const buildReply = (message: string) => {
  const q = message.toLowerCase();

  if (q.includes("eva") || q.includes("stock")) {
    return {
      reply:
        "EVA Film is below reorder level. Recommended action: raise a purchase requisition for 400 rolls and check alternate vendors before production risk increases.",
      actions: [{ type: "CREATE_PR", label: "Create PR", module: "procurement" }]
    };
  }

  if (q.includes("oee") || q.includes("line 3")) {
    return {
      reply:
        "Line 3 OEE is under target. The first backend action should be a maintenance work order tied to downtime reason capture.",
      actions: [{ type: "CREATE_WORK_ORDER", label: "Create work order", module: "production" }]
    };
  }

  if (q.includes("cash") || q.includes("receivable") || q.includes("ar")) {
    return {
      reply:
        "Receivables need attention. Prioritize overdue AR invoices, then reconcile bank receipts before running the next cash forecast.",
      actions: [{ type: "VIEW_AR", label: "View AR invoices", module: "finance" }]
    };
  }

  return {
    reply:
      "I reviewed the ERP modules. Current priorities are inventory risk, pending IQC, overdue dispatches, and finance approvals. Open the control tower for the ranked action list.",
    actions: [{ type: "VIEW_CONTROL_TOWER", label: "Open control tower", module: "dashboard" }]
  };
};

aiRoutes.post(
  "/chat",
  validateBody(chatSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof chatSchema>;
    const response = buildReply(body.message);

    const conversation = body.conversationId
      ? await prisma.aiConversation.update({
          where: { id: body.conversationId },
          data: {
            messages: {
              create: [
                { role: "user", content: body.message },
                { role: "assistant", content: response.reply }
              ]
            }
          }
        })
      : await prisma.aiConversation.create({
          data: {
            userId: req.user?.id,
            title: body.message.slice(0, 80),
            messages: {
              create: [
                { role: "user", content: body.message },
                { role: "assistant", content: response.reply }
              ]
            }
          }
        });

    res.json({
      conversationId: conversation.id,
      reply: response.reply,
      actions: response.actions
    });
  })
);
