import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { prisma } from "../../db/prisma.js";
import { requireAuth, signAccessToken } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/error.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";

export const authRoutes = Router();

const mfaChallenges = new Map<string, { userId: string; expiresAt: number }>();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const mfaVerifySchema = z.object({
  challengeId: z.string().min(1),
  code: z.string().min(4).max(12)
});

authRoutes.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user || !user.active) {
      throw new ApiError(401, "Invalid email or password.");
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      throw new ApiError(401, "Invalid email or password.");
    }

    const challengeId = randomUUID();
    mfaChallenges.set(challengeId, {
      userId: user.id,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    res.json({
      mfaRequired: true,
      challengeId,
      expiresInSeconds: 300,
      message: "MFA challenge created. Use the configured MFA provider in production."
    });
  })
);

authRoutes.post(
  "/mfa/verify",
  validateBody(mfaVerifySchema),
  asyncHandler(async (req, res) => {
    const { challengeId, code } = req.body as z.infer<typeof mfaVerifySchema>;
    const challenge = mfaChallenges.get(challengeId);

    if (!challenge || challenge.expiresAt < Date.now()) {
      mfaChallenges.delete(challengeId);
      throw new ApiError(401, "MFA challenge expired.");
    }

    if (code !== env.mfaDevCode) {
      throw new ApiError(401, "Invalid MFA code.");
    }

    const user = await prisma.user.findUnique({ where: { id: challenge.userId } });
    if (!user || !user.active) {
      throw new ApiError(401, "User is not active.");
    }

    mfaChallenges.delete(challengeId);

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId
    };

    res.json({
      accessToken: signAccessToken(authUser),
      tokenType: "Bearer",
      user: authUser
    });
  })
);

authRoutes.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        active: true,
        employee: {
          select: {
            empNo: true,
            department: true,
            role: true
          }
        }
      }
    });

    if (!user) throw new ApiError(404, "User not found.");
    res.json({ user });
  })
);
