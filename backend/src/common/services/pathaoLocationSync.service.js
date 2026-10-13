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

// Common Upazilas/Thanas for all 64 districts of Bangladesh
export const COMMON_THANAS = {
  Dhaka: [
    'Savar', 'Ashulia', 'Dhamrai', 'Keraniganj', 'Nawabganj', 'Dohar', 'Adabor', 'Badda', 'Banani',
    'Bangshal', 'Cantonment', 'Chawkbazar', 'Dakshinkhan', 'Darussalam', 'Demra', 'Dhanmondi', 'Gendaria',
    'Gulshan', 'Hazaribagh', 'Jatrabari', 'Kadamtali', 'Kafrul', 'Kalabagan', 'Kamrangirchar', 'Khilgaon',
    'Khilkhet', 'Kotwali', 'Lalbagh', 'Mirpur', 'Mohammadpur', 'Motijheel', 'Mugda', 'New Market',
    'Pallabi', 'Paltan', 'Ramna', 'Rampura', 'Sabujbagh', 'Shah Ali', 'Shahbagh', 'Sher-e-Bangla Nagar',
    'Shyampur', 'Sutrapur', 'Tejgaon', 'Tejgaon Industrial Area', 'Turag', 'Uttara Paschim', 'Uttara Purba',
    'Uttarkhan', 'Vatara', 'Wari'
  ],
  Faridpur: ['Faridpur Sadar', 'Boalmari', 'Alfadanga', 'Madhukhali', 'Bhanga', 'Nagarkanda', 'Charbhadrasan', 'Sadarpur', 'Saltha'],
  Gazipur: ['Tongi', 'Gazipur Sadar', 'Konabari', 'Kashimpur', 'Kaliakair', 'Kaliganj', 'Kapasia', 'Sreepur'],
  Gopalganj: ['Gopalganj Sadar', 'Kashiani', 'Kotalipara', 'Muksudpur', 'Tungipara'],
  Kishoreganj: ['Kishoreganj Sadar', 'Bajitpur', 'Bhairab', 'Hossainpur', 'Itna', 'Karimganj', 'Katiadi', 'Kuliarchar', 'Mithamain', 'Nikli', 'Pakundia', 'Tarail', 'Ashtagram'],
  Madaripur: ['Madaripur Sadar', 'Kalkini', 'Rajoir', 'Shibchar', 'Dasar'],
  Manikganj: ['Manikganj Sadar', 'Singair', 'Shibalaya', 'Saturia', 'Harirampur', 'Ghior', 'Daulatpur'],
  Munshiganj: ['Munshiganj Sadar', 'Tongibari', 'Serajdikhan', 'Louhajang', 'Gazaria', 'Sreenagar'],
  Narayanganj: ['Narayanganj Sadar', 'Bandar', 'Fatullah', 'Siddhirganj', 'Rupganj', 'Sonargaon', 'Araihazar'],
  Narsingdi: ['Narsingdi Sadar', 'Belabo', 'Monohardi', 'Palash', 'Raipura', 'Shibpur'],
  Rajbari: ['Rajbari Sadar', 'Goalanda', 'Pangsha', 'Baliakandi', 'Kalukhali'],
  Shariatpur: ['Shariatpur Sadar', 'Damudya', 'Naria', 'Jajira', 'Bhedarganj', 'Gosairhat'],
  Tangail: ['Tangail Sadar', 'Basail', 'Bhuapur', 'Delduar', 'Dhanbari', 'Ghatail', 'Gopalpur', 'Kalihati', 'Madhupur', 'Mirzapur', 'Nagarpur', 'Sakhipur'],
  Bagerhat: ['Bagerhat Sadar', 'Chitalmari', 'Fakirhat', 'Kachua', 'Mollahat', 'Mongla', 'Morrelganj', 'Rampal', 'Sarankhola'],
  Chuadanga: ['Chuadanga Sadar', 'Alamdanga', 'Damurhuda', 'Jibannagar'],
  Jessore: ['Jessore Sadar', 'Abhaynagar', 'Bagherpara', 'Chaugachha', 'Jhikargachha', 'Keshabpur', 'Manirampur', 'Sharsha'],
  Jashore: ['Jessore Sadar', 'Abhaynagar', 'Bagherpara', 'Chaugachha', 'Jhikargachha', 'Keshabpur', 'Manirampur', 'Sharsha'],
  Jhenaidah: ['Jhenaidah Sadar', 'Harinakunda', 'Kaliganj', 'Kotchandpur', 'Maheshpur', 'Shailkupa'],
  Khulna: ['Khulna Sadar', 'Sonadanga', 'Khalishpur', 'Daulatpur', 'Khan Jahan Ali', 'Batiaghata', 'Dacope', 'Dumuria', 'Dighalia', 'Koyra', 'Paikgachha', 'Phultala', 'Rupsha', 'Terokhada'],
  Kushtia: ['Kushtia Sadar', 'Bheramara', 'Daulatpur', 'Khoksa', 'Kumarkhali', 'Mirpur'],
  Magura: ['Magura Sadar', 'Mohammadpur', 'Shalikha', 'Sreepur'],
  Meherpur: ['Meherpur Sadar', 'Gangni', 'Mujibnagar'],
  Narail: ['Narail Sadar', 'Kalia', 'Lohagara'],
  Satkhira: ['Satkhira Sadar', 'Assasuni', 'Debhata', 'Kalaroa', 'Kaliganj', 'Shyamnagar', 'Tala'],
  Bandarban: ['Bandarban Sadar', 'Alikadam', 'Naikhongchhari', 'Rowangchhari', 'Lama', 'Ruma', 'Thanchi'],
  Brahmanbaria: ['Brahmanbaria Sadar', 'Ashuganj', 'Nasirnagar', 'Nabinagar', 'Sarail', 'Kasba', 'Akhaura', 'Bancharampur', 'Bijoynagar'],
  Chandpur: ['Chandpur Sadar', 'Faridganj', 'Haimchar', 'Haziganj', 'Kachua', 'Matlab Dakshin', 'Matlab Uttar', 'Shahrasti'],
  Chittagong: ['Kotwali', 'Panchlaish', 'Halishahar', 'Pahartali', 'Bakalia', 'Chandgaon', 'Patenga', 'Double Mooring', 'Khulshi', 'Bayezid', 'Karnaphuli', 'Hathazari', 'Sitakunda', 'Mirsharai', 'Patiya', 'Raozan', 'Fatikchhari', 'Boalkhali', 'Anwara', 'Chandanaish', 'Banshkhali', 'Lohagara', 'Satkania', 'Sandwip'],
  Chattogram: ['Kotwali', 'Panchlaish', 'Halishahar', 'Pahartali', 'Bakalia', 'Chandgaon', 'Patenga', 'Double Mooring', 'Khulshi', 'Bayezid', 'Karnaphuli', 'Hathazari', 'Sitakunda', 'Mirsharai', 'Patiya', 'Raozan', 'Fatikchhari', 'Boalkhali', 'Anwara', 'Chandanaish', 'Banshkhali', 'Lohagara', 'Satkania', 'Sandwip'],
  Comilla: ['Adarsha Sadar', 'Sadar Dakshin', 'Barura', 'Brahmanpara', 'Burichang', 'Chandina', 'Chauddagram', 'Daudkandi', 'Debidwar', 'Homna', 'Laksam', 'Muradnagar', 'Nangalkot', 'Titas', 'Meghna', 'Monohargonj', 'Lalmai'],
  Cumilla: ['Adarsha Sadar', 'Sadar Dakshin', 'Barura', 'Brahmanpara', 'Burichang', 'Chandina', 'Chauddagram', 'Daudkandi', 'Debidwar', 'Homna', 'Laksam', 'Muradnagar', 'Nangalkot', 'Titas', 'Meghna', 'Monohargonj', 'Lalmai'],
  "Cox's Bazar": ["Cox's Bazar Sadar", 'Chakaria', 'Maheshkhali', 'Teknaf', 'Ramu', 'Ukhiya', 'Pekua', 'Kutubdia', 'Eidgaon'],
  "Coxs Bazar": ["Cox's Bazar Sadar", 'Chakaria', 'Maheshkhali', 'Teknaf', 'Ramu', 'Ukhiya', 'Pekua', 'Kutubdia', 'Eidgaon'],
  Feni: ['Feni Sadar', 'Daganbhuiyan', 'Chhagalnaiya', 'Parshuram', 'Sonagazi', 'Fulgazi'],
  Khagrachhari: ['Khagrachhari Sadar', 'Dighinala', 'Panchhari', 'Mahalchhari', 'Matiranga', 'Manikchhari', 'Ramgarh', 'Guimara', 'Lakshmichhari'],
  Lakshmipur: ['Lakshmipur Sadar', 'Raipur', 'Ramganj', 'Ramgati', 'Kamalnagar'],
  Noakhali: ['Noakhali Sadar', 'Begumganj', 'Chatkhil', 'Companiganj', 'Hatiya', 'Senbagh', 'Sonaimuri', 'Subarnachar', 'Kabirhat'],
  Rangamati: ['Rangamati Sadar', 'Kaptai', 'Kawkhali', 'Baghaichhari', 'Barkal', 'Langadu', 'Rajasthali', 'Belaichhari', 'Juraichhari', 'Naniarchar'],
  "Rangamati Hill": ['Rangamati Sadar', 'Kaptai', 'Kawkhali', 'Baghaichhari', 'Barkal', 'Langadu', 'Rajasthali', 'Belaichhari', 'Juraichhari', 'Naniarchar'],
  Bogra: ['Bogra Sadar', 'Adamdighi', 'Dhunat', 'Dhupchanchia', 'Gabtali', 'Kahaloo', 'Nandigram', 'Sahajanpur', 'Sariakandi', 'Sherpur', 'Shibganj', 'Sonatala'],
  Bogura: ['Bogra Sadar', 'Adamdighi', 'Dhunat', 'Dhupchanchia', 'Gabtali', 'Kahaloo', 'Nandigram', 'Sahajanpur', 'Sariakandi', 'Sherpur', 'Shibganj', 'Sonatala'],
  Joypurhat: ['Joypurhat Sadar', 'Akkelpur', 'Kalai', 'Khetlal', 'Panchbibi'],
  Naogaon: ['Naogaon Sadar', 'Atrai', 'Badalgachhi', 'Dhamoirhat', 'Manda', 'Mohadevpur', 'Niamatpur', 'Patnitala', 'Porsha', 'Raninagar', 'Sapahar'],
  Natore: ['Natore Sadar', 'Bagatipara', 'Baraigram', 'Gurudaspur', 'Lalpur', 'Singra', 'Naldanga'],
  Chapainawabganj: ['Chapainawabganj Sadar', 'Gomastapur', 'Nachole', 'Bholahat', 'Shibganj'],
  Pabna: ['Pabna Sadar', 'Atgharia', 'Bera', 'Bhangura', 'Chatmohar', 'Faridpur', 'Ishwardi', 'Santhia', 'Sujanagar'],
  Rajshahi: ['Boalia', 'Motihar', 'Rajpara', 'Shah Makhdum', 'Chandrima', 'Kasiadanga', 'Katakhali', 'Bagha', 'Bagmara', 'Charghat', 'Durgapur', 'Godagari', 'Mohanpur', 'Paba', 'Puthia', 'Tanore'],
  Sirajganj: ['Sirajganj Sadar', 'Belkuchi', 'Chauhali', 'Kamarkhanda', 'Kazipur', 'Raiganj', 'Shahjadpur', 'Tarash', 'Ullahpara'],
  Habiganj: ['Habiganj Sadar', 'Ajmiriganj', 'Bahubal', 'Baniyachong', 'Chunarughat', 'Lakhai', 'Madhabpur', 'Nabiganj', 'Sayestaganj'],
  Moulvibazar: ['Moulvibazar Sadar', 'Barlekha', 'Juri', 'Kamalganj', 'Kulaura', 'Rajnagar', 'Sreemangal'],
  Sunamganj: ['Sunamganj Sadar', 'Bishwamvarpur', 'Chhatak', 'Derai', 'Dharamapasha', 'Dowarabazar', 'Jagannathpur', 'Jamalganj', 'Sullah', 'Tahirpur', 'Shantiganj'],
  Sylhet: ['Sylhet Sadar', 'Beanibazar', 'Golapganj', 'Companiganj', 'Fenchuganj', 'Balaganj', 'Biswanath', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'Zakiganj', 'Dakshin Surma', 'Osmani Nagar'],
  Dinajpur: ['Dinajpur Sadar', 'Birampur', 'Birganj', 'Birol', 'Bochaganj', 'Chirirbandar', 'Fulbari', 'Ghoraghat', 'Hakimpur', 'Kaharole', 'Khansama', 'Nawabganj', 'Parbatipur'],
  Gaibandha: ['Gaibandha Sadar', 'Fulchhari', 'Gobindaganj', 'Palashbari', 'Sadullapur', 'Sughatta', 'Sundarganj'],
  Kurigram: ['Kurigram Sadar', 'Bhurungamari', 'Char Rajibpur', 'Chilmari', 'Nageshwari', 'Phulbari', 'Rajarhat', 'Raomari', 'Ulipur'],
  Lalmonirhat: ['Lalmonirhat Sadar', 'Aditmari', 'Hatibandha', 'Kaliganj', 'Patgram'],
  Nilphamari: ['Nilphamari Sadar', 'Dimla', 'Domar', 'Jaldhaka', 'Kishoreganj', 'Syedpur'],
  Panchagarh: ['Panchagarh Sadar', 'Atwari', 'Boda', 'Debiganj', 'Tetulia'],
  Rangpur: ['Kotwali', 'Tajhat', 'Mahiganj', 'Haragach', 'Parshuram', 'Hazirhat', 'Badarganj', 'Gangachhara', 'Kaunia', 'Mithapukur', 'Pirgachha', 'Pirganj', 'Taraganj'],
  Thakurgaon: ['Thakurgaon Sadar', 'Baliadangi', 'Haripur', 'Pirganj', 'Ranisankhail'],
  Jamalpur: ['Jamalpur Sadar', 'Bakshiganj', 'Dewanganj', 'Islampur', 'Madarganj', 'Melandaha', 'Sarishabari'],
  Mymensingh: ['Kotwali', 'Trishal', 'Bhaluka', 'Muktagachha', 'Gafargaon', 'Fulbaria', 'Haluaghat', 'Dhobaura', 'Ishwarganj', 'Nandail', 'Gouripur', 'Tara Khanda'],
  Netrakona: ['Netrakona Sadar', 'Atpara', 'Barhatta', 'Durgapur', 'Kalmakanda', 'Kendua', 'Madan', 'Mohanganj', 'Purbadhala', 'Khaliajuri'],
  Sherpur: ['Sherpur Sadar', 'Jhenaigati', 'Nakla', 'Nalitabari', 'Sreebardi'],
  Barguna: ['Barguna Sadar', 'Amtali', 'Bamna', 'Betagi', 'Patharghata', 'Taltali'],
  Barisal: ['Kotwali', 'Airport', 'Kawnia', 'Bakerganj', 'Babuganj', 'Wazirpur', 'Banaripara', 'Gournadi', 'Agailjhara', 'Mehendiganj', 'Muladi', 'Hizla'],
  Barishal: ['Kotwali', 'Airport', 'Kawnia', 'Bakerganj', 'Babuganj', 'Wazirpur', 'Banaripara', 'Gournadi', 'Agailjhara', 'Mehendiganj', 'Muladi', 'Hizla'],
  Bhola: ['Bhola Sadar', 'Burhanuddin', 'Char Fasson', 'Daulatkhan', 'Lalmohan', 'Manpura', 'Tazumuddin'],
  Jhalokati: ['Jhalokati Sadar', 'Kathalia', 'Nalchity', 'Rajapur'],
  Patuakhali: ['Patuakhali Sadar', 'Bauphal', 'Dashmina', 'Galachipa', 'Kalapara', 'Mirzaganj', 'Rangabali', 'Dumki'],
  Pirojpur: ['Pirojpur Sadar', 'Bhandaria', 'Kawkhali', 'Mathbaria', 'Nazirpur', 'Nesarabad (Swarupkati)', 'Indurkani'],
};

