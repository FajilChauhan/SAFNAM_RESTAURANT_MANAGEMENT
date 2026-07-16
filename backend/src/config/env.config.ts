// Centralizes environment variable parsing so the app fails fast on invalid config.
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JSON_LIMIT: z.string().default("1mb"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  REFRESH_TOKEN_COOKIE_NAME: z.string().default("safnam_refresh_token"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
  STORAGE_PROVIDER: z.enum(["local", "cloudinary", "s3", "r2"]).default("local"),
  UPLOAD_BASE_PATH: z.string().default("uploads"),
  UPLOAD_PUBLIC_PATH: z.string().default("/uploads"),
  MAX_IMAGE_SIZE_BYTES: z.coerce.number().int().positive().default(2 * 1024 * 1024),
});

export const env = envSchema.parse(process.env);
