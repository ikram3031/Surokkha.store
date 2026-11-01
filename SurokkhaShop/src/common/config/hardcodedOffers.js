// Hard-coded special offer prices (BDT), applied on the storefront on top of whatever the API returns.
// Order here is the display order in the home page "Special Offers" strip.
// Keys are the MongoDB ids of the product / item.
export const HARDCODED_OFFERS = [
  { id: '6adce8d4875a6ceb291a81cc', price: 600 }, // MO 3-in-1 Smart Pack (15 pcs)
  { id: '6ab81e97721c81cc89211371', price: 750 },
  { id: '6ad3ceaa778c3e05ca22b2bd', price: 950 },
  { id: '6ad8dda0eff696db832189c7', price: 250 }, // item
];

export const HARDCODED_OFFER_PRICES = Object.fromEntries(HARDCODED_OFFERS.map((o) => [o.id, o.price]));
