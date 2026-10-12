import { DistrictModel, ThanaModel } from "../models/district.model.js";
import { getPathaoCities, getPathaoZones } from "./pathao.service.js";

// Standard 64 Districts of Bangladesh
export const BANGLADESH_64_DISTRICTS = [
  { name: "Dhaka", bnName: "ঢাকা", defaultCityId: 1 },
  { name: "Chittagong", bnName: "চট্টগ্রাম", defaultCityId: 2 },
  { name: "Rajshahi", bnName: "রাজশাহী", defaultCityId: 4 },
  { name: "Cumilla", bnName: "কুমিল্লা", defaultCityId: 5 },
  { name: "Feni", bnName: "ফেনী", defaultCityId: 6 },
  { name: "Faridpur", bnName: "ফরিদপুর", defaultCityId: 7 },
  { name: "Gazipur", bnName: "গাজীপুর", defaultCityId: 8 },
  { name: "Gopalganj", bnName: "গোপালগঞ্জ", defaultCityId: 9 },
  { name: "Kishoreganj", bnName: "কিশোরগঞ্জ", defaultCityId: 10 },
  { name: "Madaripur", bnName: "মাদারীপুর", defaultCityId: 11 },
  { name: "Manikganj", bnName: "মানিকগঞ্জ", defaultCityId: 12 },
  { name: "Munshiganj", bnName: "মুন্সীগঞ্জ", defaultCityId: 13 },
  { name: "Narayanganj", bnName: "নারায়ণগঞ্জ", defaultCityId: 14 },
  { name: "Narsingdi", bnName: "নরসিংদী", defaultCityId: 15 },
  { name: "Rajbari", bnName: "রাজবাড়ী", defaultCityId: 16 },
  { name: "Shariatpur", bnName: "শরীয়তপুর", defaultCityId: 17 },
  { name: "Tangail", bnName: "টাঙ্গাইল", defaultCityId: 18 },
  { name: "Bagerhat", bnName: "বাগেরহাট", defaultCityId: 19 },
  { name: "Chuadanga", bnName: "চুয়াডাঙ্গা", defaultCityId: 20 },
  { name: "Jessore", bnName: "যশোর", defaultCityId: 21 },
  { name: "Jhenaidah", bnName: "ঝিনাইদহ", defaultCityId: 22 },
  { name: "Khulna", bnName: "খুলনা", defaultCityId: 23 },
  { name: "Kushtia", bnName: "কুষ্টিয়া", defaultCityId: 24 },
  { name: "Magura", bnName: "মাগুরা", defaultCityId: 25 },
  { name: "Meherpur", bnName: "মেহেরপুর", defaultCityId: 26 },
  { name: "Narail", bnName: "নড়াইল", defaultCityId: 27 },
  { name: "Satkhira", bnName: "সাতক্ষীরা", defaultCityId: 28 },
  { name: "Bandarban", bnName: "বান্দরবান", defaultCityId: 29 },
  { name: "Brahmanbaria", bnName: "ব্রাহ্মণবাড়িয়া", defaultCityId: 30 },
  { name: "Chandpur", bnName: "চাঁদপুর", defaultCityId: 31 },
  { name: "Cox's Bazar", bnName: "কক্সবাজার", defaultCityId: 32 },
  { name: "Khagrachhari", bnName: "খাগড়াছড়ি", defaultCityId: 33 },
  { name: "Lakshmipur", bnName: "লক্ষ্মীপুর", defaultCityId: 34 },
  { name: "Noakhali", bnName: "নোয়াখালী", defaultCityId: 35 },
  { name: "Rangamati", bnName: "রাঙ্গামাটি", defaultCityId: 36 },
  { name: "Bogra", bnName: "বগুড়া", defaultCityId: 37 },
  { name: "Joypurhat", bnName: "জয়পুরহাট", defaultCityId: 38 },
  { name: "Naogaon", bnName: "নওগাঁ", defaultCityId: 39 },
  { name: "Natore", bnName: "নাটোর", defaultCityId: 40 },
  { name: "Chapainawabganj", bnName: "চাঁপাইনবাবগঞ্জ", defaultCityId: 41 },
  { name: "Pabna", bnName: "পাবনা", defaultCityId: 42 },
  { name: "Sirajganj", bnName: "সিরাজগঞ্জ", defaultCityId: 43 },
  { name: "Habiganj", bnName: "হবিগঞ্জ", defaultCityId: 44 },
  { name: "Moulvibazar", bnName: "মৌলভীবাজার", defaultCityId: 45 },
  { name: "Sunamganj", bnName: "সুনামগঞ্জ", defaultCityId: 46 },
  { name: "Sylhet", bnName: "সিলেট", defaultCityId: 47 },
  { name: "Dinajpur", bnName: "দিনাজপুর", defaultCityId: 48 },
  { name: "Gaibandha", bnName: "গাইবান্ধা", defaultCityId: 49 },
  { name: "Kurigram", bnName: "কুড়িগ্রাম", defaultCityId: 50 },
  { name: "Lalmonirhat", bnName: "লালমনিরহাট", defaultCityId: 51 },
  { name: "Nilphamari", bnName: "নীলফামারী", defaultCityId: 52 },
  { name: "Panchagarh", bnName: "পঞ্চগড়", defaultCityId: 53 },
  { name: "Rangpur", bnName: "রংপুর", defaultCityId: 54 },
  { name: "Thakurgaon", bnName: "ঠাকুরগাঁও", defaultCityId: 55 },
  { name: "Jamalpur", bnName: "জামালপুর", defaultCityId: 56 },
  { name: "Mymensingh", bnName: "ময়মনসিংহ", defaultCityId: 57 },
  { name: "Netrakona", bnName: "নেত্রকোণা", defaultCityId: 58 },
  { name: "Sherpur", bnName: "শেরপুর", defaultCityId: 59 },
  { name: "Barguna", bnName: "বরগুনা", defaultCityId: 60 },
  { name: "Barisal", bnName: "বরিশাল", defaultCityId: 61 },
  { name: "Bhola", bnName: "ভোলা", defaultCityId: 62 },
  { name: "Jhalokati", bnName: "ঝালকাঠি", defaultCityId: 63 },
  { name: "Patuakhali", bnName: "পটুয়াখালী", defaultCityId: 64 },
  { name: "Pirojpur", bnName: "পিরোজপুর", defaultCityId: 65 },
];

