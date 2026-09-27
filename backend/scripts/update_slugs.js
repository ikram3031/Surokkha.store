
db.products.updateOne({ _id: ObjectId("6ab2c80d6fa8d45f03d4ba6f") }, { $set: { slug: "mo-dotted-condom", updatedAt: new Date() } });
db.products.updateOne({ _id: ObjectId("6ab2c80d6fa8d45f03d4ba70") }, { $set: { slug: "mo-ultra-thin-condom", updatedAt: new Date() } });
db.products.updateOne({ _id: ObjectId("6ab2c80d6fa8d45f03d4ba71") }, { $set: { slug: "mo-ultra-ribbed-condom", updatedAt: new Date() } });
print("Slugs updated successfully!");