// Helper: Fetch zones with retry on 429 / rate limiting
async function fetchZonesWithRetry(cityId, cityName, maxRetries = 4) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const zones = await getPathaoZones(cityId);
      if (Array.isArray(zones)) return zones;
      return [];
    } catch (err) {
      const isRateLimited =
        err?.status === 429 ||
        err?.response?.status === 429 ||
        String(err?.message || "").toLowerCase().includes("too many request") ||
        String(err?.message || "").includes("429");

      if (isRateLimited && attempt < maxRetries) {
        const backoffMs = attempt * 3500; // 3.5s, 7s, 10.5s
        console.warn(
          `[Pathao Location Sync] Rate limit (429) on "${cityName}" (${cityId}). Retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries})...`
        );
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }
      if (attempt === maxRetries) {
        console.warn(
          `[Pathao Location Sync] Failed to fetch zones for city "${cityName}" (${cityId}) after ${maxRetries} attempts:`,
          err?.message
        );
        return [];
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return [];
}

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

    // Fetch zones (thanas) for this city with automatic retry on 429
    let zones = await fetchZonesWithRetry(cityId, cityName, 4);

    // If API returned 0 zones, check existing DB record to avoid wiping out previous data
    if (zones.length === 0) {
      const existingDistrict = await DistrictModel.findOne({ cityId }).lean();
      if (existingDistrict?.thanas?.length > 0) {
        console.log(`[Pathao Location Sync] Retaining existing ${existingDistrict.thanas.length} thanas for "${cityName}"`);
        zones = existingDistrict.thanas.map((t) => ({
          zone_id: t.zoneId,
          zone_name: t.name,
          zone_name_bn: t.bnName || "",
        }));
      } else {
        const fallbackThanaNames = COMMON_THANAS[cityName] || [`${cityName} Sadar`];
        zones = fallbackThanaNames.map((tName, idx) => ({
          zone_id: 10000 + cityId * 100 + idx,
          zone_name: tName,
          zone_name_bn: "",
        }));
      }
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

    // Pacing to avoid Pathao rate limits (800ms between requests)
    await new Promise((resolve) => setTimeout(resolve, 800));
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

