import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const ZONE_MAP = {
  "engulfic.com": "b8baf3af57594678d588a9391b3a7023",
  "engulfic": "b8baf3af57594678d588a9391b3a7023",
  "decantre.com": "532fc0163ee268da83584fe3be20e3bc",
  "decantre": "532fc0163ee268da83584fe3be20e3bc",
  "toyoland.com": "6e159fb7a28e83161c565d3ecad4e565",
  "toyoland": "6e159fb7a28e83161c565d3ecad4e565",
  "surokkha.store": "bd131177db6d610b5d4e5beb0142108b",
  "surokkha": "bd131177db6d610b5d4e5beb0142108b",
};

const resolveToken = () => {
  if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_API_TOKEN.trim()) {
    return process.env.CLOUDFLARE_API_TOKEN.trim();
  }

  // Check VPS backend.env
  const vpsEnv = "/engulfic/opt/configs/backend.env";
  if (fs.existsSync(vpsEnv)) {
    try {
      const content = fs.readFileSync(vpsEnv, "utf8");
      const match = content.match(/CLOUDFLARE_API_TOKEN=([^\r\n]+)/);
      if (match && match[1].trim()) return match[1].trim();
    } catch {}
  }

  const vaultPath = "J:\\My Drive\\CLIENTS\\Cloudflare.txt";
  if (fs.existsSync(vaultPath)) {
    try {
      const raw = fs.readFileSync(vaultPath, "utf8");
      const match = raw.match(/cfat_[A-Za-z0-9_-]+/);
      if (match) return match[0];
    } catch {}
  }

  return "";
};

export async function purgeCacheForClient(clientOrDomain = "engulfic") {
  const token = resolveToken();
  let target = clientOrDomain.toLowerCase().trim();

  // Try to resolve domain from configs if client key passed
  const configPath = path.join(rootDir, "configs", `${target}.json`);
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (config.domain) target = config.domain.toLowerCase().trim();
    } catch {}
  }

  const domain = target.replace(/^https?:\/\//, "").split("/")[0];
  console.log(`\n☁️  [Cloudflare] Purging edge cache for: ${domain}...`);

  let zoneId = ZONE_MAP[domain] || ZONE_MAP[target];

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
  const target = process.argv[2] || process.env.CLIENT || "engulfic";
  purgeCacheForClient(target).then((ok) => {
    process.exit(ok ? 0 : 1);
  });
}
