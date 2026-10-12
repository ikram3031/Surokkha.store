# 15. Pathao Courier Dispatch Modal Dropdown Labels Fix

## 1. Overview & Issue Description

When opening the **"Dispatch Order #... to Pathao"** modal (`PathaoCourierCard.jsx`) from the Admin Dashboard, the dropdown fields were displaying raw database / API IDs inside the select trigger boxes instead of their human-readable names and text labels:

- **Pickup Store**: Displayed raw store ID (e.g. `478656`) instead of the store's name and address (e.g. `Surokkha Main Store (House 123, Road 4...)`).
- **City**: Displayed raw numeric city ID (e.g. `1`) instead of the city/division name (e.g. `Dhaka`).
- **Zone**: Displayed raw numeric zone ID (e.g. `1538`) instead of the zone name (e.g. `Savar`).
- **Area / Thana**: Displayed raw numeric area ID (e.g. `25851`) instead of the area/thana name (e.g. `Ashulia`).
- **Delivery Speed**: Displayed numeric hours (e.g. `48`) instead of human-readable text (e.g. `Normal Delivery (48h)`).

The same issue also affected the Pathao Courier Settings page (`dashboard/src/pages/dashboard/settings/pathaoCourier.jsx`) for the Default Store, Item Type, Delivery Speed, and Delivery Fee Calculator dropdowns.

---

## 2. Root Cause Analysis

The dashboard UI uses `@base-ui/react/select` for its `<Select>` component.
In `@base-ui/react`:
1. `<SelectPrimitive.Popup>` is not mounted until opened, so `<SelectPrimitive.Value>` cannot inspect unmounted `<SelectItem>` children to infer labels.
2. In `<SelectPrimitive.Value>`, if neither `items` (on `<Select>`) nor a formatting function (`children?: (value) => ReactNode` on `<SelectValue>`) is provided, `resolveSelectedLabel(value)` falls back to `stringifyAsLabel(value)`, which simply converts the raw controlled `value` into a string.
3. As a result, the closed select triggers rendered `478656`, `1`, `1538`, `25851`, and `48`.

---

## 3. Solution Implemented

### A. Dispatch Modal (`dashboard/src/components/dashboard/orders/PathaoCourierCard.jsx`)
1. **Memoized Option Lists**:
   - `storeItems`: Maps store list to `{ value: String(store_id), label: `${store_name} (${store_address})` }`.
   - `cityItems`: Maps cities list to `{ value: String(city_id), label: city_name }`.
   - `zoneItems`: Maps zones list to `{ value: String(zone_id), label: zone_name }`.
   - `areaItems`: Maps areas list to `{ value: String(area_id), label: area_name }`.
   - `deliverySpeedItems`: Defined as `[{ value: "48", label: "Normal Delivery (48h)" }, { value: "12", label: "On Demand (12h)" }]`.
2. **Dual-Layer Label Resolution**:
   - Passed `items={...}` directly to each `<Select>`.
   - Provided formatter callback functions `children={(val) => ...}` inside `<SelectValue>`:
     - **Pickup Store**: Finds matching store and renders `${store_name} (${store_address})` or fallback to configured store in settings.
     - **City**: Finds matching city and renders `city_name` (e.g. `Dhaka`).
     - **Zone**: Finds matching zone and renders `zone_name` (e.g. `Savar`).
     - **Area / Thana**: Finds matching area and renders `area_name` (e.g. `Ashulia`).
     - **Delivery Speed**: Formats `"48"` to `"Normal Delivery (48h)"` and `"12"` to `"On Demand (12h)"`.
3. **Store Fallback Enhancement**:
   - In `handleOpenDispatchModal`, if Pathao's stores API returns an empty list, the configured store from `StoreSettingsModel` is automatically injected into `stores`, ensuring the store name and address are always visible.

### B. Pathao Courier Settings Page (`dashboard/src/pages/dashboard/settings/pathaoCourier.jsx`)
- Applied matching `<SelectValue>` formatters for:
  - **Default Store ID**: Displays `${store_name} (${store_address})`.
  - **Item Type**: Displays `Parcel (Standard Goods)` vs `Document`.
  - **Delivery Speed**: Displays `Standard Normal (48 Hours)` vs `On Demand (Same / Next Day)`.
  - **Calculator City**: Displays `city_name`.
  - **Calculator Zone**: Displays `zone_name`.
  - **Calculator Area**: Displays `area_name (Home Delivery)`.

---

## 4. Verification

1. **Linter**: Ran `npx oxlint` — 0 errors, 0 warnings.
2. **Vite Build**: Ran `npm run build` — 100% successful with all modules bundled cleanly.
3. **Cross-Repo Sync**: Synced to `D:\mtEcomWhite` and verified against git status.
