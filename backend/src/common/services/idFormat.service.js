import mongoose, { Schema, model } from "mongoose";
import { StoreSettingsModel } from "../models/storeSettings.model.js";

const { models } = mongoose;

// Every record type whose ID the Owner can format from Business Settings.
// An empty format keeps the built-in numbering for that type.
export const ID_TYPES = [
  { key: "orderShop", label: "Shop Order", example: "SH{YY}{MM}{SEQ:3}" },
  { key: "orderStore", label: "Store Order", example: "ST{YY}{MM}{SEQ:3}" },
  { key: "orderInstore", label: "In-store Order", example: "IS{YY}{MM}{SEQ:3}" },
  { key: "orderCustom", label: "Custom Order", example: "CO{YY}{MM}{SEQ:3}" },
  { key: "purchase", label: "Purchase", example: "PO-{YY}{MM}-{SEQ:4}" },
  { key: "payment", label: "Payment", example: "PAY-{YY}{MM}-{SEQ:4}" },
  { key: "bill", label: "Bill", example: "BL-{YY}{MM}-{SEQ:4}" },
];
const ID_TYPE_KEYS = new Set(ID_TYPES.map((t) => t.key));

// Tokens a format may use; dates follow Bangladesh time
export const ID_TOKENS = [
  { token: "{YY}", label: "Year (2 digits)" },
  { token: "{YYYY}", label: "Year (4 digits)" },
  { token: "{MM}", label: "Month (01-12)" },
  { token: "{MX}", label: "Month in hex (1-9, A, B, C)" },
  { token: "{DD}", label: "Day (01-31)" },
  { token: "{SEQ:3}", label: "Serial (digits)" },
  { token: "{SEQX:3}", label: "Serial in hex (0-9, A-F)" },
];

const SEQ_RE = /\{SEQ(X)?(?::(\d{1,2}))?\}/i;
const TOKEN_RE = /\{(YYYY|YY|MM|MX|DD|SEQX?(?::\d{1,2})?)\}/gi;
const MAX_FORMAT_LENGTH = 40;

// Checks a format: allowed characters only, known tokens, exactly one serial
export const validateIdFormat = (format) => {
  const value = String(format || "").trim();
  if (!value) return null;
  if (value.length > MAX_FORMAT_LENGTH) return `Format is longer than ${MAX_FORMAT_LENGTH} characters`;
  const literal = value.replace(TOKEN_RE, "");
  if (/[{}]/.test(literal)) return "Unknown token in format";
  if (!/^[A-Za-z0-9\-_/.]*$/.test(literal)) return "Only letters, digits and - _ / . are allowed";
  const serials = value.match(/\{SEQX?(?::\d{1,2})?\}/gi) || [];
  if (serials.length !== 1) return "Format needs exactly one {SEQ} or {SEQX}";
  const width = Number(SEQ_RE.exec(value)[2] || 1);
  if (width < 1 || width > 10) return "Serial width must be 1-10";
  return null;
};

const dhakaParts = (date) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  return { year: parts.year, month: parts.month, day: parts.day };
};

// Fills the date tokens; the serial token stays in place so the result names the serial's scope
const renderScope = (format, date) => {
  const { year, month, day } = dhakaParts(date);
  return format.replace(/\{(YYYY|YY|MM|MX|DD)\}/gi, (_, t) => {
    switch (t.toUpperCase()) {
      case "YYYY": return year;
      case "YY": return year.slice(-2);
      case "MM": return month;
      case "MX": return Number(month).toString(16).toUpperCase();
      case "DD": return day;
      default: return "";
    }
  });
};

const renderSerial = (scope, seq) =>
  scope.replace(SEQ_RE, (_, hex, width) => {
    const text = hex ? seq.toString(16).toUpperCase() : String(seq);
    return text.padStart(Number(width || 1), "0");
  });

// Preview of the ID a format makes, for the settings page
export const previewIdFormat = (format, seq = 1, date = new Date()) =>
  renderSerial(renderScope(String(format || "").trim(), date), seq);

// Saved formats, cached briefly since several services read them and only the dashboard writes them
let cache = { at: 0, formats: {} };
const CACHE_MS = 30_000;

export const getIdFormats = async () => {
  if (Date.now() - cache.at < CACHE_MS) return cache.formats;
  try {
    const doc = await StoreSettingsModel.findOne({ key: "default" }).select("idFormats").lean();
    cache = { at: Date.now(), formats: doc?.idFormats || {} };
  } catch {
    cache = { at: Date.now(), formats: cache.formats };
  }
  return cache.formats;
};

export const saveIdFormats = async (input = {}, userId = null) => {
  const formats = {};
  for (const key of Object.keys(input)) {
    if (!ID_TYPE_KEYS.has(key)) continue;
    const value = String(input[key] || "").trim();
    const error = validateIdFormat(value);
    if (error) throw Object.assign(new Error(`${key}: ${error}`), { statusCode: 400 });
    if (value) formats[key] = value;
  }
  await StoreSettingsModel.findOneAndUpdate(
    { key: "default" },
    { $set: { idFormats: formats, updatedBy: userId } },
    { upsert: true, setDefaultsOnInsert: true }
  );
  cache = { at: Date.now(), formats };
  return formats;
};

// One counter per type and scope (e.g. "orderShop:SH2611{SEQ:3}"), so a date token resets the serial
const idCounterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } }, { versionKey: false });
const IdCounterModel = models.IdCounter || model("IdCounter", idCounterSchema);

// Next ID for a type from its saved format, or null when none is set (the caller keeps its own numbering).
// `exists` skips IDs already taken, e.g. by records made before the format changed.
export const nextFormattedId = async (type, exists, date = new Date()) => {
  const format = (await getIdFormats())[type];
  if (!format || validateIdFormat(format)) return null;
  const scope = renderScope(format, date);
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const counter = await IdCounterModel.findOneAndUpdate(
      { _id: `${type}:${scope}` },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    ).lean();
    const id = renderSerial(scope, counter.seq);
    if (!exists || !(await exists(id))) return id;
  }
  throw new Error(`Could not find a free ${type} ID for format ${format}`);
};
