import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "./error.js";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId?: string | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  role: string;
  companyId?: string | null;
};

export const signAccessToken = (user: AuthUser) =>
  jwt.sign(
    {
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId
    },
    env.jwtSecret,
    {
      subject: user.id,
      expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"]
    }
  );

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.header("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(401, "Missing bearer token.");
  }

  const token = authHeader.slice("Bearer ".length);
  const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;

  req.user = {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    companyId: payload.companyId
  };

  next();
};

export const requireRoles =
  (...roles: string[]) => (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new ApiError(401, "Authentication required.");
    if (!roles.includes(req.user.role) && req.user.role !== "ADMIN") {
      throw new ApiError(403, "You do not have permission for this action.");
    }
    next();
  };
