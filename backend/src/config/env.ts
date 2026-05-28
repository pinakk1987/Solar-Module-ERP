import dotenv from "dotenv";

dotenv.config();

const asNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const asList = (value: string | undefined) => {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: asNumber(process.env.PORT, 4000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  corsOrigin: asList(process.env.CORS_ORIGIN),
  mfaDevCode: process.env.MFA_DEV_CODE ?? "123456"
};

if (env.nodeEnv === "production" && env.jwtSecret === "dev-only-change-me") {
  throw new Error("JWT_SECRET must be set in production.");
}
