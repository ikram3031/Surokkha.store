const updateSlugs = `
db.products.updateOne({ _id: ObjectId("6ab2c80d6fa8d45f03d4ba6f") }, { $set: { slug: "mo-dotted-condom", updatedAt: new Date() } });
db.products.updateOne({ _id: ObjectId("6ab2c80d6fa8d45f03d4ba70") }, { $set: { slug: "mo-ultra-thin-condom", updatedAt: new Date() } });
db.products.updateOne({ _id: ObjectId("6ab2c80d6fa8d45f03d4ba71") }, { $set: { slug: "mo-ultra-ribbed-condom", updatedAt: new Date() } });
print("Slugs updated successfully!");
`;

import fs from "fs";
fs.writeFileSync("d:/mtEcomWhite/backend/scripts/update_slugs.js", updateSlugs);
