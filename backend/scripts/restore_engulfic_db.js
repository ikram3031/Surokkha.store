// Automated database restoration and seed script for Engulfic (ESM)
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hashPassword } from '../src/common/utils/password.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseObjectId = (val) => {
  if (!val) return null;
  if (val instanceof mongoose.Types.ObjectId) return val;
  if (typeof val === 'string' && mongoose.Types.ObjectId.isValid(val)) {
    return new mongoose.Types.ObjectId(val);
  }
  if (typeof val === 'object' && val._id) {
    return parseObjectId(val._id);
  }
  return null;
};

const restoreEngulfic = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:engulfic_pass_2026@engulfic-mongodb-live:27017/engulfic-db?authSource=admin';
  console.log('Connecting to MongoDB...');
  
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');
    
    const db = mongoose.connection.db;

    // 1. Restore Categories
    const categoriesFile = path.join(__dirname, '../data/engulfic_categories.json');
    if (fs.existsSync(categoriesFile)) {
      const raw = JSON.parse(fs.readFileSync(categoriesFile, 'utf8'));
      const catList = raw.data || raw;
      if (Array.isArray(catList) && catList.length > 0) {
        console.log(`Seeding ${catList.length} categories...`);
        const catCol = db.collection('categories');
        await catCol.deleteMany({});
        const docs = catList.map(c => {
          const doc = { ...c };
          if (doc._id) doc._id = parseObjectId(doc._id) || new mongoose.Types.ObjectId();
          if (doc.parent) {
            doc.parent = parseObjectId(doc.parent);
          } else {
            doc.parent = null;
          }
          if (doc.createdBy) doc.createdBy = parseObjectId(doc.createdBy);
          if (doc.updatedBy) doc.updatedBy = parseObjectId(doc.updatedBy);
          doc.createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
          doc.updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : new Date();
          return doc;
        });
        await catCol.insertMany(docs);
        console.log('✅ Categories restored successfully.');
      }
    }

    // 2. Restore Products
    const productsFile = path.join(__dirname, '../data/engulfic_products.json');
    if (fs.existsSync(productsFile)) {
      const raw = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
      const prodList = raw.data || raw;
      if (Array.isArray(prodList) && prodList.length > 0) {
        console.log(`Seeding ${prodList.length} products...`);
        const prodCol = db.collection('products');
        await prodCol.deleteMany({});
        const docs = prodList.map(p => {
          const doc = { ...p };
          if (doc._id || doc.id) {
            doc._id = parseObjectId(doc._id || doc.id) || new mongoose.Types.ObjectId();
          }
          if (Array.isArray(doc.categories)) {
            doc.categories = doc.categories.map(cat => {
              const cDoc = { ...cat };
              if (cDoc._id) cDoc._id = parseObjectId(cDoc._id) || new mongoose.Types.ObjectId();
              if (cDoc.parent) cDoc.parent = parseObjectId(cDoc.parent);
              return cDoc;
            });
          }
          if (doc.createdBy) doc.createdBy = parseObjectId(doc.createdBy);
          if (doc.updatedBy) doc.updatedBy = parseObjectId(doc.updatedBy);
          doc.createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
          doc.updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : new Date();
          return doc;
        });
        await prodCol.insertMany(docs);
        console.log('✅ Products restored successfully.');
      }
    }

    // 3. Restore Store Utils
    const storeUtilsFile = path.join(__dirname, '../data/engulfic_store_utils.json');
    if (fs.existsSync(storeUtilsFile)) {
      const raw = JSON.parse(fs.readFileSync(storeUtilsFile, 'utf8'));
      const data = raw.data || raw;
      if (data) {
        const utilsCol = db.collection('storeutils');
        await utilsCol.deleteMany({});
        await utilsCol.insertOne({
          featured: Array.isArray(data.featured) ? data.featured.map(id => parseObjectId(id)).filter(Boolean) : [],
          bestSeller: Array.isArray(data.bestSeller) ? data.bestSeller.map(id => parseObjectId(id)).filter(Boolean) : [],
          updatedAt: new Date()
        });
        console.log('✅ Store Utils restored successfully.');
      }
    }

    // 4. Ensure Default Admin User
    const usersCol = db.collection('users');
    const existingAdmin = await usersCol.findOne({ role: 'Owner' });
    if (!existingAdmin) {
      console.log('Creating initial Owner/Admin user...');
      const passwordHash = await hashPassword('11223345');
      await usersCol.insertOne({
        name: 'Engulfic Admin',
        email: 'info@engulfic.com',
        passwordHash,
        role: 'Owner',
        phone: '01700000000',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Initial Owner user created: info@engulfic.com / 11223345');
    }

    console.log('=============================================');
    console.log('🎉 Engulfic Database Restore Completed 100%!');
    console.log('=============================================');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

restoreEngulfic();
