// Ported from SurokkhaShop. District names must match what the backend (Pathao sync) stores.
export const DISTRICT_NAMES: string[] = ["Bagerhat","Bandarban","Barguna","Barisal","Bhola","Bogra","Brahmanbaria","Chandpur","Chapainawabganj","Chittagong","Chuadanga","Comilla","Cox's Bazar","Dhaka","Dinajpur","Faridpur","Feni","Gaibandha","Gazipur","Gopalganj","Habiganj","Jamalpur","Jessore","Jhalokati","Jhenaidah","Joypurhat","Khagrachhari","Khulna","Kishoreganj","Kurigram","Kushtia","Lakshmipur","Lalmonirhat","Madaripur","Magura","Manikganj","Meherpur","Moulvibazar","Munshiganj","Mymensingh","Naogaon","Narail","Narayanganj","Narsingdi","Natore","Netrakona","Nilphamari","Noakhali","Pabna","Panchagarh","Patuakhali","Pirojpur","Rajbari","Rajshahi","Rangamati Hill","Rangpur","Satkhira","Shariatpur","Sherpur","Sirajganj","Sunamganj","Sylhet","Tangail","Thakurgaon"]

// Offline fallback; live thanas come from GET /locations/districts/:district/thanas
export const FALLBACK_THANAS: Record<string, string[]> = {"Dhaka":["Adabor","Ashulia","Badda","Banani","Bangshal","Cantonment","Chawkbazar","Dakshinkhan","Darussalam","Demra","Dhamrai","Dhanmondi","Dohar","Gendaria","Gulshan","Hazaribagh","Jatrabari","Kadamtali","Kafrul","Kalabagan","Kamrangirchar","Keraniganj","Khilgaon","Khilkhet","Kotwali","Lalbagh","Mirpur","Mohammadpur","Motijheel","Mugda","Nawabganj","New Market","Pallabi","Paltan","Ramna","Rampura","Sabujbagh","Savar","Shah Ali","Shahbagh","Sher-e-Bangla Nagar","Shyampur","Sutrapur","Tejgaon","Tejgaon Industrial Area","Turag","Uttara Paschim","Uttara Purba","Uttarkhan","Vatara","Wari"],"Gazipur":["Gazipur Sadar","Kaliakair","Kaliganj","Kapasia","Kashimpur","Konabari","Sreepur","Tongi"],"Narayanganj":["Araihazar","Bandar","Fatullah","Narayanganj Sadar","Rupganj","Siddhirganj","Sonargaon"]}

/** Bangla names for DISTRICT_NAMES — shown in the picker and matched by search. */
export const DISTRICT_BN: Record<string, string> = {
  Bagerhat: 'বাগেরহাট', Bandarban: 'বান্দরবান', Barguna: 'বরগুনা', Barisal: 'বরিশাল', Bhola: 'ভোলা', Bogra: 'বগুড়া',
  Brahmanbaria: 'ব্রাহ্মণবাড়িয়া', Chandpur: 'চাঁদপুর', Chapainawabganj: 'চাঁপাইনবাবগঞ্জ', Chittagong: 'চট্টগ্রাম', Chuadanga: 'চুয়াডাঙ্গা',
  Comilla: 'কুমিল্লা', "Cox's Bazar": 'কক্সবাজার', Dhaka: 'ঢাকা', Dinajpur: 'দিনাজপুর', Faridpur: 'ফরিদপুর', Feni: 'ফেনী',
  Gaibandha: 'গাইবান্ধা', Gazipur: 'গাজীপুর', Gopalganj: 'গোপালগঞ্জ', Habiganj: 'হবিগঞ্জ', Jamalpur: 'জামালপুর', Jessore: 'যশোর',
  Jhalokati: 'ঝালকাঠি', Jhenaidah: 'ঝিনাইদহ', Joypurhat: 'জয়পুরহাট', Khagrachhari: 'খাগড়াছড়ি', Khulna: 'খুলনা', Kishoreganj: 'কিশোরগঞ্জ',
  Kurigram: 'কুড়িগ্রাম', Kushtia: 'কুষ্টিয়া', Lakshmipur: 'লক্ষ্মীপুর', Lalmonirhat: 'লালমনিরহাট', Madaripur: 'মাদারীপুর', Magura: 'মাগুরা',
  Manikganj: 'মানিকগঞ্জ', Meherpur: 'মেহেরপুর', Moulvibazar: 'মৌলভীবাজার', Munshiganj: 'মুন্সীগঞ্জ', Mymensingh: 'ময়মনসিংহ', Naogaon: 'নওগাঁ',
  Narail: 'নড়াইল', Narayanganj: 'নারায়ণগঞ্জ', Narsingdi: 'নরসিংদী', Natore: 'নাটোর', Netrakona: 'নেত্রকোনা', Nilphamari: 'নীলফামারী',
  Noakhali: 'নোয়াখালী', Pabna: 'পাবনা', Panchagarh: 'পঞ্চগড়', Patuakhali: 'পটুয়াখালী', Pirojpur: 'পিরোজপুর', Rajbari: 'রাজবাড়ী',
  Rajshahi: 'রাজশাহী', 'Rangamati Hill': 'রাঙ্গামাটি', Rangpur: 'রংপুর', Satkhira: 'সাতক্ষীরা', Shariatpur: 'শরীয়তপুর', Sherpur: 'শেরপুর',
  Sirajganj: 'সিরাজগঞ্জ', Sunamganj: 'সুনামগঞ্জ', Sylhet: 'সিলেট', Tangail: 'টাঙ্গাইল', Thakurgaon: 'ঠাকুরগাঁও',
}
