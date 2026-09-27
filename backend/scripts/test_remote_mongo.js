import mongoose from "mongoose";

async function run() {
  const uri = "mongodb://admin:11223345@144.79.218.126:27017/?authSource=admin";
  try {
    const conn = await mongoose.createConnection(uri).asPromise();
    const adminDb = conn.db.admin();
    const dbs = await adminDb.listDatabases();
    console.log("Databases on 144.79.218.126:", dbs.databases.map(d => `${d.name} (${d.sizeOnDisk} bytes)`));
    
    for (const dbInfo of dbs.databases) {
      if (['admin', 'config', 'local'].includes(dbInfo.name)) continue;
      const dbConn = conn.useDb(dbInfo.name);
      const cols = await dbConn.db.listCollections().toArray();
      const prodCol = cols.find(c => c.name === 'products');
      if (prodCol) {
        const count = await dbConn.collection('products').countDocuments();
        console.log(`DB '${dbInfo.name}' has 'products' collection with ${count} items`);
        const prods = await dbConn.collection('products').find({}).toArray();
        prods.forEach(p => console.log(`  - [${dbInfo.name}] ${p.name} (Slug: ${p.slug}, ID: ${p._id})`));
      }
    }
    await conn.close();
  } catch (err) {
    console.error("Remote Mongo Error:", err.message);
  }
}

run();
