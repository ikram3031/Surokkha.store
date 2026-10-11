import mongoose from "mongoose";
import dotenv from "dotenv";
import { StoreSettingsModel } from "../models/storeSettings.model.js";
import { DistrictModel, ThanaModel } from "../models/district.model.js";
import {
  syncLocationsFromPathaoAPI,
  seedBaselineDistrictsAndThanas,
} from "../services/pathaoLocationSync.service.js";
import { testPathaoConnection } from "../services/pathao.service.js";

dotenv.config();

const parseArgs = () => {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--")) {
      const [key, ...vals] = arg.slice(2).split("=");
      args[key] = vals.join("=");
    }
  }
  return args;
};

async function main() {
  const args = parseArgs();
  const dbUri = args.uri || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/surokkha";

  console.log("==========================================================");
  console.log("   PATHAO COURIER: DISTRICT & THANA SYNC UTILITY");
  console.log("==========================================================");
  console.log(`[Database] Connecting to: ${dbUri}`);

  let didConnect = false;
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(dbUri);
    didConnect = true;
  }

  try {
    // 1. If credentials passed via CLI, update StoreSettingsModel first
    if (args.clientId && args.clientSecret && args.username && args.password) {
      console.log("[Auth] Credentials supplied via CLI arguments. Testing with Pathao API...");
      const testRes = await testPathaoConnection({
        clientId: args.clientId.trim(),
        clientSecret: args.clientSecret.trim(),
        username: args.username.trim(),
        password: args.password.trim(),
        environment: args.env || "production",
      });

      if (!testRes.success) {
        throw new Error(`Pathao Authentication failed: ${testRes.message}`);
      }

      console.log("✅ Pathao credentials verified successfully!");
      await StoreSettingsModel.updateOne(
        { key: "default" },
        {
          $set: {
            "pathaoCourier.clientId": args.clientId.trim(),
            "pathaoCourier.clientSecret": args.clientSecret.trim(),
            "pathaoCourier.username": args.username.trim(),
            "pathaoCourier.password": args.password.trim(),
            "pathaoCourier.environment": args.env || "production",
            "pathaoCourier.accessToken": testRes.tokenData?.access_token || "",
            "pathaoCourier.refreshToken": testRes.tokenData?.refresh_token || "",
            "pathaoCourier.tokenExpiresAt": new Date(Date.now() + (testRes.tokenData?.expires_in || 432000) * 1000),
            "pathaoCourier.lastTestStatus": "connected",
            "pathaoCourier.lastTestedAt": new Date(),
          },
        },
        { upsert: true }
      );
    }

    // 2. Check if Pathao credentials exist
    const settings = await StoreSettingsModel.findOne({ key: "default" }).lean();
    const pathao = settings?.pathaoCourier || {};
    const hasCredentials = Boolean(
      (pathao.clientId && pathao.clientSecret && pathao.username && pathao.password) ||
      (process.env.PATHAO_CLIENT_ID && process.env.PATHAO_CLIENT_SECRET)
    );

    if (hasCredentials) {
      console.log(`[Pathao API] Starting Live Location Sync from Pathao API (${pathao.environment || "production"})...`);
      const result = await syncLocationsFromPathaoAPI({
        onProgress: ({ current, total, cityName, zonesCount }) => {
          process.stdout.write(`\r[Progress] [${current}/${total}] Synced "${cityName}": ${zonesCount} zones (thanas)`);
        },
      });
      console.log("\n");
      console.log("✅ LIVE SYNC COMPLETED SUCCESSFULLY!");
      console.log(`   Districts (Cities) Synced: ${result.districtsCount}`);
      console.log(`   Thanas (Zones) Synced:     ${result.thanasCount}`);
      console.log(`   Duration:                  ${result.durationSeconds}s`);
    } else {
      console.log("⚠️  Pathao credentials not configured in DB or .env.");
      console.log("ℹ️  Running baseline seeder for Bangladesh 64 Districts...");
      await seedBaselineDistrictsAndThanas();
      console.log("\n💡 To run live sync directly with your Pathao credentials, execute:");
      console.log('   node src/common/scripts/syncPathaoLocations.js --clientId="YOUR_ID" --clientSecret="YOUR_SECRET" --username="YOUR_EMAIL" --password="YOUR_PASSWORD"\n');
    }

    // Report collection statistics
    const totalDistricts = await DistrictModel.countDocuments();
    const totalThanas = await ThanaModel.countDocuments();
    console.log("----------------------------------------------------------");
    console.log(`📊 Current Database Stats:`);
    console.log(`   • 'districts' collection: ${totalDistricts} documents`);
    console.log(`   • 'thanas' collection:    ${totalThanas} documents`);
    console.log("==========================================================");
  } catch (err) {
    console.error("\n❌ Error during sync:", err.message);
  } finally {
    if (didConnect) {
      await mongoose.disconnect();
    }
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
