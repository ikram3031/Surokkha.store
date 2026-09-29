import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function downloadLogo() {
  const url = "https://decantrebd.com/wp-content/uploads/2026/03/decantre-color-logo-transparent.webp";
  const destDir = path.join(__dirname, "../../src/common/assets");
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  const destPath = path.join(destDir, "logo.webp");
  console.log(`Downloading logo from ${url} to ${destPath}...`);
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch logo: ${res.statusText}`);
  }
  
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buffer));
  console.log("Download complete!");
}

downloadLogo().catch(console.error);
