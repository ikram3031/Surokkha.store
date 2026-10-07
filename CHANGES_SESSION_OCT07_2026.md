# Surokkha Platform - Session Documentation & Architecture Changes
**Date:** October 7, 2026  
**Branch:** `Live`  
**Latest Backend Release Version:** `SS_1.0.05`  
**Latest Multi-Component Release Version:** `v1.0.20`  

---

## 1. Executive Summary
এই সেশনে ডাটাবেজ ক্লিনআপ, স্কিমা রিফ্যাক্টরিং, নতুন সমান্তরাল এনটিটি (`Item`) আর্কিটেকচার প্রণয়ন, অ্যাডমিন ড্যাশবোর্ড ইন্টিগ্রেশন এবং লাইভ প্রোডাকশন ডিপ্লয়মেন্ট সম্পন্ন করা হয়েছে। মূল লক্ষ্য ছিল "MO" ব্র্যান্ডেড কনট্রাসেপটিভ প্রোডাক্টগুলোকে মূল `products` কালেকশনে রাখা এবং পূর্ববর্তী নন-MO (অন্যান্য ব্র্যান্ডের) ৭টি প্রোডাক্টকে পৃথক `items` কালেকশনে রূপান্তর করা।

---

## 2. ডাটাবেজ ব্যাকআপ ও কালেকশন ক্লিনআপ (Live Database)
1. **সম্পূর্ণ ডাটাবেজ ব্যাকআপ:**
   - ড্রপ করার পূর্বে লাইভ মঙ্গোডিবি থেকে ব্যাকআপ সংরক্ষণ করা হয়েছে:
     - `F:\my drive\surokkha_full_db_backup.archive`
     - `F:\my drive\surokkha_full_db_bson.tar.gz`
   - কালেকশন ব্যাকআপ JSON হিসেবে রাখা হয়েছে: `exports/surokkha_products.json`
2. **`products` কালেকশন ড্রপ ও ফ্রেশ ইনসার্ট:**
   - পূর্ববর্তী মিক্সড ডাটাবেজ ক্লিন করার জন্য লাইভ `products` কালেকশন ড্রপ করা হয়েছে।
   - শুধুমাত্র অফিশিয়াল ৭টি "MO" ব্র্যান্ডেড প্রোডাক্ট নতুন স্কিমায় ইনসার্ট করা হয়েছে (যাতে `price` এবং `offerPrice` সঠিক সংখ্যায়/English Integers থাকে)।

---

## 3. প্রোডাক্ট স্কিমা রিফ্যাক্টরিং (`product.model.js`)
অপ্রয়োজনীয় এবং লিগ্যাসি ফিল্ডসমূহ ডাটাবেজ স্কিমা থেকে বাদ দেওয়া হয়েছে:
- **অপসারিত ফিল্ডসমূহ:**
  - `chargeTax`
  - `taxRate`
  - `images` (বর্তমানে `imageUrl`, `thumbnailUrl`, `gallery` ব্যবহৃত হচ্ছে)
  - `season`
  - `notes`
- প্রোডাক্টের ক্যাশ-বাস্টিং ও কুয়েরি অপ্টিমাইজেশনের জন্য `buildProductFilter` এ `_t` প্যারামিটার ফিল্টার আউট করার হ্যান্ডলার যুক্ত করা হয়েছে।

---

## 4. নতুন এনটিটি: `Item` আর্কিটেকচার (`ItemModel`)
প্রোডাক্টের সমান্তরালে পৃথক ইনভেন্টরি আইটেম ট্র্যাক করার জন্য `Item` মডেল, কন্ট্রোলার এবং রাউট তৈরি করা হয়েছে।

### ক. ব্যাকঅফিস ও ডাটাবেজ মডেল (`backend/src/common/models/item.model.js`)
- `ItemModel` তৈরি করা হয়েছে যার মধ্যে রয়েছে:
  - `name`, `slug`, `did`, `sku`, `type` (simple/variant), `price`, `offerPrice`, `stock`, `categories`, `benefits`, `specifications`, `faqs`, `sections`, ইত্যাদি।
  - স্বয়ংক্রিয় `did` জেনারেটর এবং টেক্সট/ক্যাটাগরি ইনডেক্সিং।

