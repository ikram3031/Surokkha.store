import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// Resolves directory paths accurately regardless of execution cwd
function getProjectRoots() {
  const cwd = process.cwd();
  let rootDir = cwd;
  if (fs.existsSync(path.join(cwd, 'frontend')) || fs.existsSync(path.join(cwd, 'backend'))) {
    rootDir = cwd;
  } else if (fs.existsSync(path.join(cwd, '..', 'frontend')) || fs.existsSync(path.join(cwd, '..', 'backend'))) {
    rootDir = path.resolve(cwd, '..');
  }
  return {
    rootDir,
    frontendDir: path.join(rootDir, 'frontend'),
    backendDir: path.join(rootDir, 'backend'),
    dashboardDir: path.join(rootDir, 'dashboard'),
  };
}

// Safely reads version from a package.json path
function readPackageVersion(pkgPath, defaultVal = '1.0.0') {
  try {
    if (fs.existsSync(pkgPath)) {
      const data = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (data.version) return data.version;
    }
  } catch (e) {}
  return defaultVal;
}

// Increments patch version (e.g. 1.0.9 -> 1.0.10) and saves to file
function bumpPatchVersion(pkgPath) {
  try {
    if (fs.existsSync(pkgPath)) {
      const data = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const parts = (data.version || '1.0.0').split('.');
      if (parts.length === 3) {
        const patchNum = parseInt(parts[2], 10);
        if (!isNaN(patchNum)) {
          parts[2] = String(patchNum + 1);
          data.version = parts.join('.');
          fs.writeFileSync(pkgPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
          return data.version;
        }
      }
    }
  } catch (e) {}
  return null;
}

async function notifyDeploy() {
  console.log('🚀 Running Surokkha Comprehensive Deployment Notification...');

  const roots = getProjectRoots();
  const shouldBump = process.argv.includes('--bump') || process.argv.includes('-b') || process.env.BUMP_VERSION === 'true';

  // 1. Resolve & bump component versions
  let frontendVersion = readPackageVersion(path.join(roots.frontendDir, 'package.json'), '1.0.10');
  if (frontendVersion === '1.0.0' || !fs.existsSync(path.join(roots.frontendDir, 'package.json'))) {
    frontendVersion = readPackageVersion(path.join(roots.rootDir, 'package.json'), '1.0.10');
  }

  let backendVersion = readPackageVersion(path.join(roots.backendDir, 'package.json'), '3.1.00');
  let dashboardVersion = readPackageVersion(path.join(roots.dashboardDir, 'package.json'), '3.05.00');
  let platformVersion = readPackageVersion(path.join(roots.rootDir, 'package.json'), frontendVersion);

  if (shouldBump) {
    const bumpedFrontend = bumpPatchVersion(path.join(roots.frontendDir, 'package.json'));
    const bumpedRoot = bumpPatchVersion(path.join(roots.rootDir, 'package.json'));
    if (bumpedFrontend) frontendVersion = bumpedFrontend;
    if (bumpedRoot) platformVersion = bumpedRoot;
    console.log(`📦 Version bumped to v${frontendVersion}`);
  }

  // 2. Gather Git & Environment Metadata
  let commitHash = 'latest';
  let commitMsg = 'Production Build';
  let commitAuthor = 'Deployment Pipeline';
  let commitTime = new Date().toISOString();

  try {
    commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    commitMsg = execSync('git log -1 --pretty=%s', { encoding: 'utf8' }).trim();
    commitAuthor = execSync('git log -1 --pretty=%an', { encoding: 'utf8' }).trim();
    commitTime = execSync('git log -1 --pretty=%cd --date=iso', { encoding: 'utf8' }).trim();
  } catch (e) {}

  const deployTimestamp = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Dhaka',
    dateStyle: 'full',
    timeStyle: 'medium'
  });

  const subject = `🚀 [Surokkha Deploy] Release v${frontendVersion} (Storefront: v${frontendVersion} | Backend: v${backendVersion} | Dashboard: v${dashboardVersion})`;
  const recipient = 'surokkha.support@gmail.com';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 20px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
    <div style="background: linear-gradient(135deg, #e11d48, #9f1239); padding: 24px 28px; text-align: center;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">Surokkha Platform Deployed</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #fecdd3;">Automated Multi-Component Release Report</p>
    </div>
    <div style="padding: 26px; color: #1e293b;">
      <div style="display: flex; gap: 8px; margin-bottom: 18px;">
        <span style="display: inline-block; background: #ecfdf5; color: #047857; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; border: 1px solid #a7f3d0;">
          ● LIVE ON PRODUCTION
        </span>
        <span style="display: inline-block; background: #eff6ff; color: #1d4ed8; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; border: 1px solid #bfdbfe;">
          RELEASE v${frontendVersion}
        </span>
      </div>

      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
        A new production release of <strong>Surokkha.store</strong> has been successfully built and deployed to VPS. All component services have been refreshed.
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Component Versions Breakdown</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 6px 0; color: #475569; font-weight: 600;">🛍️ Storefront (Frontend)</td>
            <td style="padding: 6px 0; color: #e11d48; font-weight: 800; text-align: right;">v${frontendVersion}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 6px 0; color: #475569; font-weight: 600;">⚙️ Backend Core API (Ports 5094/5096)</td>
            <td style="padding: 6px 0; color: #0284c7; font-weight: 800; text-align: right;">v${backendVersion}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 6px 0; color: #475569; font-weight: 600;">📊 Admin Dashboard</td>
            <td style="padding: 6px 0; color: #16a34a; font-weight: 800; text-align: right;">v${dashboardVersion}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #475569; font-weight: 600;">📦 Platform Release Package</td>
            <td style="padding: 6px 0; color: #7c3aed; font-weight: 800; text-align: right;">v${platformVersion}</td>
          </tr>
        </table>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin: 12px 0 20px 0; font-size: 13px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 110px;">Git Commit:</td>
          <td style="padding: 8px 0; color: #0f172a; font-family: monospace;">${commitHash} — ${commitMsg}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Author:</td>
          <td style="padding: 8px 0; color: #0f172a;">${commitAuthor}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Deploy Time:</td>
          <td style="padding: 8px 0; color: #0f172a;">${deployTimestamp}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Environment:</td>
          <td style="padding: 8px 0; color: #0f172a;">Production VPS Node 1 (14.128.14.223)</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Dispatched To:</td>
          <td style="padding: 8px 0; color: #0f172a;">${recipient}</td>
        </tr>
      </table>

      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
        <a href="https://surokkha.store" style="display: inline-block; padding: 10px 18px; background: #e11d48; color: #ffffff; border-radius: 8px; font-size: 13px; font-weight: 700; text-decoration: none;">View Live Store</a>
        &nbsp;&nbsp;
        <a href="https://admin.surokkha.store" style="display: inline-block; padding: 10px 18px; background: #f1f5f9; color: #334155; border-radius: 8px; font-size: 13px; font-weight: 700; text-decoration: none; border: 1px solid #e2e8f0;">Open Dashboard</a>
      </div>
    </div>
    <div style="padding: 14px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
      Sent from Surokkha Deployment Automation Bot &bull; support@surokkha.store
    </div>
  </div>
