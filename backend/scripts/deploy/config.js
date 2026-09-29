import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the root .env of backend
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  host: process.env.DEPLOY_SERVER_IP || '144.79.218.126',
  user: process.env.DEPLOY_SERVER_USER || 'root',
  deployPath: '/opt/dev'
};