### খ. Storefront ও Service API এন্ডপয়েন্টস
- **Storefront API (`/api/v1/items`):**
  - `GET /api/v1/items` : পাবলিক আইটেম লিস্ট ও ফিল্টারিং।
  - `GET /api/v1/items/:identifier` : স্লাগ, আইডি বা ডিআইডি দিয়ে আইটেম ডিটেইলস ভিউ।
  - `POST /api/v1/items/search` : অ্যাডভান্সড ফিল্টার কুয়েরি।
  - `GET /api/v1/items/feed/meta-catalog.csv` : মেটা ক্যাটালগ এক্সপোর্ট।
  - মাউন্ট করা হয়েছে: `backend/src/storefront/routes.js` এ `storefrontRouter.use("/items", itemsRouter)` হিসেবে।
- **Service API (`/api/v1/items` ও `/api/v2/items`):**
  - `GET /api/v1/items` : ড্যাশবোর্ড আইটেম লিস্ট।
  - `POST /api/v1/items` : নতুন আইটেম তৈরি (`authenticateToken` প্রটেক্টেড)।
  - `PUT /api/v1/items/:id` : আইটেম আপডেট (`Owner`, `Admin`, `Manager` রোল ভিত্তিক)।
  - `DELETE /api/v1/items/:id` : আইটেম ডিলিট।
  - মাউন্ট করা হয়েছে: `backend/src/service/routes.js` এ `serviceRouter.use("/items", itemsRouter)` হিসেবে।

---

## 5. অ্যাডমিন ড্যাশবোর্ড ইন্টিগ্রেশন (`dashboard/`)
ড্যাশবোর্ডে প্রোডাক্ট ম্যানেজমেন্টের মতোই পূর্ণাঙ্গ আইটেম ম্যানেজমেন্ট ফিচার যুক্ত করা হয়েছে:
1. **হুক (`dashboard/src/hooks/use-items.js`):**
   - React Query (`@tanstack/react-query`) ভিত্তিক `useItems`, `useItem`, `useCreateItem`, `useUpdateItem`, `useDeleteItem` হুকসমূহ তৈরি।
2. **কম্পোনেন্টস ও পেইজ:**
   - `items-table.jsx`: ফিল্টারিং, সার্চিং, ব্যাচ অ্যাকশন ও ডিলিট কনফার্মেশন সহ আইটেমস ডেটা টেবিল।
   - `itemsList.jsx`: প্রধান আইটেমস তালিকা ও অ্যানালিটিক্স সামারি কার্ড।
   - `addNewItem.jsx`: মাল্টি-ট্যাব আইটেম ক্রিয়েশন ফর্ম (বেসিক ডিটেইলস, প্রাইসিং, স্টক, স্পেসিফিকেশনস, এফএকিউ, এসইও)।
   - `itemDetails.jsx`: আইটেম ভিউ এবং এডিট স্ক্রিন।
3. **রাউটার ও সাইডবার নেভিগেশন:**
   - `dashboard/src/router.jsx`: `/dashboard/items`, `/dashboard/items/add`, `/dashboard/items/:id` রাউট রেজিস্টার করা হয়েছে।
   - `dashboard/src/components/dashboard/app-sidebar.jsx`: সাইডবারে "Items" নেভিগেশন লিংক এবং ক্রিয়েট শর্টকাট যুক্ত করা হয়েছে।
   - `dashboard/src/config/core.json`: আইটেম মডিউলের জন্য পারমিশন ও কনফিগ কি রেজিস্টার করা হয়েছে।

---

## 6. লাইভ ডাটাবেজে ৭টি নন-MO আইটেম মাইগ্রেশন
নন-MO ৭টি প্রোডাক্টের ডেটা সম্পূর্ণ ইংরেজিতে `surokkha-db` এর `items` কালেকশনে সফলভাবে ইনসার্ট করা হয়েছে:
1. `Nothing Climax Delay Natural Latex Contraceptive (Pack of 10)` (SKU: `SKU-4834`, Price: ৳450, Offer: ৳150)
2. `Warm Textured Dotted & Ribbed Natural Latex Contraceptive (Pack of 10)` (SKU: `SKU-5184`, Price: ৳430, Offer: ৳289)
3. `Strawberry Flavored 1500+ Dotted Natural Latex Contraceptive (Pack of 10)` (SKU: `SKU-6061`, Price: ৳430, Offer: ৳285)
4. `Viga 8 Million Super Strong Desensitizing Spray` (SKU: `VIGA-8M-SUPER-STRONG`, Price: ৳1250, Offer: ৳1199)
5. `Super Viga 10 Million Desensitizing Spray` (SKU: `SUPER-VIGA-10M`, Price: ৳1250, Offer: ৳1150)
6. `KY Jelly Personal Lubricant Gel 50g` (SKU: `SKU-3154`, Price: ৳450, Offer: ৳249)
7. `Maxman 75000 Long Time Delay Spray for Men 45ml` (SKU: `4014009356897`, Price: ৳1250, Offer: ৳600)