/**
 * Sync districts and thanas live from Pathao Courier API
 */
export async function syncLocationsFromPathaoAPI(options = {}) {
  const { onProgress } = options;
  const startTime = Date.now();
  console.log("[Pathao Location Sync] Fetching cities list from Pathao API...");

  const cities = await getPathaoCities();
  if (!Array.isArray(cities) || cities.length === 0) {
    throw new Error("No cities returned from Pathao API.");
  }

  console.log(`[Pathao Location Sync] Retrieved ${cities.length} cities from Pathao. Processing zones...`);

  let totalDistrictsSynced = 0;
  let totalThanasSynced = 0;
  const now = new Date();

  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    const cityId = Number(city.city_id);
    const cityName = String(city.city_name || "").trim();

    if (!cityId || !cityName) continue;

    // Fetch zones (thanas) for this city
    let zones = [];
    try {
      zones = await getPathaoZones(cityId);
      if (!Array.isArray(zones)) zones = [];
    } catch (zoneErr) {
      console.warn(`[Pathao Location Sync] Failed to fetch zones for city "${cityName}" (${cityId}):`, zoneErr.message);
    }

    // Format thanas array for DistrictModel
    const thanasFormatted = zones.map((z) => ({
      zoneId: Number(z.zone_id),
      name: String(z.zone_name || "").trim(),
      bnName: String(z.zone_name_bn || "").trim(),
    }));

    // Update or Insert District in MongoDB
    await DistrictModel.findOneAndUpdate(
      { cityId: cityId },
      {
        $set: {
          cityId: cityId,
          name: cityName,
          totalZones: thanasFormatted.length,
          thanas: thanasFormatted,
          isActive: true,
          source: "pathao",
          lastSyncedAt: now,
        },
      },
      { upsert: true, new: true }
    );
    totalDistrictsSynced++;

    // Update or Insert individual Thana documents in ThanaModel
    if (zones.length > 0) {
      const thanaBulkOps = zones.map((z) => ({
        updateOne: {
          filter: { zoneId: Number(z.zone_id) },
          update: {
            $set: {
              zoneId: Number(z.zone_id),
              cityId: cityId,
              districtName: cityName,
              name: String(z.zone_name || "").trim(),
              bnName: String(z.zone_name_bn || "").trim(),
              isActive: true,
              source: "pathao",
              lastSyncedAt: now,
            },
          },
          upsert: true,
        },
      }));

      await ThanaModel.bulkWrite(thanaBulkOps, { ordered: false });
      totalThanasSynced += zones.length;
    }

    if (onProgress && typeof onProgress === "function") {
      onProgress({
        current: i + 1,
        total: cities.length,
        cityName,
        zonesCount: zones.length,
      });
    }

    // Gentle pacing to avoid Pathao rate limits (150ms between zone requests)
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(
    `[Pathao Location Sync] Completed in ${durationSec}s! Synced ${totalDistrictsSynced} districts and ${totalThanasSynced} thanas.`
  );

  return {
    success: true,
    districtsCount: totalDistrictsSynced,
    thanasCount: totalThanasSynced,
    durationSeconds: Number(durationSec),
    syncedAt: now,
  };
}

