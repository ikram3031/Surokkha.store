/*
Usage:
  Set env vars as needed and run:
    MONGO_URI (default: mongodb://localhost:27017)
    DB_NAME (default: test)
    COLLECTION_NAME (default: products)

  Example:
    MONGO_URI="mongodb://localhost:27017" DB_NAME=mydb node check-img-urls.js
*/

import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'test';
const COLL = process.env.COLLECTION_NAME || 'products';

async function main() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const col = db.collection(COLL);

    const cursor = col.find({}, { projection: { imgUrl: 1 } });

    let total = 0;
    let srcCount = 0;
    let uploadCount = 0;
    let otherCount = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      total++;
      const v = doc && doc.imgUrl;

      // handle string or array
      if (Array.isArray(v)) {
        // if any of the urls in array start with the prefix, count the doc once per prefix
        const joined = v.join(' ');
        if (joined.startsWith('/src') || v.some(x => typeof x === 'string' && x.startsWith('/src'))) srcCount++;
        else if (joined.startsWith('/upload') || v.some(x => typeof x === 'string' && x.startsWith('/upload'))) uploadCount++;
        else otherCount++;
      } else if (typeof v === 'string') {
        if (v.startsWith('/src')) srcCount++;
        else if (v.startsWith('/upload')) uploadCount++;
        else otherCount++;
      } else {
        otherCount++;
      }
    }

    console.log('Results for collection:', COLL, 'in DB:', DB_NAME);
    console.log('Total documents scanned:', total);
    console.log('Starts with /src:', srcCount);
    console.log('Starts with /upload:', uploadCount);
    console.log('Other / missing imgUrl:', otherCount);

  } catch (err) {
    console.error('Error:', err);
    process.exitCode = 2;
  } finally {
    await client.close();
  }
}

main();
