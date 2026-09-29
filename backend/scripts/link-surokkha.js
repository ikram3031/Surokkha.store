import mongoose from "mongoose";

const run = async () => {
  await mongoose.connect("mongodb://127.0.0.1:27019/surokkha-db");
  const db = mongoose.connection.db;
  const billings = db.collection("billings");

  const webId = new mongoose.Types.ObjectId("6aba270bd23835a48de019ef");
  const packagingId = new mongoose.Types.ObjectId("6aba4108fed34ee83d92e17e");
  const transportId = new mongoose.Types.ObjectId("6aba59d8fed34ee83d92e260");
  const metaAdsId = new mongoose.Types.ObjectId("6aba5a3bfed34ee83d92e298");

  // Update Web bills
  const r1 = await billings.updateOne({ did: "84c503686dd5f637" }, { $set: { billTypeId: webId } });
  const r2 = await billings.updateOne({ did: "820c39d4ba300258" }, { $set: { billTypeId: webId } });

  // Update Packaging bills
  const r3 = await billings.updateOne({ did: "17d0bae9a361d769" }, { $set: { billTypeId: packagingId } });

  // Update Transportation bills
  const r4 = await billings.updateOne({ did: "08e8f6adc87ef7bb" }, { $set: { billTypeId: transportId } });

  // Update Meta Ads bills
  const r5 = await billings.updateOne({ did: "6361110f482f4977" }, { $set: { billTypeId: metaAdsId } });

  console.log("Updated counts:", { domain: r1.modifiedCount, googleAI: r2.modifiedCount, tape: r3.modifiedCount, receive: r4.modifiedCount, ads: r5.modifiedCount });

  // Verify aggregation
  const allTypes = await db.collection("billtypes").find({}).toArray();
  for (const bt of allTypes) {
    const linked = await billings.find({ billTypeId: bt._id }).toArray();
    const sum = linked.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    console.log(`Category: ${bt.name} -> ${linked.length} bills, Total: ৳${sum}`);
  }

  await mongoose.disconnect();
};

run().catch(console.error);
