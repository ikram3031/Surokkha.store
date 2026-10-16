import fs from "node:fs";
import zlib from "node:zlib";
import { once } from "node:events";
import mongoose from "mongoose";

const { EJSON } = mongoose.mongo.BSON;

// Writes the whole database to a gzipped EJSON-lines file using the app's own connection (no mongodump needed).
// Line format: {"type":"collection","name":...,"indexes":[...]} followed by {"type":"doc","c":<collection>,"d":<doc>}.
// Restore with: node scripts/restore-node-dump.js <file> <mongodb-uri>
export const dumpDatabaseToFile = async (filePath) => {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database is not connected");

  const gzip = zlib.createGzip();
  const out = fs.createWriteStream(filePath);
  gzip.pipe(out);

  const write = async (obj) => {
    if (!gzip.write(EJSON.stringify(obj, { relaxed: false }) + "\n")) await once(gzip, "drain");
  };

  let docCount = 0;
  const collections = (await db.listCollections({}, { nameOnly: true }).toArray())
    .map((c) => c.name)
    .filter((name) => !name.startsWith("system."));

  for (const name of collections) {
    const coll = db.collection(name);
    const indexes = await coll.indexes().catch(() => []);
    await write({ type: "collection", name, indexes });
    for await (const doc of coll.find({})) {
      await write({ type: "doc", c: name, d: doc });
      docCount += 1;
    }
  }

  gzip.end();
  await once(out, "finish");
  return { collections: collections.length, documents: docCount };
};
