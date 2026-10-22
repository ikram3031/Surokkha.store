import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().lte(65535).default(5092),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/ecommerce-db"),
  MONGODB_DB_NAME: z.string().min(1).default("ecommerce-db"),
  ACCESS_TOKEN_SECRET: z.string().min(20, "ACCESS_TOKEN_SECRET is required").default("dev_jwt_access_token_secret_key_at_least_20_chars"),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_MS: z.coerce.number().int().positive().default(30 * 24 * 60 * 60 * 1000),
  ALLOW_SUPER_ADMIN_CREATION: z.coerce.boolean().default(false),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  ALLOWED_ORIGINS: z.string().default("http://localhost:8001,http://localhost:8005,http://localhost:3000,http://localhost:4001,http://localhost:4002,http://localhost:5173"),
  FRONTEND_DOMAIN_KEYWORDS: z.string().default("localhost,example.com"),
  DASHBOARD_DOMAIN_KEYWORDS: z.string().default("dashboard,localhost:8005,localhost:5173"),
  SMTP_HOST: z.string().default("smtp.hostinger.com"),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_ENCRYPTION: z.string().default("TLS"),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASSWORD: z.string().optional().default(""),
  SMTP_FROM_NAME: z.string().optional().default(""),
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
  R2_BUCKET_NAME: z.string().optional().default("surokkha"),
  R2_PUBLIC_URL: z.string().optional().default(""),
  R2_SYNC_INTERVAL_DAYS: z.coerce.number().int().positive().default(2),
  R2_SYNC_ENABLED: z.coerce.boolean().default(false),
  R2_BACKUP_ENABLED: z.coerce.boolean().default(true),
  R2_BACKUP_TIME: z.string().default("03:00"),
  R2_BACKUP_TIMEZONE: z.string().default("Asia/Dhaka"),
  R2_BACKUP_RETENTION_DAYS: z.coerce.number().int().positive().default(30),
  FB_PIXEL_ID: z.string().optional().default(""),
  FB_ACCESS_TOKEN: z.string().optional().default(""),
  FB_TEST_EVENT_CODE: z.string().optional().default(""),
  // Per-site Meta Pixel / CAPI credentials (surokkha.store and surokkha.shop)
  FB_PIXEL_ID_STORE: z.string().optional().default(""),
  FB_ACCESS_TOKEN_STORE: z.string().optional().default(""),
  FB_TEST_EVENT_CODE_STORE: z.string().optional().default(""),
  FB_PIXEL_ID_SHOP: z.string().optional().default(""),
  FB_ACCESS_TOKEN_SHOP: z.string().optional().default(""),
  FB_TEST_EVENT_CODE_SHOP: z.string().optional().default(""),
  // Optional own pixel for offer.surokkha.shop (SC orders); by default they use the shop pixel
  FB_PIXEL_ID_OFFER: z.string().optional().default("1840805450442709"),
  FB_ACCESS_TOKEN_OFFER: z.string().optional().default(""),
  FB_TEST_EVENT_CODE_OFFER: z.string().optional().default(""),
  // Cloudflare Turnstile secret (offer checkout + dashboard login); checks are skipped while unset
  TURNSTILE_SECRET_KEY: z.string().optional().default(""),
  // Emergency switch: "true" turns the Turnstile check off on dashboard login only
  TURNSTILE_LOGIN_DISABLED: z.string().optional().default(""),
  // Optional comma-separated hostnames accepted from siteverify; defaults are set per surface in code
  TURNSTILE_HOSTNAMES: z.string().optional().default(""),
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

// In production, secrets must come from .env — never from the development defaults in this file
const DEV_ACCESS_TOKEN_SECRET = "dev_jwt_access_token_secret_key_at_least_20_chars";
if (parsed.data.NODE_ENV === "production" && parsed.data.ACCESS_TOKEN_SECRET === DEV_ACCESS_TOKEN_SECRET) {
  console.error("❌ ACCESS_TOKEN_SECRET is not set in .env. Refusing to start in production with the development default.");
  process.exit(1);
}

export const env = parsed.data;
