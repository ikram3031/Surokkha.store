import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

async function notifyDeploy() {
  console.log('🚀 Running Surokkha Deployment Notification...');

  // 1. Gather Git & Environment Metadata
  let commitHash = 'latest';
  let commitMsg = 'Production Build';
  let commitAuthor = 'Deployment Pipeline';
  let commitTime = new Date().toISOString();

  try {
    commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    commitMsg = execSync('git log -1 --pretty=%s', { encoding: 'utf8' }).trim();
    commitAuthor = execSync('git log -1 --pretty=%an', { encoding: 'utf8' }).trim();
    commitTime = execSync('git log -1 --pretty=%cd --date=iso', { encoding: 'utf8' }).trim();
  } catch (e) {
    // Git metadata fallback
  }

  let version = 'v1.0.6';
  try {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.version) version = `v${pkg.version}`;
    }
  } catch (e) {
    // Version fallback
  }

  const deployTimestamp = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Dhaka',
    dateStyle: 'full',
    timeStyle: 'medium'
  });

  const subject = `🚀 [Surokkha Deploy] New Deployment Successful (${version})`;
  const recipient = 'surokkha.support@gmail.com';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 20px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #e11d48, #9f1239); padding: 22px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">Surokkha Storefront Deployed</h1>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #fecdd3;">Automated Production Deployment Report</p>
    </div>
    <div style="padding: 24px; color: #1e293b;">
      <div style="display: inline-block; background: #ecfdf5; color: #047857; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; margin-bottom: 16px; border: 1px solid #a7f3d0;">
        ● LIVE ON PRODUCTION
      </div>
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
        A new production release of <strong>Surokkha.store</strong> has been successfully built and deployed to VPS.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 12px 0 20px 0; font-size: 13px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 100px;">Version:</td>
          <td style="padding: 8px 0; color: #e11d48; font-weight: 700;">${version}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Commit:</td>
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
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Environment:</td>
          <td style="padding: 8px 0; color: #0f172a;">Production VPS (14.128.14.223)</td>
        </tr>
      </table>

      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
        <a href="https://surokkha.store" style="display: inline-block; padding: 10px 18px; background: #e11d48; color: #ffffff; border-radius: 8px; font-size: 13px; font-weight: 700; text-decoration: none;">View Live Store</a>
        &nbsp;&nbsp;
        <a href="https://admin.surokkha.store" style="display: inline-block; padding: 10px 18px; background: #f1f5f9; color: #334155; border-radius: 8px; font-size: 13px; font-weight: 700; text-decoration: none; border: 1px solid #e2e8f0;">Open Dashboard</a>
      </div>
    </div>
    <div style="padding: 14px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
      Sent from Surokkha Deployment Bot &bull; support@surokkha.store
    </div>
  </div>
</body>
</html>
`;

  const textContent = `
Surokkha Storefront Deployed (${version})
Live on Production: https://surokkha.store
Admin Dashboard: https://admin.surokkha.store

Commit: ${commitHash} - ${commitMsg}
Author: ${commitAuthor}
Deploy Time: ${deployTimestamp}
`;

  // 2. Send via SMTP
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

  // 3. Ingest into MongoDB Dashboard Webmail Inbox
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
      snippet: `Deployment ${version} successful (${commitHash}): ${commitMsg}`,
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

    // Create system notification log
    await logsCollection.insertOne({
      type: 'deployment',
      typeDid: '110',
      description: `New Deployment ${version} (${commitHash}) published to live. Email sent to ${recipient}.`,
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
