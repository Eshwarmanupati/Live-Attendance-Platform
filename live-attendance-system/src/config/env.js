import "dotenv/config";
import { z } from "zod";

/**
 * Environment is loaded and validated here, in a module that every other
 * module imports transitively before it reads a variable. Importing
 * "dotenv/config" at the top of this file guarantees the .env file is applied
 * before any consumer evaluates `config.*` — the previous code called
 * dotenv.config() in server.js *after* app.js had already been evaluated, so
 * CLIENT_URL was always undefined and the deployed origin was blocked by CORS.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5001),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters — generate one with: openssl rand -base64 48"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  // Comma-separated list so a preview deploy can be allowed alongside production.
  CLIENT_URL: z.string().default(""),
  // Grace period before a student marking in is recorded as "late".
  LATE_AFTER_MINUTES: z.coerce.number().int().min(0).default(10),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  console.error(`Invalid environment configuration:\n${details}\n\nCopy .env.example to .env and fill it in.`);
  process.exit(1);
}

const env = parsed.data;

export const config = Object.freeze({
  ...env,
  isProduction: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",
  clientOrigins: env.CLIENT_URL.split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean),
});

export default config;
