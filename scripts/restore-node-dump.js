// Restores a database dump made by the backend's in-Node fallback (*.ejson.gz).
// Usage: node scripts/restore-node-dump.js <dump.ejson.gz> <mongodb-uri> [--drop]
//   --drop  empties each collection before inserting (otherwise existing _ids are skipped)
// For *.archive.gz files use the standard tool instead: mongorestore --uri="<uri>" --archive=<file> --gzip
import fs from 'node:fs';
import zlib from 'node:zlib';
import readline from 'node:readline';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const scriptDir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const { MongoClient, BSON } = require(path.resolve(scriptDir, '../backend/node_modules/mongodb'));
const { EJSON } = BSON;

const [file, uri, ...flags] = process.argv.slice(2);
if (!file || !uri) {
  console.error('Usage: node scripts/restore-node-dump.js <dump.ejson.gz> <mongodb-uri> [--drop]');
  process.exit(1);
}
const drop = flags.includes('--drop');
const BATCH = 500;

const client = new MongoClient(uri);
await client.connect();
const db = client.db();

const pending = new Map();
const counts = {};
const flush = async (name) => {
  const docs = pending.get(name);
  if (!docs?.length) return;
  pending.set(name, []);
  try {
    await db.collection(name).insertMany(docs, { ordered: false });
  } catch (err) {
    if (err?.code !== 11000 && !err?.writeErrors) throw err; // duplicate _ids are skipped
  }
};

const lines = readline.createInterface({ input: fs.createReadStream(file).pipe(zlib.createGunzip()), crlfDelay: Infinity });
for await (const line of lines) {
  if (!line.trim()) continue;
  const entry = EJSON.parse(line, { relaxed: false });
  if (entry.type === 'collection') {
    if (drop) await db.collection(entry.name).deleteMany({});
    for (const idx of entry.indexes || []) {
      if (idx.name === '_id_') continue;
      const { key, v, ns, ...options } = idx;
      await db.collection(entry.name).createIndex(key, options).catch((e) => console.warn(`index ${entry.name}.${idx.name}: ${e.message}`));
    }
    pending.set(entry.name, []);
    counts[entry.name] = 0;
  } else if (entry.type === 'doc') {
    pending.get(entry.c).push(entry.d);
    counts[entry.c] += 1;
    if (pending.get(entry.c).length >= BATCH) await flush(entry.c);
  }
}
for (const name of pending.keys()) await flush(name);

console.log('Restored:', counts);
await client.close();
