import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to parse simple key-value .env files without external dependencies
function loadEnv(envPath) {
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...vals] = trimmed.split('=');
        const val = vals.join('=').trim().replace(/^["']|["']$/g, '');
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = val;
        }
      }
    });
  }
}

// Load .env if present
loadEnv(path.join(__dirname, '../../.env'));
loadEnv(path.join(__dirname, '../../../.env'));

export const config = {
  host: process.env.DEPLOY_SERVER_IP || '14.128.14.223',
  user: process.env.DEPLOY_SERVER_USER || 'root',
  deployPath: process.env.DEPLOY_PATH || '/opt/clients/surokkha-mtEcom'
};
