// Shared rules for documents attached to bills and payments (stored under uploads/docs/<kind>/<YYMM>/)
export const ATTACHMENT_KINDS = ["bills", "payments"];
export const ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;
export const ATTACHMENT_MAX_COUNT = 10;

// SVG/HTML are left out on purpose: they are served from /uploads and could run scripts
export const ATTACHMENT_EXTENSIONS = [
  "jpg", "jpeg", "png", "webp", "gif", "heic",
  "pdf", "doc", "docx", "xls", "xlsx", "csv", "txt", "ppt", "pptx",
];

// Keeps only attachments that point inside this record type's docs folder
export const normalizeAttachments = (list, kind) => {
  if (!Array.isArray(list)) return [];
  const prefix = `/uploads/docs/${kind}/`;
  return list
    .filter((item) => item && typeof item.url === "string" && item.url.startsWith(prefix) && !item.url.includes(".."))
    .slice(0, ATTACHMENT_MAX_COUNT)
    .map((item) => ({
      name: String(item.name || "").trim().slice(0, 200),
      url: item.url,
      size: Math.max(0, Number(item.size) || 0),
      mimeType: String(item.mimeType || "").trim().slice(0, 100),
    }));
};
