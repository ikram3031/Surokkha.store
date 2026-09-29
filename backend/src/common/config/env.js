import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().lte(65535).default(5092),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/perfume-store"),
  MONGODB_DB_NAME: z.string().min(1).default("perfume-store"),
  ACCESS_TOKEN_SECRET: z.string().min(20, "ACCESS_TOKEN_SECRET is required").default("dev_jwt_access_token_secret_key_at_least_20_chars"),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_MS: z.coerce.number().int().positive().default(30 * 24 * 60 * 60 * 1000),
  ALLOW_SUPER_ADMIN_CREATION: z.coerce.boolean().default(false),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  ALLOWED_ORIGINS: z.string().default("http://localhost:8001,http://localhost:8005,http://localhost:3000,http://localhost:4001,http://localhost:4002,http://localhost:5173"),
  FRONTEND_DOMAIN_KEYWORDS: z.string().default("localhost,decantrebd.com"),
  DASHBOARD_DOMAIN_KEYWORDS: z.string().default("dashboard,localhost:8005,localhost:5173"),
  SMTP_HOST: z.string().default("smtp.hostinger.com"),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_ENCRYPTION: z.string().default("TLS"),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASSWORD: z.string().optional().default(""),
  SMTP_FROM_NAME: z.string().default("Multi-Tenant Store"),
  SMTP_FROM: z.string().optional(),
  IMAP_HOST: z.string().default("imap.hostinger.com"),
  IMAP_PORT: z.coerce.number().int().positive().default(993),
  IMAP_SECURE: z.coerce.boolean().default(true),
  IMAP_USER: z.string().optional(),
  IMAP_PASSWORD: z.string().optional(),
  IMAP_SYNC_ENABLED: z.coerce.boolean().default(true),
  R2_ACCOUNT_ID: z.string().optional().default(""),
  R2_ACCESS_KEY_ID: z.string().optional().default(""),
  R2_SECRET_ACCESS_KEY: z.string().optional().default(""),
  R2_BUCKET_NAME: z.string().optional().default(""),
  R2_PUBLIC_URL: z.string().optional().default(""),
  R2_SYNC_INTERVAL_DAYS: z.coerce.number().int().positive().default(2),
  R2_SYNC_ENABLED: z.coerce.boolean().default(false),
  FB_PIXEL_ID: z.string().optional().default(""),
  FB_ACCESS_TOKEN: z.string().optional().default(""),
  FB_TEST_EVENT_CODE: z.string().optional().default(""),
  TIKTOK_PIXEL_ID: z.string().optional().default(""),
  TIKTOK_ACCESS_TOKEN: z.string().optional().default(""),
  TIKTOK_TEST_EVENT_CODE: z.string().optional().default(""),
  CENTRAL_HUB_URL: z.string().optional().default(""),
  CENTRAL_HUB_SECRET: z.string().optional().default(""),
  VPS_IP: z.string().optional().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errorMessages = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Environment validation failed: ${errorMessages}`);
}

export const env = parsed.data;
