import { connectDatabase, closeDatabase } from "../src/common/database/index.js";
import { syncLocationsFromPathaoAPI, seedBaselineDistrictsAndThanas } from "../src/common/services/pathaoLocationSync.service.js";
import { getPathaoConfig } from "../src/common/services/pathao.service.js";

async function main() {
  try {
    await connectDatabase();
    console.log("Checking Pathao configuration...");
    const config = await getPathaoConfig();
    const hasCredentials = Boolean(config.clientId && config.clientSecret && config.username && config.password);

    if (hasCredentials) {
      console.log("Found Pathao credentials. Starting live location sync from Pathao API...");
      const result = await syncLocationsFromPathaoAPI({
        onProgress: (p) => {
          console.log(`[${p.current}/${p.total}] ${p.cityName} -> ${p.zonesCount} zones`);
        },
      });
      console.log("✅ Successfully synced locations from Pathao API:", result);
    } else {
      console.log("Pathao credentials not configured. Seeding 64 baseline districts and thanas...");
      const result = await seedBaselineDistrictsAndThanas();
      console.log("✅ Baseline seed complete:", result);
    }
  } catch (error) {
    console.error("❌ Location sync failed:", error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

main();
