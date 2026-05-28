import { Router } from "express";
import type { ZodTypeAny } from "zod";
import { prisma } from "../../db/prisma.js";
import { ApiError } from "../../middleware/error.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";

type Transform = (data: Record<string, unknown>) => Record<string, unknown> | Promise<Record<string, unknown>>;

type CrudRouterConfig = {
  modelName: string;
  createSchema: ZodTypeAny;
  updateSchema: ZodTypeAny;
  include?: Record<string, unknown>;
  defaultOrderBy?: Record<string, "asc" | "desc">;
  searchFields?: string[];
  transformCreate?: Transform;
  transformUpdate?: Transform;
};

const getDelegate = (modelName: string) => {
  const delegate = (prisma as unknown as Record<string, unknown>)[modelName];
  if (!delegate) throw new ApiError(500, `Unknown Prisma model: ${modelName}`);
  return delegate as {
    findMany(args?: unknown): Promise<unknown[]>;
    findUnique(args: unknown): Promise<unknown | null>;
    count(args?: unknown): Promise<number>;
    create(args: unknown): Promise<unknown>;
    update(args: unknown): Promise<unknown>;
    delete(args: unknown): Promise<unknown>;
  };
};

const pagination = (query: Record<string, unknown>) => {
  const page = Math.max(Number(query.page ?? 1), 1);
  const requestedTake = Math.max(Number(query.take ?? 25), 1);
  const take = Math.min(requestedTake, 100);
  const skip = (page - 1) * take;
  return { page, take, skip };
};

const searchWhere = (query: Record<string, unknown>, fields?: string[]) => {
  const q = typeof query.q === "string" ? query.q.trim() : "";
  if (!q || !fields?.length) return undefined;
  const isSqlite = process.env.DATABASE_URL?.startsWith("file:");

  return {
    OR: fields.map((field) => ({
      [field]: {
        contains: q,
        ...(isSqlite ? {} : { mode: "insensitive" })
      }
    }))
  };
};

const auditMutation = async (
  reqUserId: string | undefined,
  action: string,
  entityType: string,
  entity: unknown
) => {
  await prisma.auditLog.create({
    data: {
      userId: reqUserId,
      action,
      entityType,
      entityId: typeof entity === "object" && entity && "id" in entity ? String(entity.id) : undefined,
      after: entity ? JSON.stringify(entity) : undefined
    }
  });
};

export const createCrudRouter = (config: CrudRouterConfig) => {
  const router = Router();
  const delegate = getDelegate(config.modelName);

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const { page, take, skip } = pagination(req.query as Record<string, unknown>);
      const where = searchWhere(req.query as Record<string, unknown>, config.searchFields);

      const [items, total] = await Promise.all([
        delegate.findMany({
          where,
          include: config.include,
          orderBy: config.defaultOrderBy ?? { createdAt: "desc" },
          skip,
          take
        }),
        delegate.count({ where })
      ]);

      res.json({
        data: items,
        pagination: {
          page,
          take,
          total,
          pages: Math.ceil(total / take)
        }
      });
    })
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const item = await delegate.findUnique({
        where: { id: req.params.id },
        include: config.include
      });

      if (!item) throw new ApiError(404, "Record not found.");
      res.json({ data: item });
    })
  );

  router.post(
    "/",
    validateBody(config.createSchema),
    asyncHandler(async (req, res) => {
      const data = config.transformCreate ? await config.transformCreate(req.body) : req.body;
      const item = await delegate.create({ data });
      await auditMutation(req.user?.id, "CREATE", config.modelName, item);
      res.status(201).json({ data: item });
    })
  );

  router.patch(
    "/:id",
    validateBody(config.updateSchema),
    asyncHandler(async (req, res) => {
      const data = config.transformUpdate ? await config.transformUpdate(req.body) : req.body;
      const item = await delegate.update({
        where: { id: req.params.id },
        data
      });
      await auditMutation(req.user?.id, "UPDATE", config.modelName, item);
      res.json({ data: item });
    })
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const item = await delegate.delete({
        where: { id: req.params.id }
      });
      await auditMutation(req.user?.id, "DELETE", config.modelName, item);
      res.json({ data: item });
    })
  );

  return router;
};
