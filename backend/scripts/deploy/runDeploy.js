import { execSync } from 'child_process';
import { config } from './config.js';

export function runDeployCommand(target, makeCommand) {
  if (config.host === 'your_server_ip_here') {
    console.error('Error: Please set DEPLOY_SERVER_IP in your backend/.env file');
    process.exit(1);
  }

  console.log(`\n🚀 Starting deployment for: ${target}...`);
  console.log(`🔗 Connecting to ${config.user}@${config.host}...`);
  
  try {
    const sshCommand = `ssh root@${config.host} "cd ${config.deployPath} && ${makeCommand}"`;
    execSync(sshCommand, { stdio: 'inherit' });
    console.log(`✅ Deployment for ${target} completed successfully!\n`);
  } catch (error) {
    console.error(`❌ Deployment for ${target} failed!`);
    console.error(error.message);
    process.exit(1);
  }
}
