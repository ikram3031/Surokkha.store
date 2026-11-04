// Per-thana delivery charges. The backend stores the charge on each thana at Pathao sync time and
// returns it with the thana list; useThanas registers it here so the cart totals can look it up.
const thanaCharges = new Map(); // "district|thana" (lowercase) -> charge

const key = (district, thana) => `${String(district || '').trim().toLowerCase()}|${String(thana || '').trim().toLowerCase()}`;

export function registerThanaCharges(district, thanas) {
  (thanas || []).forEach((t) => {
    if (t?.name && typeof t.deliveryCharge === 'number') thanaCharges.set(key(district, t.name), t.deliveryCharge);
  });
}

const SUBURB_KEYWORDS = ['savar', 'ashulia', 'dhamrai', 'keraniganj', 'nawabganj', 'dohar'];
const SUBURB_ZONES = [
  'jamgora', 'shimultola jamgora', 'baipail', 'hemayetpur', 'zirabo', 'zirani',
  'nischintapur', 'nobinagar', 'amin bazar', 'akran bazar', 'bakurta', 'epz',
  'kalampur', 'kholamura',
];

// Used only until the thana's stored charge has loaded (keep in sync with backend deliveryCharge.helper.js)
function fallbackCharge(district, thana) {
  if (!district) return 70;
  if (district === 'dhaka') {
    return SUBURB_KEYWORDS.some((k) => thana.includes(k)) || SUBURB_ZONES.includes(thana) ? 90 : 70;
  }
  if (district === 'gazipur' || district === 'narayanganj') return 90;
  return 120;
}

export function getDeliveryCharge(district, thana) {
  const d = String(district || '').trim().toLowerCase();
  const t = String(thana || '').trim().toLowerCase();
  const stored = thanaCharges.get(key(d, t));
  return stored ?? fallbackCharge(d, t);
}
