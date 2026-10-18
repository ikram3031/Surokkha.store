import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const ALGORITHM = "aes-256-cbc";

const decryptText = (text, secret = process.env.ACCESS_TOKEN_SECRET) => {
  if (!text) return "";
  const textParts = text.split(":");
  if (textParts.length !== 2) return text; // Probably unencrypted plain text

  try {
    const encKeySecret = secret || "default_fallback_secret_must_be_long_enough";
    const key = crypto.createHash("sha256").update(String(encKeySecret)).digest("base64").substr(0, 32);
    const iv = Buffer.from(textParts[0], "hex");
    const encryptedText = Buffer.from(textParts[1], "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    return text;
  }
};

// Zone IDs are not kept in the repo: pass them as JSON, e.g. CF_ZONE_MAP='{"surokkha.store":"<zone id>"}'
const ZONE_MAP = (() => {
  try {
    return JSON.parse(process.env.CF_ZONE_MAP || '{}');
  } catch {
    console.error('CF_ZONE_MAP is not valid JSON');
    return {};
  }
})();

const resolveToken = (target) => {
  if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_API_TOKEN.trim()) {
    return decryptText(process.env.CLOUDFLARE_API_TOKEN.trim());
  }

  // Try reading client config
  const possiblePaths = [
    path.join(rootDir, "configs", `${target}.json`),
    path.join(rootDir, "backend", "src", "common", "config", "activeClient.json"),
    path.join(rootDir, "backend", "src", "common", "config", "config.client.json"),
  ];

  for (const cfgPath of possiblePaths) {
    if (fs.existsSync(cfgPath)) {
      try {
        const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
        if (cfg.cloudflare?.apiToken) {
          const dec = decryptText(cfg.cloudflare.apiToken.trim());
          if (dec) return dec;
        }
      } catch {}
    }
  }

  return "";
};

export async function purgeCacheForClient(clientOrDomain = "demo") {
  let target = clientOrDomain.toLowerCase().trim();
  let zoneId = "";
  let resolvedDomain = target;

  // Try to resolve domain & zoneId from configs if client key passed
  const configPath = path.join(rootDir, "configs", `${target}.json`);
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (config.domain) resolvedDomain = config.domain.toLowerCase().trim();
      if (config.cloudflare?.zoneId) zoneId = config.cloudflare.zoneId.trim();
    } catch {}
  }

  const token = resolveToken(target);
  const domain = resolvedDomain.replace(/^https?:\/\//, "").split("/")[0];
  console.log(`\n☁️  [Cloudflare] Purging edge cache for: ${domain}...`);

  if (!zoneId) {
    zoneId = ZONE_MAP[domain] || ZONE_MAP[target];
  }

  if (!token) {
    console.warn(`[Cloudflare Warning] No Cloudflare API Token resolved. Skipping Cloudflare purge.`);
    return false;
  }

  if (!zoneId) {
    try {
      const lookupRes = await fetch(`https://api.cloudflare.com/client/v4/zones?name=${domain}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const lookupData = await lookupRes.json();
      if (lookupData.success && lookupData.result?.length > 0) {
        zoneId = lookupData.result[0].id;
      }
    } catch (err) {
      console.warn(`[Cloudflare] Dynamic lookup failed for ${domain}:`, err.message);
    }
  }

  if (!zoneId) {
    console.warn(`[Cloudflare Warning] No active Zone ID found for "${domain}". Skipping Cloudflare purge.`);
    return false;
  }

  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ purge_everything: true })
    });

    const data = await res.json();
    if (data.success) {
      console.log(`✓ [Cloudflare] All cached edge assets purged for ${domain} (Zone: ${zoneId})`);
      return true;
    } else {
      console.error(`❌ [Cloudflare Error] Purge failed:`, JSON.stringify(data.errors));
      return false;
    }
  } catch (err) {
    console.error(`❌ [Cloudflare Error] Request failed:`, err.message);
    return false;
  }
}

const isDirectRun = process.argv[1] && (process.argv[1].endsWith("purge-cf.js") || process.argv[1].endsWith("purge-cf.mjs"));
if (isDirectRun) {
  const target = process.argv[2] || process.env.CLIENT || "demo";
  purgeCacheForClient(target).then((ok) => {
    process.exitCode = ok ? 0 : 1;
  });
}
