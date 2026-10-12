# Searchable Location Dropdown (District & Thana) & Pathao Sync Guide

## 1. Overview & Business Objective
In Bangladesh e-commerce operations, order creation requires accurate recipient **District (City)** and **Thana (Upazila / Zone)** information. When dispatching parcels via **Pathao Courier**, consignments require exact matching with Pathao's recognized cities and zones (`city_id` and `zone_id`).

Previously, admin order forms relied on static 64-district hardcoded arrays with limited thana coverage (only Dhaka, Gazipur, and Narayanganj), manual free-text inputs, and hardcoded values for in-store orders.

This update introduces a **Shadcn-styled Searchable Async Dropdown (Combobox)** for both:
1. **New Custom Order Page** (`newCustomOrder.jsx`): Full billing & recipient shipping location selection.
2. **New In-Store / POS Order Page** (`newOrder.jsx`): Counter sale & walk-in customer location selection.

---

## 2. Architecture & Components

```
+-----------------------------------------------------------------------------------+
|                            Admin Dashboard UI                                     |
|                                                                                   |
|   +-----------------------+                    +------------------------------+   |
|   |   DistrictCombobox    |                    |        ThanaCombobox         |   |
|   |  - Real-time search   |                    |  - Auto-filtered by district |   |
|   |  - English + Bengali  |                    |  - Real-time search          |   |
|   |  - In-memory cached   |                    |  - Custom entry allowed      |   |
|   +-----------+-----------+                    +--------------+---------------+   |
|               |                                               |                   |
|               +-----------------------+-----------------------+                   |
|                                       |                                           |
|                          SearchableCombobox.jsx                                   |
|                     (Built on Base UI / Shadcn Popover)                           |
+---------------------------------------+-------------------------------------------+
                                        | Axios (apiClient)
                                        v
+-----------------------------------------------------------------------------------+
|                             Backend API Service                                   |
|                                                                                   |
|   - GET /api/v1/courier/districts           -> 64 Districts (with embedded thanas)|
|   - GET /api/v1/courier/districts/:id/thanas-> Query by cityId OR districtName   |
|   - POST /api/v1/courier/pathao/sync-locations -> Sync directly from Pathao API   |
+---------------------------------------+-------------------------------------------+
                                        | Mongoose
                                        v
+-----------------------------------------------------------------------------------+
|                             MongoDB Database                                      |
|                                                                                   |
|   - Collection: districts (64 documents, indexed by cityId & name)               |
|   - Collection: thanas    (237+ documents, indexed by zoneId, cityId & district)  |
+-----------------------------------------------------------------------------------+
```

---

## 3. Frontend Component Breakdown

### 3.1. Popover Primitive (`src/components/ui/popover.jsx`)
Standard Shadcn Popover component wrapping `@base-ui/react/popover`:
- `Popover`: Root controller.
- `PopoverTrigger`: Anchors the popup positioning.
- `PopoverContent`: Floating dropdown menu with automatic boundary detection, collision padding, smooth fade/scale animations, and anchor-width matching (`matchTriggerWidth`).

### 3.2. Generic Searchable Combobox (`src/components/ui/searchable-combobox.jsx`)
Universal combobox providing:
- **Instant Search:** Filters by English name, Bengali name (`bnName`), or custom attributes.
- **Keyboard Navigation:** Arrow Up / Arrow Down to highlight items, Enter to select, Escape to dismiss.
- **Custom Location Option:** If a customer lives in an unlisted area, typing the name displays `+ Use "[typed text]"` to avoid blocking order creation.
- **Clear Button (`X`):** One-click reset for rapid counter workflow.
- **Async Loader:** Displays animated spinner while fetching options.

### 3.3. Custom Location Hooks (`src/hooks/use-locations.js`)
- `useDistricts()`:
  - Fetches from `/api/v1/courier/districts`.
  - Caches results globally in-memory (`cachedDistricts`) to prevent redundant network calls across multiple components on the same screen.
  - Automatically falls back to offline seeder (`src/data/districts.js`) if network fails.
