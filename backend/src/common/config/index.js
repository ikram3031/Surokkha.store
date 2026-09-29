import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Reads and parses JSON file safely with fallback
const readJson = (fileNameOrPath) => {
  try {
    if (!fileNameOrPath) return {};
    const filePath = path.isAbsolute(fileNameOrPath)
      ? fileNameOrPath
      : path.resolve(__dirname, fileNameOrPath);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (error) {
    console.error(`Failed to load config: ${fileNameOrPath}`, error);
  }
  return {};
};

const coreConfig = readJson("config.core.json");
const allClients = readJson("allClients.json");
const activeClientConfig = readJson("activeClient.json");
const fallbackClientConfig = readJson("config.client.json");

const customConfigPath = process.env.CLIENT_CONFIG_PATH;
const customClientConfig = customConfigPath ? readJson(customConfigPath) : {};

const clientKey = (process.env.CLIENT_NAME || "").toLowerCase().trim();
const namedClientConfig = (clientKey && allClients[clientKey]) ? allClients[clientKey] : {};

let clientData = fallbackClientConfig;
if (Object.keys(customClientConfig).length > 0) {
  clientData = customClientConfig;
} else if (Object.keys(namedClientConfig).length > 0) {
  clientData = namedClientConfig;
} else if (Object.keys(activeClientConfig).length > 0) {
  clientData = activeClientConfig;
}

export const config = {
  ...coreConfig,
  ...clientData,
};

// Safely gets nested policy value from client config
export const getClientPolicy = (policyPath, defaultValue = null) => {
  const parts = policyPath.split(".");
  let current = config.policies;
  for (const part of parts) {
    if (current === undefined || current === null) return defaultValue;
    current = current[part];
  }
  return current !== undefined ? current : defaultValue;
};

export { getDynamicCorsConfig } from "./corsOrigins.js";