</body>
</html>
`;

  const textContent = `
Surokkha Platform Deployed (Release v${frontendVersion})
Live on Production: https://surokkha.store
Admin Dashboard: https://admin.surokkha.store

--- Component Versions ---
* Storefront (Frontend): v${frontendVersion}
* Backend Core API: v${backendVersion}
* Admin Dashboard: v${dashboardVersion}
* Platform Release: v${platformVersion}

Commit: ${commitHash} - ${commitMsg}
Author: ${commitAuthor}
Deploy Time: ${deployTimestamp}
Environment: Production VPS (14.128.14.223)
Recipient: ${recipient}
`;

  // 3. Send via SMTP
  try {
    const transporter = nodemailer.createTransport({
      host: 'mail.spacemail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'support@plexivia.online',
        pass: 'P@ss0265'
      },
      tls: { rejectUnauthorized: false }
    });

    const info = await transporter.sendMail({
      from: '"Surokkha Support" <support@plexivia.online>',
      replyTo: 'support@surokkha.store',
      to: recipient,
      subject: subject,
      text: textContent,
      html: htmlContent
    });
    console.log('✅ Deployment notification email sent to', recipient, 'MessageId:', info.messageId);
  } catch (smtpErr) {
    console.error('⚠️ SMTP send error:', smtpErr.message);
  }

  // 4. Ingest into MongoDB Dashboard Webmail Inbox & System Logs
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27019/surokkha-db';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });

    const db = mongoose.connection.db;
    const emailCollection = db.collection('email_messages');
    const logsCollection = db.collection('logs');

    const msgDoc = {
      did: 'mail_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      messageId: `deploy-${commitHash}-${Date.now()}@surokkha.store`,
      folder: 'INBOX',
      from: {
        name: 'Surokkha Deployment Bot',
        address: 'support@surokkha.store'
      },
      to: [
        {
          name: 'Surokkha Admin',
          address: recipient
        }
      ],
      cc: [],
      bcc: [],
      replyTo: [
        {
          name: 'Surokkha Support',
          address: 'support@surokkha.store'
        }
      ],
      subject: subject,
      snippet: `Deployment v${frontendVersion} successful (Frontend: v${frontendVersion}, Backend: v${backendVersion}, Dashboard: v${dashboardVersion}) - ${commitHash}: ${commitMsg}`,
      bodyHtml: htmlContent,
      bodyText: textContent,
      date: new Date(),
      flags: [],
      isRead: false,
      isStarred: true,
      hasAttachments: false,
      attachments: [],
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await emailCollection.insertOne(msgDoc);
    console.log('✅ Notification stored in Dashboard Webmail INBOX (ID:', msgDoc.did, ')');

    // Create system notification bell alert log
    await logsCollection.insertOne({
      did: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      type: 'deployment',
      typeDid: '110',
      description: `New Deployment v${frontendVersion} (Storefront: v${frontendVersion} | Backend: v${backendVersion} | Dashboard: v${dashboardVersion} | Commit: ${commitHash}) published to live. Email sent to ${recipient}.`,
      readStatus: false,
      active: true,
      createdBy: 'deploy-pipeline',
      updatedBy: 'deploy-pipeline',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ System notification bell alert created in Dashboard');

    await mongoose.disconnect();
  } catch (dbErr) {
    console.error('⚠️ MongoDB notification ingest error:', dbErr.message);
  }

  console.log('✨ All deployment notifications completed successfully.');
}

notifyDeploy();
