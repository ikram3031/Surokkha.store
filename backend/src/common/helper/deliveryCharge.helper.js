// Delivery charge tiers (BDT) — stored on every thana at Pathao sync time
export const DELIVERY_CHARGES = { inside_dhaka: 70, dhaka_suburb: 90, outside_dhaka: 120 };

// Pathao zone names look like "Jamgora", "Ashulia Bazar", "Charabag, Ashulia", so match by keyword + known zones
const DHAKA_SUBURB_KEYWORDS = ["savar", "ashulia", "dhamrai", "keraniganj", "nawabganj", "dohar"];
const DHAKA_SUBURB_ZONES = [
  "jamgora", "shimultola jamgora", "baipail", "hemayetpur", "zirabo", "zirani",
  "nischintapur", "nobinagar", "amin bazar", "akran bazar", "bakurta", "epz",
  "kalampur", "kholamura",
];

export function getDeliveryTier(districtName, thanaName) {
  const district = String(districtName || "").trim().toLowerCase();
  const thana = String(thanaName || "").trim().toLowerCase();

  let deliveryZone = "outside_dhaka";
  if (district === "dhaka") {
    const isSuburb =
      DHAKA_SUBURB_KEYWORDS.some((k) => thana.includes(k)) || DHAKA_SUBURB_ZONES.includes(thana);
    deliveryZone = isSuburb ? "dhaka_suburb" : "inside_dhaka";
  } else if (district === "gazipur" || district === "narayanganj") {
    deliveryZone = "dhaka_suburb";
  }
  return { deliveryZone, deliveryCharge: DELIVERY_CHARGES[deliveryZone] };
}
