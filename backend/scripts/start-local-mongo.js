import { MongoMemoryServer } from "mongodb-memory-server";
import fs from "fs";
import path from "path";

const dbDir = path.resolve("./data/db");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log("Starting local MongoDB instance on port 27017...");

try {
  const mongod = await MongoMemoryServer.create({
    binary: {
      version: "7.0.14",
    },
    instance: {
      port: 27017,
      dbPath: dbDir,
      storageEngine: "wiredTiger",
    },
  });

  const uri = mongod.getUri();
  console.log(`✅ Local MongoDB running at: ${uri}`);
  console.log(`📁 Persistent data directory: ${dbDir}`);

  process.on("SIGINT", async () => {
    console.log("Stopping MongoDB server...");
    await mongod.stop();
    process.exit(0);
  });
} catch (err) {
  console.error("❌ Failed to start local MongoDB:", err.message);
  process.exit(1);
}
