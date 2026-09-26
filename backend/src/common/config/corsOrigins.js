import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Normalizes URL string to pure hostname and variations
const buildUrlVariations = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") return [];
  const cleaned = rawUrl.trim().replace(/\/+$/, "");
  const variations = new Set();

  try {
    const urlObj = cleaned.startsWith("http://") || cleaned.startsWith("https://")
      ? new URL(cleaned)
      : new URL(`https://${cleaned}`);

    const host = urlObj.hostname.toLowerCase();
    const port = urlObj.port ? `:${urlObj.port}` : "";

    variations.add(`https://${host}${port}`);
    variations.add(`http://${host}${port}`);

    if (host.startsWith("www.")) {
      const nonWww = host.slice(4);
      variations.add(`https://${nonWww}${port}`);
      variations.add(`http://${nonWww}${port}`);
    } else if (!host.includes("localhost") && !host.startsWith("127.")) {
      variations.add(`https://www.${host}${port}`);
      variations.add(`http://www.${host}${port}`);
    }
  } catch {
    variations.add(cleaned);
  }

  return Array.from(variations);
};

// Extracts root domain identifier keyword from hostname or client key
const extractDomainKeyword = (domainOrUrl) => {
  if (!domainOrUrl || typeof domainOrUrl !== "string") return null;
  try {
    const cleaned = domainOrUrl.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
    const host = cleaned.split(":")[0];
    const parts = host.split(".");
    if (parts.length >= 2) {
      return parts[parts.length - 2].toLowerCase();
    }
    return host.toLowerCase();
  } catch {
    return null;
  }
};

// Gathers all client configs from filesystem, bundled json, and active config
const loadAllClientConfigs = () => {
  const configs = [];
  const addedKeys = new Set();

  const activePath = path.resolve(__dirname, "activeClient.json");
  const fallbackPath = path.resolve(__dirname, "config.client.json");
  const bundledPath = path.resolve(__dirname, "allClients.json");

  [activePath, fallbackPath].forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        if (data?.clientKey && !addedKeys.has(data.clientKey)) {
          configs.push(data);
          addedKeys.add(data.clientKey);
        }
      } catch {}
    }
  });

  if (fs.existsSync(bundledPath)) {
    try {
      const bundled = JSON.parse(fs.readFileSync(bundledPath, "utf8"));
      Object.values(bundled).forEach((data) => {
        if (data?.clientKey && !addedKeys.has(data.clientKey)) {
          configs.push(data);
          addedKeys.add(data.clientKey);
        }
      });
    } catch {}
  }

  const possibleConfigsDirs = [
    path.resolve(__dirname, "../../../configs"),
    path.resolve(process.cwd(), "configs"),
    path.resolve(process.cwd(), "../configs"),
  ];

  for (const dir of possibleConfigsDirs) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
        for (const file of files) {
          try {
            const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
            if (data?.clientKey && !addedKeys.has(data.clientKey)) {
              configs.push(data);
              addedKeys.add(data.clientKey);
            }
          } catch {}
        }
        break;
      } catch {}
    }
  }

  return configs;
};

// Builds dynamic CORS origins and domain keywords from all registered tenant configs
export const getDynamicCorsConfig = (envAllowedOrigins = "") => {
  const clientConfigs = loadAllClientConfigs();
  const origins = new Set();
  const keywords = new Set(["localhost", "127.0.0.1"]);

  const localOrigins = [
    "http://localhost:8001",
    "http://localhost:8005",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:8001",
    "http://127.0.0.1:8005",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
  ];
  localOrigins.forEach((o) => origins.add(o));

  clientConfigs.forEach((cfg) => {
    if (cfg.clientKey) {
      keywords.add(cfg.clientKey.toLowerCase());
    }

    const domain = cfg.domain;
    if (domain) {
      buildUrlVariations(domain).forEach((v) => origins.add(v));
      const kw = extractDomainKeyword(domain);
      if (kw) keywords.add(kw);

      const standardSubdomains = ["admin", "dashboard", "server", "api", "service", "store", "v2"];
      standardSubdomains.forEach((sub) => {
        origins.add(`https://${sub}.${domain}`);
        origins.add(`http://${sub}.${domain}`);
      });
    }

    [cfg.storefrontUrl, cfg.dashboardUrl, cfg.apiBaseUrl].forEach((url) => {
      if (url) {
        buildUrlVariations(url).forEach((v) => origins.add(v));
        const kw = extractDomainKeyword(url);
        if (kw) keywords.add(kw);
      }
    });
  });

  if (envAllowedOrigins) {
    envAllowedOrigins
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean)
      .forEach((o) => {
        origins.add(o);
        const kw = extractDomainKeyword(o);
        if (kw) keywords.add(kw);
      });
  }

  return {
    allowedOrigins: Array.from(origins),
    clientKeywords: Array.from(keywords),
  };
};
