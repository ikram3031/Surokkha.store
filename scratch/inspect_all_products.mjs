import { mongoose } from "./backend/src/common/config/db.js";

// Script to inspect live database products
const script = `
import { connectDB, mongoose } from '/opt/clients/surokkha-mtEcom/backend/src/common/config/db.js';

async function run() {
  await connectDB();
  const products = await mongoose.connection.db.collection('products').find({}).toArray();
  console.log('TOTAL PRODUCTS:', products.length);
  for (const p of products) {
    console.log({
      id: p._id.toString(),
      did: p.did,
      brand: p.brand,
      slug: p.slug,
      name: p.name,
      title: p.title,
      name_bn: p.name_bn || p.data_bn?.name,
      category: p.category,
      hasCondomInName: /condom|কনডম/i.test(p.name || '') || /condom|কনডম/i.test(p.title || '') || /condom|কনডম/i.test(p.name_bn || '') || /condom|কনডম/i.test(p.data_bn?.name || ''),
      hasCondomInSlug: /condom/i.test(p.slug || ''),
      hasCondomInDesc: /condom|কনডম/i.test(p.description || '') || /condom|কনডম/i.test(p.longDescription || '') || /condom|কনডম/i.test(p.data_bn?.description || '')
    });
  }
  process.exit(0);
}
run();
`;

console.log(script);
