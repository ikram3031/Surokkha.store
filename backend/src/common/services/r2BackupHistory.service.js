import { S3Client, ListObjectsV2Command, DeleteObjectsCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "../config/logger.js";

const DB_PREFIX = "database/";
const DAY_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_KEEP_DAILY_DAYS = 7;
export const DEFAULT_KEEP_WEEKLY_WEEKS = 5;

const clientFor = (cfg) =>
  new S3Client({
    region: "auto",
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
  });

// Calendar date (YYYY-MM-DD) and weekday of an instant in the given timezone
const zonedDay = (date, timeZone) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  const ymd = `${parts.year}-${parts.month}-${parts.day}`;
  return { ymd, weekday: parts.weekday, dayNumber: Math.round(Date.parse(`${ymd}T00:00:00Z`) / DAY_MS) };
};

const listAll = async (client, bucket, prefix) => {
  const items = [];
  let token;
  do {
    const res = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }));
    items.push(...(res.Contents || []));
    token = res.NextContinuationToken;
  } while (token);
  return items;
};

const timestampOf = (key) => key.match(/surokkha_db_(\d{8}_\d{6})/)?.[1] || null;

// Database backups in R2, newest first, with calendar info in the backup timezone
export const listDatabaseBackups = async (cfg) => {
  const tz = cfg.backupTimezone || "Asia/Dhaka";
  const today = zonedDay(new Date(), tz);
  const objects = await listAll(clientFor(cfg), cfg.bucketName, DB_PREFIX);

  return objects
    .filter((o) => o.Key && !o.Key.includes("/latest.") && timestampOf(o.Key))
    .map((o) => {
      const day = zonedDay(o.LastModified, tz);
      return {
        key: o.Key,
        size: o.Size || 0,
        createdAt: o.LastModified,
        date: day.ymd,
        weekday: day.weekday,
        ageDays: today.dayNumber - day.dayNumber,
        format: o.Key.endsWith(".ejson.gz") ? "ejson" : "mongodump",
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// Decides which backups to keep: every backup from the last `keepDailyDays` days, then one per calendar
// week (Sun–Sat, preferring the Sunday backup, else that week's newest) until `keepWeeklyWeeks` weeks old.
export const planRetention = (backups, { keepDailyDays = DEFAULT_KEEP_DAILY_DAYS, keepWeeklyWeeks = DEFAULT_KEEP_WEEKLY_WEEKS } = {}) => {
  const keep = new Set();
  const weekly = new Map(); // week-start day number -> chosen backup

  for (const b of backups) {
    if (b.ageDays < keepDailyDays) {
      keep.add(b.key);
      continue;
    }
    if (b.ageDays >= keepWeeklyWeeks * 7) continue;
    const dayNumber = Math.round(Date.parse(`${b.date}T00:00:00Z`) / DAY_MS);
    const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(b.weekday);
    const weekStart = dayNumber - weekdayIndex;
    const todayNumber = dayNumber + b.ageDays;
    if (todayNumber - weekStart >= keepWeeklyWeeks * 7) continue; // the week's Sunday is outside the window
    const current = weekly.get(weekStart);
    const isSunday = b.weekday === "Sun";
    // backups are newest-first: the first seen is the week's newest; a Sunday one replaces a non-Sunday pick
    if (!current || (isSunday && current.weekday !== "Sun")) weekly.set(weekStart, b);
  }
  for (const b of weekly.values()) keep.add(b.key);

  return {
    keep: backups.filter((b) => keep.has(b.key)),
    remove: backups.filter((b) => !keep.has(b.key)),
  };
};

// Applies the retention plan in R2 (also removes each deleted backup's manifest)
export const pruneDatabaseBackups = async (cfg, policy = {}) => {
  const backups = await listDatabaseBackups(cfg);
  const { remove } = planRetention(backups, policy);
  if (remove.length === 0) return 0;

  const keys = remove.flatMap((b) => [b.key, `metadata/manifest_${timestampOf(b.key)}.json`]);
  const client = clientFor(cfg);
  for (let i = 0; i < keys.length; i += 1000) {
    await client.send(
      new DeleteObjectsCommand({ Bucket: cfg.bucketName, Delete: { Objects: keys.slice(i, i + 1000).map((Key) => ({ Key })), Quiet: true } })
    );
  }
  logger.info({ removed: remove.map((b) => b.key) }, "[R2Backup] Pruned old database backups");
  return remove.length;
};

// Opens a database backup object for streaming to the client
export const getBackupObject = async (cfg, key) => {
  if (!key || !key.startsWith(DB_PREFIX) || key.includes("..")) throw new Error("Invalid backup key");
  return clientFor(cfg).send(new GetObjectCommand({ Bucket: cfg.bucketName, Key: key }));
};