---

## 7. ভার্সন কন্ট্রোল ও লাইভ ভিপিএস ডিপ্লয়মেন্ট
1. **গিট কমিট ও পুশ:**
   - সমস্ত ফাইল কমিট করা হয়েছে:
     - Commit Hash: `4e3057f`
     - Commit Msg: `feat(items): add Item model, storefront & service routes, dashboard items management, update product schema, bump backend version to SS_1.0.05`
   - `Live` ব্রাঞ্চে সরাসরি পুশ সম্পন্ন হয়েছে।
2. **ভিপিএস ডিপ্লয়মেন্ট (`make deploy`):**
   - ভিপিএস-এ (`14.128.14.223`) অটোমেটেড `make deploy` এক্সিকিউট করা হয়েছে:
     - `frontend` (Store & Shop) সফলভাবে অপ্টিমাইজড বিল্ড তৈরি করেছে।
     - `dashboard` সফলভাবে বিল্ড হয়ে `/opt/clients/surokkha/dashboard/dist` এ ডিপ্লয় হয়েছে।
     - `catalog` বিল্ড সম্পন্ন হয়েছে।
     - ব্যাকএন্ড নোড সার্ভিসেস (`surokkha-storefront`, `surokkha-dashboard`) অটো-রিস্টার্ট ও হেলথচেক ভেরিফাই করা হয়েছে।
     - সিস্টেম নোটিফিকেশন মেইল ও ড্যাশবোর্ড অ্যালার্ট জেনারেট হয়েছে (`v1.0.20` রিলিজ হিসেবে)।

---

## 8. ফাইলের পরিবর্তন তালিকা (File Modifications List)
| মডিউল | ফাইল পাথ | অ্যাকশন |
|---|---|---|
| Git | `.gitignore` | `exports/` ফোল্ডার যুক্ত |
| Backend | `backend/package.json` | ভার্সন বাম্প `SS_1.0.05` |
| Backend | `backend/src/common/models/product.model.js` | লিগ্যাসি ট্যাক্স ও নোটস ফিল্ড রিমুভ |
| Backend | `backend/src/common/models/item.model.js` | নতুন `ItemModel` তৈরি |
| Backend | `backend/src/storefront/controllers/ItemsController.js` | পাবলিক আইটেম কন্ট্রোলার |
| Backend | `backend/src/storefront/routes/ItemsRoute.js` | পাবলিক আইটেম রাউটস |
| Backend | `backend/src/storefront/routes.js` | `/items` মাউন্ট |
| Backend | `backend/src/service/controllers/ItemsController.js` | ড্যাশবোর্ড আইটেম কন্ট্রোলার |
| Backend | `backend/src/service/routes/ItemsRoute.js` | ড্যাশবোর্ড আইটেম CRUD রাউটস |
| Backend | `backend/src/service/routes.js` | `/items` মাউন্ট |
| Dashboard | `dashboard/src/hooks/use-items.js` | আইটেম কুয়েরি হুকস |
| Dashboard | `dashboard/src/components/dashboard/items-table.jsx` | আইটেম টেবিল ভিউ |
| Dashboard | `dashboard/src/pages/dashboard/items/itemsList.jsx` | আইটেম মেইন পেজ |
| Dashboard | `dashboard/src/pages/dashboard/items/addNewItem.jsx` | আইটেম অ্যাড পেজ |
| Dashboard | `dashboard/src/pages/dashboard/items/itemDetails.jsx` | আইটেম এডিট ও ভিউ পেজ |
| Dashboard | `dashboard/src/components/dashboard/app-sidebar.jsx` | সাইডবার মেনু আপডেট |
| Dashboard | `dashboard/src/router.jsx` | ড্যাশবোর্ড রাউট কনফিগারেশন |
| Dashboard | `dashboard/src/config/core.json` | পারমিশন ও মডিউল কনফিগ |
