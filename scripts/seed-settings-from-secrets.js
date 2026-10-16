// Copies credentials from a local, git-ignored secrets file into the storesettings collection.
// Only fills fields that are empty in the database, so values already saved from the dashboard are never overwritten.
// Usage (from the repo root, with MONGODB_URI set or backend/.env present):
//   node scripts/seed-settings-from-secrets.js configs/secrets/surokkha.secrets.json [--force]
//   --force  overwrite existing database values too
import fs from 'node:fs';
import path from 'node:path';

const scriptDir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const backendSrc = path.resolve(scriptDir, '../backend/src');
const toUrl = (p) => new URL(`file:///${p.replace(/\\/g, '/').replace(/^\//, '')}`).href;

const [file, ...flags] = process.argv.slice(2);
if (!file || !fs.existsSync(file)) {
  console.error('Usage: node scripts/seed-settings-from-secrets.js <secrets.json> [--force]');
  process.exit(1);
}
const force = flags.includes('--force');
const secrets = JSON.parse(fs.readFileSync(file, 'utf8'));

process.chdir(path.resolve(backendSrc, '..')); // so backend/.env is picked up
const { default: mongoose } = await import(toUrl(path.resolve(backendSrc, '../node_modules/mongoose/index.js')));
const { env } = await import(toUrl(path.join(backendSrc, 'common/config/env.js')));
const { StoreSettingsModel } = await import(toUrl(path.join(backendSrc, 'common/models/storeSettings.model.js')));
const { encryptText } = await import(toUrl(path.join(backendSrc, 'common/utils/crypto.util.js')));

await mongoose.connect(process.env.MONGODB_URI || env.MONGODB_URI);
const doc = (await StoreSettingsModel.findOne({ key: 'default' }).lean()) || {};
const get = (obj, dotted) => dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

const $set = {};
const filled = [];
const put = (dotted, value) => {
  if (value === undefined || value === null || value === '') return;
  const current = get(doc, dotted);
  const isEmpty = current === undefined || current === null || current === '' || (Array.isArray(current) && current.length === 0);
  if (!isEmpty && !force) return;
  $set[dotted] = value;
  filled.push(dotted);
};

const meta = (prefix, m) => {
  if (!m) return;
  put(`${prefix}.pixelId`, m.pixelId);
  put(`${prefix}.accessToken`, m.accessToken);
  for (const flag of ['isEnabled', 'enableBrowserPixel', 'enableCapi', 'advancedMatching']) {
    if (typeof m[flag] === 'boolean') put(`${prefix}.${flag}`, m[flag]);
  }
};
meta('metaPixel', secrets.metaPixel);
for (const [site, cfg] of Object.entries(secrets.sites || {})) meta(`sites.${site}.metaPixel`, cfg?.metaPixel);

const cf = secrets.cloudflare || {};
if (cf.apiToken) put('cloudflare.apiToken', encryptText(cf.apiToken));
put('cloudflare.zoneId', cf.zoneId || secrets.cloudFlareAnalytics?.zoneId);
put('cloudflare.accountEmail', secrets.cloudFlareAnalytics?.accountEmail);
if (typeof cf.isEnabled === 'boolean') put('cloudflare.isEnabled', cf.isEnabled);
put('cloudflare.zones', secrets.cloudflareZones);

const r2 = secrets.r2Storage || {};
put('r2Storage.accountId', r2.accountId);
put('r2Storage.accessKeyId', r2.accessKeyId);
if (r2.secretAccessKey) put('r2Storage.secretAccessKey', encryptText(r2.secretAccessKey));
put('r2Storage.bucketName', r2.bucketName);
put('r2Storage.publicUrl', r2.publicUrl);
put('r2Storage.backupCron', r2.backupCron);
put('r2Storage.backupTimezone', r2.backupTimezone);
for (const k of ['keepDailyDays', 'keepWeeklyWeeks']) if (Number.isFinite(r2[k])) put(`r2Storage.${k}`, r2[k]);
// switches: the schema defaults them, so set them whenever R2 credentials are being filled in
if (r2.accessKeyId && (force || !get(doc, 'r2Storage.accessKeyId'))) {
  if (typeof r2.isEnabled === 'boolean') { $set['r2Storage.isEnabled'] = r2.isEnabled; filled.push('r2Storage.isEnabled'); }
  if (typeof r2.backupEnabled === 'boolean') { $set['r2Storage.backupEnabled'] = r2.backupEnabled; filled.push('r2Storage.backupEnabled'); }
}

const ga = secrets.googleAnalytics || secrets.dashboardClientConfig?.googleAnalytics || {};
for (const k of ['measurementId', 'gtmId', 'propertyId', 'streamName']) put(`googleAnalytics.${k}`, ga[k]);

if (filled.length === 0) {
  console.log('Nothing to do: every field already has a value in the database (use --force to overwrite).');
} else {
  await StoreSettingsModel.updateOne({ key: 'default' }, { $set }, { upsert: true });
  console.log(`Filled ${filled.length} field(s):\n  ${filled.join('\n  ')}`);
}
await mongoose.disconnect();
