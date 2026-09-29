import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: "./.env" });

async function main() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
  const conn = await mongoose.createConnection(uri).asPromise();
  const adminDb = conn.db.admin();
  const dbs = await adminDb.listDatabases();
  console.log("Databases on server:", dbs.databases.map(d => `${d.name} (${d.sizeOnDisk} bytes)`));

  for (const dbInfo of dbs.databases) {
    if (['admin', 'config', 'local'].includes(dbInfo.name)) continue;
    const dbConn = conn.useDb(dbInfo.name);
    const cols = await dbConn.db.listCollections().toArray();
    const prodCol = cols.find(c => c.name === 'products');
    if (prodCol) {
      const count = await dbConn.collection('products').countDocuments();
      console.log(`DB '${dbInfo.name}' has 'products' collection with ${count} items`);
      if (count > 0 && count <= 20) {
        const prods = await dbConn.collection('products').find({}).toArray();
        prods.forEach(p => console.log(`  - [${dbInfo.name}] ${p.name} (Slug: ${p.slug})`));
      }
    }
  }

  await conn.close();
}

main().catch(console.error);
