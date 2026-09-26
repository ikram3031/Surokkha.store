import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Maps raw client identifier or numeric code to registered client key
const mapClientIdentifier = (input, clientMap, availableClients) => {
  if (!input) return null;
  const clean = input.trim().toLowerCase();
  if (clientMap.has(clean)) {
    return clientMap.get(clean);
  }
  if (availableClients.includes(clean)) {
    return clean;
  }
  return null;
};

// Resolves target client key from CLI args, env vars, marker file, hostname, or VPS directories
const resolveClientKey = () => {
  const configsDir = path.join(rootDir, "configs");
  const clientMap = new Map();
  const availableClients = [];

  if (fs.existsSync(configsDir)) {
    fs.readdirSync(configsDir)
      .filter((file) => file.endsWith(".json"))
      .forEach((file) => {
        const key = path.basename(file, ".json").toLowerCase();
        availableClients.push(key);
        try {
          const content = JSON.parse(fs.readFileSync(path.join(configsDir, file), "utf8"));
          if (content.clientId) {
            const rawId = String(content.clientId).trim().toLowerCase();
            clientMap.set(rawId, key);
            const num = parseInt(rawId, 10);
            if (!isNaN(num)) {
              clientMap.set(String(num), key);
            }
          }
          if (content.clientKey) {
            clientMap.set(String(content.clientKey).trim().toLowerCase(), key);
          }
        } catch {}
      });
  }

  const argClient = process.argv[2]?.toLowerCase()?.trim();
  if (argClient && argClient !== "--detect-only" && !argClient.startsWith("-")) {
    const mapped = mapClientIdentifier(argClient, clientMap, availableClients);
    return mapped || argClient;
  }

  const envClient = process.env.CLIENT?.toLowerCase()?.trim() || process.env.CLIENT_NAME?.toLowerCase()?.trim();
  if (envClient) {
    const mapped = mapClientIdentifier(envClient, clientMap, availableClients);
    return mapped || envClient;
  }

  const clientMarkerPath = path.join(rootDir, ".client");
  if (fs.existsSync(clientMarkerPath)) {
    const fileContent = fs.readFileSync(clientMarkerPath, "utf8").trim().toLowerCase();
    if (fileContent) {
      const mapped = mapClientIdentifier(fileContent, clientMap, availableClients);
      return mapped || fileContent;
    }
  }

  const hostname = os.hostname().toLowerCase();
  const matchedHost = availableClients.find((client) => hostname.includes(client));
  if (matchedHost) {
    return matchedHost;
  }

  const vpsConfigs = availableClients.filter((client) =>
    fs.existsSync(`/opt/${client}/configs/backend.env`) || fs.existsSync(`/opt/${client}/configs`)
  );
  if (vpsConfigs.length === 1) {
    return vpsConfigs[0];
  }

  return "decantre";
};

// Copies unified client config to backend and dashboard active targets
const syncClientConfig = () => {
  const isDetectOnly = process.argv.includes("--detect-only");
  const clientKey = resolveClientKey();

  if (isDetectOnly) {
    process.stdout.write(clientKey);
    process.exit(0);
  }

  const sourceConfigPath = path.join(rootDir, "configs", `${clientKey}.json`);

  if (!fs.existsSync(sourceConfigPath)) {
    console.error(`❌ Error: Source config not found for client [${clientKey}] at: ${sourceConfigPath}`);
    process.exit(1);
  }

  const rawConfig = fs.readFileSync(sourceConfigPath, "utf8");
  const parsed = JSON.parse(rawConfig);

  const backendConfigTarget = path.join(rootDir, "backend", "src", "common", "config", "config.client.json");
  const backendActiveTarget = path.join(rootDir, "backend", "src", "common", "config", "activeClient.json");
  const dashboardActiveTarget = path.join(rootDir, "dashboard", "src", "clientConfig", "activeConfig.json");

  [backendConfigTarget, backendActiveTarget, dashboardActiveTarget].forEach((tgt) => {
    const dir = path.dirname(tgt);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  fs.writeFileSync(backendConfigTarget, JSON.stringify(parsed, null, 2), "utf8");
  fs.writeFileSync(backendActiveTarget, JSON.stringify(parsed, null, 2), "utf8");
  fs.writeFileSync(dashboardActiveTarget, JSON.stringify(parsed, null, 2), "utf8");

  const allClientsTarget = path.join(rootDir, "backend", "src", "common", "config", "allClients.json");
  const allConfigs = {};
  const configsDir = path.join(rootDir, "configs");
  if (fs.existsSync(configsDir)) {
    fs.readdirSync(configsDir)
      .filter((file) => file.endsWith(".json"))
      .forEach((file) => {
        try {
          const key = path.basename(file, ".json").toLowerCase();
          allConfigs[key] = JSON.parse(fs.readFileSync(path.join(configsDir, file), "utf8"));
        } catch {}
      });
    fs.writeFileSync(allClientsTarget, JSON.stringify(allConfigs, null, 2), "utf8");
  }

  console.log(`✨ Successfully synced configuration for client: [${parsed.brandName} (${clientKey})]`);
  console.log(`   ├─ Stock Policy:   ${parsed.policies?.stock?.mode || "N/A"}`);
  console.log(`   ├─ Pricing Policy: ${parsed.policies?.pricing?.mode || "N/A"}`);
  console.log(`   ├─ Backend:        ${backendActiveTarget}`);
  console.log(`   └─ Dashboard:      ${dashboardActiveTarget}`);
};

syncClientConfig();