/**
 * Baseline Seeding of 64 Districts & Thanas when API credentials are not yet initialized
 */
export async function seedBaselineDistrictsAndThanas() {
  console.log("[Location Seeder] Seeding standard 64 Bangladesh districts & thanas...");
  const now = new Date();
  let seededDistricts = 0;
  let seededThanas = 0;

  const COMMON_THANAS = {
    Dhaka: [
      'Savar', 'Ashulia', 'Dhamrai', 'Keraniganj', 'Nawabganj', 'Dohar', 'Adabor', 'Badda', 'Banani',
      'Bangshal', 'Cantonment', 'Chawkbazar', 'Dakshinkhan', 'Darussalam', 'Demra', 'Dhanmondi', 'Gendaria',
      'Gulshan', 'Hazaribagh', 'Jatrabari', 'Kadamtali', 'Kafrul', 'Kalabagan', 'Kamrangirchar', 'Khilgaon',
      'Khilkhet', 'Kotwali', 'Lalbagh', 'Mirpur', 'Mohammadpur', 'Motijheel', 'Mugda', 'New Market',
      'Pallabi', 'Paltan', 'Ramna', 'Rampura', 'Sabujbagh', 'Shah Ali', 'Shahbagh', 'Sher-e-Bangla Nagar',
      'Shyampur', 'Sutrapur', 'Tejgaon', 'Tejgaon Industrial Area', 'Turag', 'Uttara Paschim', 'Uttara Purba',
      'Uttarkhan', 'Vatara', 'Wari'
    ],
    Chittagong: [
      'Kotwali', 'Panchlaish', 'Halishahar', 'Pahartali', 'Bakalia', 'Chandgaon', 'Patenga', 'Double Mooring',
      'Khulshi', 'Bayezid', 'Karnaphuli', 'Hathazari', 'Sitakunda', 'Mirsharai', 'Patiya', 'Raozan', 'Fatikchhari'
    ],
    Gazipur: ['Tongi', 'Gazipur Sadar', 'Konabari', 'Kashimpur', 'Kaliakair', 'Kaliganj', 'Kapasia', 'Sreepur'],
    Narayanganj: ['Narayanganj Sadar', 'Bandar', 'Fatullah', 'Siddhirganj', 'Rupganj', 'Sonargaon', 'Araihazar'],
    Feni: ['Feni Sadar', 'Daganbhuiyan', 'Chhagalnaiya', 'Parshuram', 'Sonagazi', 'Fulgazi'],
    Cumilla: ['Adarsha Sadar', 'Sadar Dakshin', 'Barura', 'Brahmanpara', 'Burichang', 'Chandina', 'Chauddagram', 'Daudkandi', 'Debidwar', 'Homna', 'Laksam', 'Muradnagar', 'Nangalkot', 'Titas', 'Meghna', 'Monohargonj'],
    Sylhet: ['Sylhet Sadar', 'Beanibazar', 'Golapganj', 'Companiganj', 'Fenchuganj', 'Balaganj', 'Biswanath', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'Zakiganj', 'Dakshin Surma', 'Osmani Nagar'],
    Rajshahi: ['Boalia', 'Motihar', 'Rajpara', 'Shah Makhdum', 'Chandrima', 'Kasiadanga', 'Katakhali', 'Bagha', 'Bagmara', 'Charghat', 'Durgapur', 'Godagari', 'Mohanpur', 'Paba', 'Puthia', 'Tanore'],
    Khulna: ['Khulna Sadar', 'Sonadanga', 'Khalishpur', 'Daulatpur', 'Khan Jahan Ali', 'Batiaghata', 'Dacope', 'Dumuria', 'Dighalia', 'Koyra', 'Paikgachha', 'Phultala', 'Rupsha', 'Terokhada'],
    Barisal: ['Kotwali', 'Airport', 'Kawnia', 'Bakerganj', 'Babuganj', 'Wazirpur', 'Banaripara', 'Gournadi', 'Agailjhara', 'Mehendiganj', 'Muladi', 'Hizla'],
    Rangpur: ['Kotwali', 'Tajhat', 'Mahiganj', 'Haragach', 'Parshuram', 'Hazirhat', 'Badarganj', 'Gangachhara', 'Kaunia', 'Mithapukur', 'Pirgachha', 'Pirganj', 'Taraganj'],
    Mymensingh: ['Kotwali', 'Trishal', 'Bhaluka', 'Muktagachha', 'Gafargaon', 'Fulbaria', 'Haluaghat', 'Dhobaura', 'Ishwarganj', 'Nandail', 'Gouripur', 'Tara Khanda']
  };

  let fallbackZoneIdCounter = 1000;

  for (const dist of BANGLADESH_64_DISTRICTS) {
    const thanaNames = COMMON_THANAS[dist.name] || [`${dist.name} Sadar`];
    const thanasForDistrict = thanaNames.map((tName, idx) => {
      const zoneId = fallbackZoneIdCounter++;
      return {
        zoneId,
        name: tName,
        bnName: "",
      };
    });

    await DistrictModel.findOneAndUpdate(
      { cityId: dist.defaultCityId },
      {
        $set: {
          cityId: dist.defaultCityId,
          name: dist.name,
          bnName: dist.bnName,
          totalZones: thanasForDistrict.length,
          thanas: thanasForDistrict,
          isActive: true,
          source: "seed",
          lastSyncedAt: now,
        },
      },
      { upsert: true, new: true }
    );
    seededDistricts++;

    // Insert into ThanaModel
    for (const t of thanasForDistrict) {
      await ThanaModel.findOneAndUpdate(
        { zoneId: t.zoneId },
        {
          $set: {
            zoneId: t.zoneId,
            cityId: dist.defaultCityId,
            districtName: dist.name,
            name: t.name,
            bnName: t.bnName,
            isActive: true,
            source: "seed",
            lastSyncedAt: now,
          },
        },
        { upsert: true }
      );
      seededThanas++;
    }
  }

  console.log(`[Location Seeder] Successfully seeded ${seededDistricts} districts and ${seededThanas} thanas!`);
  return { seededDistricts, seededThanas };
}

