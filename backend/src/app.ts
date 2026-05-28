import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { apiRoutes } from "./modules/routes.js";

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigin.length === 0 || env.corsOrigin.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`CORS blocked for origin ${origin}`));
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "solaros-erp-backend",
      timestamp: new Date().toISOString()
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api", requireAuth, apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