- `useThanas(districtIdentifier, districtsList)`:
  - Resolves district by either `cityId` or `name`.
  - Checks if the district record already has embedded thanas for zero-latency instant rendering.
  - Caches thanas per district in `cachedThanasByCity` Map.
  - Calls `/api/v1/courier/districts/:target/thanas` if not cached.

### 3.4. Location Dropdowns (`src/components/orders/LocationCombobox.jsx`)
- `<DistrictCombobox value={district} onChange={setDistrict} />`
- `<ThanaCombobox district={district} value={thana} onChange={setThana} />`
  - Disabled with prompt `"Select district first"` when no district is selected.
  - Automatically resets thana when the parent district changes.

---

## 4. Pages Integrated

### 4.1. New Custom Order (`src/pages/dashboard/orders/newCustomOrder.jsx`)
- **Billing Location:**
  - District: `<DistrictCombobox value={billingDistrict} onChange={...} />`
  - Thana: `<ThanaCombobox district={billingDistrict} value={billingThana} onChange={...} />`
- **Shipping Location (when shipping to different address):**
  - District: `<DistrictCombobox value={shipDistrict} onChange={...} />`
  - Thana: `<ThanaCombobox district={shipDistrict} value={shipThana} onChange={...} />`
- **Delivery Fee Calculation:** Automatically updates fee based on selected district and thana:
  - Dhaka Suburbs (Savar, Keraniganj, Dhamrai, Ashulia, etc.): ৳90
  - Dhaka City: ৳70
  - Gazipur / Narayanganj: ৳90
  - Outside Dhaka: ৳120

### 4.2. In-Store / POS Order (`src/pages/dashboard/orders/newOrder.jsx`)
- Added District & Thana fields directly into the **Customer Info** card.
- Defaults to `Dhaka` for quick walk-in processing.
- Feeds `billingInfo.district` and `billingInfo.thana` directly into the order payload.
- Summary modal displays customer's selected location: e.g. `Dhaka (Dhanmondi)`.
- Automatically resets form state upon order completion.

---

## 5. Backend Endpoints

### 5.1. List All Active Districts
- **Method:** `GET /api/v1/courier/districts`
- **Auth:** Bearer Token (`authenticateToken`)
- **Response:**
```json
{
  "status": "success",
  "count": 64,
  "data": [
    {
      "cityId": 1,
      "name": "Dhaka",
      "bnName": "ঢাকা",
      "totalZones": 51,
      "thanas": [
        { "zoneId": 101, "name": "Dhanmondi", "bnName": "ধানমন্ডি" },
        { "zoneId": 102, "name": "Gulshan", "bnName": "গুলশান" }
      ]
    }
  ]
}
```

### 5.2. List Thanas for a District
- **Method:** `GET /api/v1/courier/districts/:cityId/thanas`
- **Note:** Supports either numeric `cityId` (e.g. `1`) OR district name (e.g. `Dhaka` or `Chittagong`).
- **Response:**
```json
{
  "status": "success",
  "count": 51,
  "data": [
    {
      "zoneId": 101,
      "cityId": 1,
      "districtName": "Dhaka",
      "name": "Dhanmondi",
      "bnName": "ধানমন্ডি",
      "areasCount": 18
    }
  ]
}
```

### 5.3. Synchronize Locations from Pathao API
- **Method:** `POST /api/v1/courier/pathao/sync-locations`
- **Auth:** Protected (Owner, Admin)
- **CLI Sync Command:**
```bash
node backend/src/common/scripts/syncPathaoLocations.js
```
- Fetches live cities, zones, and areas from Pathao Courier API and upserts into MongoDB `districts` and `thanas` collections.

---

## 6. Verification & Build Confirmation
- **OxLint:** 0 errors across all UI, hook, and page files.
- **Vite Production Build:** Successfully compiled with 0 errors.
- **Git Branch Synchronization:** Committed and pushed to `dev` branch on both `WhiteLabelEcommerce` (`D:\mtEcomWhite`) and `Surokkha.store` (`D:\Surokkha.store`).
