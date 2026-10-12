/**
 * Surokkha Catalog - Production Fallback Products Data
 * 
 * Strict Catalog Rules:
 * - NO Meta Pixel, NO Facebook SDK, NO CAPI tracking
 * - Real explicit product names, images, specs, and descriptions
 * - Covers all 14 official products from Surokkha inventory
 */

export const CDN_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.surokkha.store';

export const resolveImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${CDN_BASE}${cleanPath}`;
};

export const CATEGORIES = [
  { id: 'all', label: 'সকল প্রোডাক্ট', labelEn: 'All Products' },
  { id: 'condom', label: 'কনডম', labelEn: 'Condoms' },
  { id: 'spray', label: 'লং টাইম স্প্রে', labelEn: 'Delay Sprays' },
  { id: 'lubricant', label: 'লুব্রিকেন্ট জেল', labelEn: 'Lubricant Gel' },
  { id: 'combo', label: 'কম্বো অফার', labelEn: 'Combo Offers' },
];

export const FALLBACK_PRODUCTS = [
  {
    id: 'maxman-75000-long-time-delay-spray-for-men-45ml',
    slug: 'maxman-75000-long-time-delay-spray-for-men-45ml',
    name: 'Maxman 75000 Long Time Delay Spray for Men (45ml)',
    name_bn: 'ম্যাক্সম্যান ৭৫০০০ লং টাইম ডিলে স্প্রে (৪৫ মি.লি.)',
    category: 'spray',
    category_name: 'লং টাইম স্প্রে',
    brand: 'Maxman',
    origin: 'Original Imported (Germany Formula)',
    price: 1250,
    regularPrice: 1250,
    offerPrice: 600,
    discountPercentage: 52,
    packSize: '৪৫ মি.লি. লার্জ বোতল',
    stockStatus: 'instock',
    isOutOfStock: false,
    stockAmount: 50,
    imageUrl: resolveImageUrl('/uploads/2610/261006/product_whatsapp-image-2026-10-06-at-3-22-25-2k-20261006163426_1791283533648.webp'),
    images: [
      resolveImageUrl('/uploads/2610/261006/product_whatsapp-image-2026-10-06-at-3-22-25-2k-20261006163426_1791283533648.webp'),
    ],
    tagline: '৪৫ মি.লি. প্রিমিয়াম লং এক্টিং পারফরম্যান্স ডিলে স্প্রে',
    description: 'পুরুষদের জন্য প্রস্তুতকৃত বিশ্বখ্যাত ম্যাক্সম্যান ৭৫০০০ লং টাইম ডিলে স্প্রে। অতিরিক্ত সংবেদনশীলতা কমিয়ে দীর্ঘ সময় ধরে পারফরম্যান্স ও নিয়ন্ত্রণের জন্য পরীক্ষিত কার্যকর সমাধান। এতে রয়েছে ভিটামিন-ই সমৃদ্ধ ত্বক-বান্ধব ফর্মুলা যা সম্পূর্ণ নিরাপদ।',
    technicalSpecs: {
      'পরিমাণ': '৪৫ মি.লি. (প্রায় ১০০+ বার ব্যবহারের উপযোগী)',
      'উপাদান': 'ভিটামিন-ই সমৃদ্ধ ডেসেনসিটাইজিং ফর্মুলেশন',
      'কার্যকারিতা': 'মিলনের সময় ২০ থেকে ৪০ মিনিট পর্যন্ত নিয়ন্ত্রণ ও স্থায়িত্ব বৃদ্ধিতে সহায়ক',
      'ব্যবহার বিধি': 'মিলনের ১০-১৫ মিনিট পূর্বে ৩-৪ বার হালকা স্প্রে করুন',
      'পার্শ্বপ্রতিক্রিয়া': 'সম্পূর্ণ নিরাপদ, তেলহীন ও চর্মরোগ বিশেষজ্ঞদের দ্বারা অনুমোদিত',
      'মেয়াদ': '২০৩০ সাল পর্যন্ত'
    },
    benefits: [
      'মিলনের স্থায়িত্ব উল্লেখযোগ্যভাবে বৃদ্ধি করে',
      'অতিরিক্ত সংবেদনশীলতা নিয়ন্ত্রণ করে মানসিক তৃপ্তি প্রদান করে',
      'ভিটামিন-ই সমৃদ্ধ হওয়ায় ত্বকে কোনো প্রকার অস্বস্তি হয় না',
      '১০০% গোপনীয় সিল করা মোড়কে ক্যাশ অন হোম ডেলিভারি'
    ]
  },
  {
    id: 'ky-jelly-personal-lubricant-gel-50g',
    slug: 'ky-jelly-personal-lubricant-gel-50g',
    name: 'KY Jelly Personal Lubricant Gel (50g)',
    name_bn: 'কে-ওয়াই জেলি পার্সোনাল লুব্রিকেন্ট জেল (৫০ গ্রাম)',
    category: 'lubricant',
    category_name: 'লুব্রিকেন্ট জেল',
    brand: 'Johnson & Johnson',
    origin: 'Original Imported',
    price: 450,
    regularPrice: 450,
    offerPrice: 300,
    discountPercentage: 33,
    packSize: '৫০ গ্রাম টিউব',
    stockStatus: 'instock',
    isOutOfStock: false,
    stockAmount: 50,
    imageUrl: resolveImageUrl('/uploads/2610/261003/thumb_ky-jelly-personal-lubricant-gel-50g_main_1791056700015.webp'),
    images: [
      resolveImageUrl('/uploads/2610/261003/thumb_ky-jelly-personal-lubricant-gel-50g_main_1791056700015.webp'),
    ],
    tagline: 'ওয়াটার-বেসড জীবাণুমুক্ত পার্সোনাল লুব্রিকেন্ট জেল',
    description: 'বিশ্বখ্যাত জনসন অ্যান্ড জনসনের অরিজিনাল ওয়াটার-সল্যুবল ব্যক্তিগত লুব্রিকেটিং জেলি। শারীরিক অস্বস্তি ও শুষ্কতা দ্রুত দূর করে অত্যন্ত প্রাকৃতিক ও মসৃণ অনুভূতি প্রদান করে। এটি সম্পূর্ণ তেলহীন, গন্ধহীন এবং কনডমের সাথে ১০০% নিরাপদ।',
    technicalSpecs: {
      'নেট ওজন': '৫০ গ্রাম টিউব',
      'বেস উপাদান': 'ওয়াটার বেসড (সহজে পানি দিয়ে পরিষ্কারযোগ্য)',
      'নিরাপত্তা': '১০০% কনডম কম্প্যাটিবল ও জীবাণুমুক্ত',
      'টেক্সচার': 'নন-গ্রিসি, নন-স্টিকি ও সম্পূর্ণ মসৃণ',
      'সুগন্ধি': 'কৃত্রিম গন্ধহীন ও হাইপোঅ্যালার্জেনিক'
    },
    benefits: [
      'যেকোনো প্রকার শারীরিক শুষ্কতা ও ব্যথা তৎক্ষণাৎ দূর করে',
      'ল্যাটেক্স ও সব ধরনের কনডমের সাথে ১০০% নিরাপদ',
      'তেল ছাড়া ওয়াটার বেসড হওয়ায় ধোয়ার পর কোনো দাগ ফেলে না',
      'চর্মরোগ বিশেষজ্ঞ ও চিকিৎসকদের দ্বারা বিশ্বব্যাপী সুপারিশকৃত'
    ]
  },
  {
    id: 'super-viga-10-million-desensitizing-spray',
    slug: 'super-viga-10-million-desensitizing-spray',
    name: 'Super Viga 10 Million Delay Spray',
    name_bn: 'সুপার ভিগা ১০ মিলিয়ন লং টাইম স্প্রে (অরিজিনাল জার্মানি)',
    category: 'spray',
    category_name: 'লং টাইম স্প্রে',
    brand: 'Viga Germany',
    origin: 'Original Germany',
    price: 1250,
    regularPrice: 1250,
    offerPrice: 1150,
    discountPercentage: 8,
    packSize: '৪৫ মি.লি. প্রিমিয়াম বোতল',
    stockStatus: 'instock',
    isOutOfStock: false,
    stockAmount: 40,
    imageUrl: resolveImageUrl('/uploads/2610/261006/product_whatsapp-image-2026-10-06-at-3-22-25-2k-20261006163421_1791283461132.webp'),
    images: [
      resolveImageUrl('/uploads/2610/261006/product_whatsapp-image-2026-10-06-at-3-22-25-2k-20261006163421_1791283461132.webp'),
    ],
    tagline: 'সর্বোচ্চ ক্ষমতার ডিসেনসিটাইজিং স্প্রে ও ভিটামিন-ই ফর্মুলা',
    description: 'জার্মানির বিখ্যাত সুপার ভিগা ১০ মিলিয়ন ম্যাক্সিমাম স্ট্রেন্থ টাইমিং কন্ট্রোল স্প্রে। ভিটামিন-ই ফর্মুলায় সমৃদ্ধ হওয়ায় মিলনের অনুভূতি অটুট রেখে সময় ও স্ট্যামিনা বৃদ্ধি করতে সাহায্য করে।',
    technicalSpecs: {
      'পরিমাণ': '৪৫ মি.লি.',
      'অরিজিন': 'জার্মানি ফর্মুলেশন',
      'বিশেষত্ব': 'ভিটামিন-ই যুক্ত স্কিন নারিশিং ফর্মুলা',
      'কার্যকারিতা': 'দ্রুত শোষণ এবং সর্বোচ্চ টাইমিং সাপোর্ট'
    },
    benefits: [
      'জার্মান গ্রেড প্রিমিয়াম কোয়ালিটি',
      'ভিটামিন-ই ত্বকের আর্দ্রতা ও সুরক্ষায় সাহায্য করে',
      'দ্রুত কার্যকর ও দীর্ঘস্থায়ী আত্মবিশ্বাস প্রদান করে'
    ]
  },
  {
    id: 'viga-8-million-super-strong-desensitizing-spray',
    slug: 'viga-8-million-super-strong-desensitizing-spray',
    name: 'Viga 8 Million Super Strong Delay Spray',
    name_bn: 'ভিগা ৮ মিলিয়ন সুপার স্ট্রং লং টাইম স্প্রে (অরিজিনাল জার্মানি)',
    category: 'spray',
    category_name: 'লং টাইম স্প্রে',
    brand: 'Viga Germany',
    origin: 'Original Germany',
    price: 1250,
    regularPrice: 1250,
    offerPrice: 1199,
    discountPercentage: 4,
    packSize: '৪৫ মি.লি. বোতল',
    stockStatus: 'instock',
    isOutOfStock: false,
    stockAmount: 35,
    imageUrl: resolveImageUrl('/uploads/2610/261006/product_whatsapp-image-2026-10-06-at-3-22-26-2k-20261006163430_1791283063162.webp'),
    images: [
      resolveImageUrl('/uploads/2610/261006/product_whatsapp-image-2026-10-06-at-3-22-26-2k-20261006163430_1791283063162.webp'),
    ],
    tagline: 'ভিটামিন-ই সমৃদ্ধ দীর্ঘস্থায়ী টাইম কন্ট্রোল স্প্রে',
    description: 'ভিগা ৮ মিলিয়ন সুপার স্ট্রং ডিসেনসিটাইজিং স্প্রে। মিলনের সময় নিয়ন্ত্রণ উন্নত করতে এবং অকাল বীর্যপাতের ভীতি দূর করতে বিশেষ জার্মান ফর্মুলেশনে তৈরি।',
    technicalSpecs: {
      'পরিমাণ': '৪৫ মি.লি.',
      'উৎপাদন দেশ': 'জার্মানি স্ট্যান্ডার্ড',
      'উপাদান': 'প্রাকৃতিক ভিটামিন-ই ও হালকা কুলিং এজেন্ট'
    },
    benefits: [
      'অরিজিনাল জার্মান স্ট্যান্ডার্ড মান',
      'সহজ ব্যবহার ও দ্রুত শোষিত ফর্মুলা',
      '১০০% গোপনীয় আনলেবেলড প্যাকেজিং ডেলিভারি'
    ]
  },
  {
    id: 'skore-nothing-climax-delay-natural-latex-contraceptive-10-pcs',
    slug: 'skore-nothing-climax-delay-natural-latex-contraceptive-10-pcs',
    name: 'Skore Nothing Climax Delay Condom (Pack of 10)',
    name_bn: 'স্কোর নাথিং ক্লাইম্যাক্স ডিলে কনডম (১০ পিস)',
    category: 'condom',
    category_name: 'কনডম',
    brand: 'Skore',
    origin: 'Imported (ISO 4074 / CE Certified)',
    price: 450,
    regularPrice: 450,
    offerPrice: 150,
    discountPercentage: 67,
    packSize: '১০ পিস (১ বক্স)',
    stockStatus: 'instock',
    isOutOfStock: false,
    stockAmount: 100,
    imageUrl: resolveImageUrl('/uploads/2610/261006/product_imgi-14-eyjidwnrzxqioijhcm9nz2eilcjrzxkioijqcm9kdwn0lxbfaw1hz2vzxc8zmtqymvwvmze0mjetu2tvcmuttm90agluzy1uaglubmvzdc1dbglt-jpeg-2k-20261006154927_1791282493989.webp'),
    images: [
      resolveImageUrl('/uploads/2610/261006/product_imgi-14-eyjidwnrzxqioijhcm9nz2eilcjrzxkioijqcm9kdwn0lxbfaw1hz2vzxc8zmtqymvwvmze0mjetu2tvcmuttm90agluzy1uaglubmvzdc1dbglt-jpeg-2k-20261006154927_1791282493989.webp'),
    ],
    tagline: 'ক্লাইম্যাক্স ডিলে ফর্মুলা সহ আল্ট্রা থিন আরাম ও দীর্ঘস্থায়ী সুরক্ষা',
    description: 'স্কোর নাথিং ক্লাইম্যাক্স ডিলে কনডমে রয়েছে স্কিন-থিন অতি-পাতলা মেমব্রেন এবং বিশেষ ডিলে লুব্রিকেন্ট ফর্মুলা। এটি মিলনের সময়কে দীর্ঘস্থায়ী করতে এবং যুগপৎ গভীর অনুভূতি বজায় রাখতে অসাধারণ কার্যকর।',
    technicalSpecs: {
      'বক্স সাইজ': '১০ পিস সিল করা প্যাক',
      'মেটেরিয়াল': 'প্রিমিয়াম ন্যাচারাল ল্যাটেক্স',
      'প্রস্থ': '৫৩ মিমি (স্ট্যান্ডার্ড ফিট)',
      'লুব্রিকেন্ট': 'বিশেষ ক্লাইম্যাক্স ডিলে লুব্রিকেন্ট',
      'পরীক্ষা': '১০০% ইলেকট্রনিকভাবে টেস্টেড'
    },
    benefits: [
      'ক্লাইম্যাক্স ডিলে বিশেষ ফর্মুলায় দীর্ঘস্থায়ী তৃপ্তি',
      'আল্ট্রা থিন দেয়াল হওয়ায় অত্যন্ত প্রাকৃতিক অনুভূতি',
      '৬৭% ছাড়ের সেরা ধামাকা অফার'
    ]
  },
  {
    id: 'skore-warm-textured-dotted-ribbed-natural-latex-contraceptive-10-pcs',
    slug: 'skore-warm-textured-dotted-ribbed-natural-latex-contraceptive-10-pcs',
    name: 'Skore Warm Textured Dotted & Ribbed Condom (Pack of 10)',
    name_bn: 'স্কোর ওয়ার্ম টেক্সচার্ড ডটেড ও রিবড কনডম (১০ পিস)',
    category: 'condom',
    category_name: 'কনডম',
    brand: 'Skore',
    origin: 'Imported (ISO 4074 / CE Certified)',
    price: 430,
    regularPrice: 430,
    offerPrice: 400,
    discountPercentage: 7,
    packSize: '১০ পিস (১ বক্স)',
    stockStatus: 'instock',
    isOutOfStock: false,
    stockAmount: 50,
    imageUrl: resolveImageUrl('/uploads/2610/261006/product_imgi-13-jul2023-sk-warm-10s-amazon-slides-v1-a-png-2k-20261006163417_1791283313541.webp'),
    images: [
      resolveImageUrl('/uploads/2610/261006/product_imgi-13-jul2023-sk-warm-10s-amazon-slides-v1-a-png-2k-20261006163417_1791283313541.webp'),
    ],
    tagline: 'ওয়ার্মিং সেনসেশন এবং ডটেড ও রিবড ডুয়াল টেক্সচার',
    description: 'স্কোর ওয়ার্ম কনডম ডটেড এবং রিবড টেক্সচারের সমন্বয়ে তৈরি, যার সাথে রয়েছে হালকা ওয়ার্মিং লুব্রিকেন্ট। এটি মিলনে এনে দেয় উত্তাপ ও গভীর উদ্দীপনা।',
    technicalSpecs: {
      'বক্স সাইজ': '১০ পিস',
      'টেক্সচার': 'ডটেড ও রিবড ডুয়াল টেক্সচার',
      'লুব্রিকেশন': 'স্পেশাল ওয়ার্মিং সেনসেশন লুব্রিকেন্ট',
      'সার্টিফিকেশন': 'ISO 4074 / CE আন্তর্জাতিক মান'
    },
    benefits: [
      'ওয়ার্মিং সেনসেশনের মাধ্যমে বিশেষ উত্তাপ অনুভূতি',
      'উভয় সঙ্গীর জন্য দ্বিগুণ রোমাঞ্চ ও উদ্দীপনা',
      'শতভাগ ইলেকট্রনিক ল্যাব টেস্টেড সুরক্ষা'
    ]
  },
  {
    id: 'skore-strawberry-flavored-1500-dotted-natural-latex-contraceptive-10-pcs',
    slug: 'skore-strawberry-flavored-1500-dotted-natural-latex-contraceptive-10-pcs',
    name: 'Skore Strawberry Flavored 1500+ Dotted Condom (Pack of 10)',
    name_bn: 'স্কোর স্ট্রবেরি ফ্লেভারড ১৫০০+ ডটেড কনডম (১০ পিস)',
    category: 'condom',
    category_name: 'কনডম',
    brand: 'Skore',
    origin: 'Imported (ISO 4074 / CE Certified)',
    price: 430,
    regularPrice: 430,
    offerPrice: 285,
    discountPercentage: 34,
    packSize: '১০ পিস (১ বক্স)',
    stockStatus: 'instock',
    isOutOfStock: false,
    stockAmount: 25,
    imageUrl: resolveImageUrl('/uploads/2610/261006/product_imgi-182-image-jpg-2k-20261006163315_1791284259577.webp'),
    images: [
      resolveImageUrl('/uploads/2610/261006/product_imgi-182-image-jpg-2k-20261006163315_1791284259577.webp'),
    ],
    tagline: '১৫০০+ রেজড ডটস ও আকর্ষণীয় মিষ্টি স্ট্রবেরি সুবাস',
    description: 'স্কোর স্ট্রবেরি কনডমে রয়েছে ১৫০০টিরও বেশি রেজড ডট এবং মিষ্টি সুবাসযুক্ত স্ট্রবেরি ফ্লেভার। প্রতিটি রোমাঞ্চকর মুহূর্তকে আনন্দময় ও সংবেদনশীল করতে অসাধারণ।',
    technicalSpecs: {
      'বক্স সাইজ': '১০ পিস',
      'ডটস সংখ্যা': '১৫০০+ রেজড ডটস টেক্সচার',
      'ফ্লেভার': 'ন্যাচারাল সুইট স্ট্রবেরি সুবাস',
      'উপাদান': 'মেডিক্যাল গ্রেড প্রাকৃতিক ল্যাটেক্স'
    },
    benefits: [
      '১৫০০+ ডটের তীব্র সংবেদনশীলতা',
      'মন মাতানো স্ট্রবেরি সুবাস',
      '১০০% নির্ভরযোগ্য গর্ভনিরোধ ও যৌন স্বাস্থ্য সুরক্ষা'
    ]
  },
  {
    id: 'mo-multi-textured-latex-contraceptive-10-pcs',
    slug: 'mo-multi-textured-latex-contraceptive-10-pcs',
    name: 'MO Dotted Condom (10 Pcs)',
    name_bn: 'MO ডটেড কনডম (১০ পিস)',
    category: 'condom',
    category_name: 'কনডম',
    brand: 'MO',
    origin: 'Authentic MO (ISO 4074:2015 / CE Certified)',
    price: 400,
    regularPrice: 400,
    offerPrice: 350,
    discountPercentage: 13,
    packSize: '১০ পিস (১ বক্স)',
    stockStatus: 'instock',
    isOutOfStock: false,
    stockAmount: 50,
    imageUrl: resolveImageUrl('/uploads/2609/260927/mo-dotted-condom_main_1790487322565.jpg'),
    images: [
      resolveImageUrl('/uploads/2609/260927/mo-dotted-condom_main_1790487322565.jpg'),
      resolveImageUrl('/uploads/2609/260923/mo-dotted_main_1790169125534.webp'),
      resolveImageUrl('/uploads/2609/260923/mo-dotted_main_1790169125938.webp'),
      resolveImageUrl('/uploads/2609/260923/mo-dotted_main_1790169126465.webp')
    ],
    tagline: 'মাইক্রো-টেক্সচার্ড ম্যাট্রিক্স ডটেড প্রিমিয়াম কনডম',
    description: 'আইএসও ৪০৭৪ আন্তর্জাতিক মানসম্পন্ন মেডিক্যাল গ্রেড প্রাকৃতিক ল্যাটেক্সে প্রস্তুত আসল MO ডটেড কনডম। শতভাগ ইলেকট্রনিক পিনহোল ও বার্স্ট টেস্টে উত্তীর্ণ এবং নিউট্রাল পিএইচ সিলিকন লুব্রিকেশন সমৃদ্ধ।',
    technicalSpecs: {
      'মেটেরিয়াল': 'মেডিক্যাল-গ্রেড প্রাকৃতিক রাবার ল্যাটেক্স',
      'প্রস্থ': '৫২ মিমি (±২ মিমি পারফেক্ট ফিট)',
      'দৈর্ঘ্য': '≥ ১৮০ মিমি',
      'দেয়াল পুরুত্ব': '০.০৫৫ মিমি ক্যালিব্রেটেড ম্যাট্রিক্স',
      'লুব্রিকেশন': 'নিউট্রাল পিএইচ স্কিন-ফ্রেন্ডলি সিলিকন অয়েল'
    },
    benefits: [
      'আন্তর্জাতিক আইএসও ৪০৭৪ কোয়ালিটি সার্টিফাইড',
      'শতভাগ ইলেকট্রনিক ল্যাব পরীক্ষায় উত্তীর্ণ নির্ভুল নিরাপত্তা',
      'উন্নত ডটেড টেক্সচারে উভয় সঙ্গীর গভীর সন্তুষ্টি',
      '১০০% গোপনীয় সিল করা মোড়কে ডেলিভারি'
    ]
  },
  {
    id: 'mo-micro-thin-latex-contraceptive-10-pcs',
    slug: 'mo-micro-thin-latex-contraceptive-10-pcs',
    name: 'MO Ultra Thin Condom (10 Pcs)',
    name_bn: 'MO আল্ট্রা থিন কনডম (১০ পিস)',
    category: 'condom',
    category_name: 'কনডম',
    brand: 'MO',
    origin: 'Authentic MO (ISO 4074:2015 / CE Certified)',
    price: 400,
    regularPrice: 400,
    offerPrice: 350,
    discountPercentage: 13,
    packSize: '১০ পিস (১ বক্স)',
    stockStatus: 'instock',
    isOutOfStock: false,
    stockAmount: 50,
    imageUrl: resolveImageUrl('/uploads/2609/260927/mo-ultra-thin-condom_main_1790487770991.jpg'),
    images: [
      resolveImageUrl('/uploads/2609/260927/mo-ultra-thin-condom_main_1790487770991.jpg'),
      resolveImageUrl('/uploads/2609/260923/mo-ultra-thin_main_1790169170756.webp'),
      resolveImageUrl('/uploads/2609/260923/mo-ultra-thin_main_1790169171231.webp'),
      resolveImageUrl('/uploads/2609/260923/mo-ultra-thin_main_1790169171656.webp')
    ],
    tagline: '০.০৪৫ মিমি নিখুঁত পাতলা প্রাকৃতিক ল্যাটেক্স কনডম',
    description: '০.০৪৫ মিমি আল্ট্রা-থিন মেমব্রেন এবং উচ্চ নমনীয়তার নিখুঁত সমন্বয়ে প্রস্তুত। প্রাকৃতিক অনুভূতির সাথে সর্বোচ্চ নিরাপত্তা বজায় রেখে আন্তর্জাতিক মানদণ্ড অনুসরণ করে ১০০% ইলেকট্রনিকালি টেস্টেড।',
    technicalSpecs: {
      'দেয়াল পুরুত্ব': '০.০৪৫ মিমি আল্ট্রা-শিয়ার মেমব্রেন',
      'প্রস্থ': '৫২ মিমি (±২ মিমি)',
      'উপাদান': 'প্রিমিয়াম হাই-টেনসিল ল্যাটেক্স',
      'লুব্রিকেশন': 'স্মুথ মেডিক্যাল সিলিকন অয়েল'
    },
    benefits: [
      'প্রাকৃতিক স্কিন-টু-স্কিন অনুভূতি',
      'পাতলা হলেও অত্যন্ত মজবুত ও ছিঁড়ে যাওয়ার ভয়হীন',
      'আইএসও ৪০৭৪ আন্তর্জাতিক সুরক্ষা মানদণ্ডে প্রস্তুত'
    ]
  },
  {
    id: 'mo-micro-ribbed-natural-latex-contraceptive-10-pcs',
    slug: 'mo-micro-ribbed-natural-latex-contraceptive-10-pcs',
    name: 'MO Ultra Ribbed Condom (10 Pcs)',
    name_bn: 'MO আল্ট্রা রিবড কনডম (১০ পিস)',
    category: 'condom',
    category_name: 'কনডম',
    brand: 'MO',
    origin: 'Authentic MO (ISO 4074:2015 / CE Certified)',
    price: 400,
    regularPrice: 400,
    offerPrice: 350,
    discountPercentage: 13,
    packSize: '১০ পিস (১ বক্স)',
    stockStatus: 'instock',
    isOutOfStock: false,
    stockAmount: 50,
    imageUrl: resolveImageUrl('/uploads/2609/260927/mo-ultra-ribbed-condom_main_1790487784833.jpg'),
    images: [
      resolveImageUrl('/uploads/2609/260927/mo-ultra-ribbed-condom_main_1790487784833.jpg'),
      resolveImageUrl('/uploads/2609/260923/mo-ultra-ribbed_main_1790169221979.webp'),
      resolveImageUrl('/uploads/2609/260923/mo-ultra-ribbed_main_1790169223233.webp'),
      resolveImageUrl('/uploads/2609/260923/mo-ultra-ribbed_main_1790169224012.webp')
    ],
    tagline: 'আরামদায়ক নিখুঁত ফিটিং ও কনট্যুরড রিবড টেক্সচার',
    description: 'শারীরবৃত্তীয় আরামদায়ক ফিটিং এবং নিখুঁত স্পাইরাল রিবড টেক্সচারের সাথে প্রস্তুত আসল MO কনডম। গ্রিপ ও সংবেদনশীলতা বাড়ায় এবং পূর্ণ সুরক্ষা নিশ্চিত করে।',
    technicalSpecs: {
      'মেটেরিয়াল': 'মেডিক্যাল-গ্রেড প্রাকৃতিক ল্যাটেক্স',
      'প্রস্থ': '৫২ মিমি (±২ মিমি)',
      'টেক্সচার': 'উন্নত স্পাইরাল রিবড গঠন',
      'টেস্টিং': 'ডুয়েল ইলেকট্রনিক পিনহোল ও প্রেশার টেস্টেড'
    },
    benefits: [
      'আরামদায়ক গঠন ও পারফেক্ট গ্রিপ',
      'ডাবল ইলেকট্রনিক পরীক্ষায় উত্তীর্ণ সার্টিফাইড মান',
      'হাইপোঅ্যালার্জেনিক নিউট্রাল পিএইচ লুব্রিকেন্ট'
    ]
  },
  {
    id: 'mo-multi-textured-latex-contraceptive-20-pcs-combo',
    slug: 'mo-multi-textured-latex-contraceptive-20-pcs-combo',
    name: 'MO Dotted Condom (20 Pcs Combo)',
    name_bn: 'MO ডটেড কনডম ২০ পিস কম্বো প্যাক',
    category: 'combo',
    category_name: 'কম্বো অফার',
    brand: 'MO',
    origin: 'Authentic MO (ISO 4074 / CE Certified)',
    price: 800,
    regularPrice: 800,
    offerPrice: 700,
    discountPercentage: 13,
    packSize: '২০ পিস (২টি বক্স)',
    stockStatus: 'instock',
    isOutOfStock: false,
    stockAmount: 50,
    imageUrl: resolveImageUrl('/uploads/2609/260927/dotted-condoms-20pcs-combo_main_1790487899638.jpg'),
    images: [
      resolveImageUrl('/uploads/2609/260927/dotted-condoms-20pcs-combo_main_1790487899638.jpg'),
      resolveImageUrl('/uploads/2609/260923/combo-26_main_1790168615316.webp'),
      resolveImageUrl('/uploads/2609/260923/mo-dotted_main_1790169125534.webp')
    ],
    tagline: '২০ পিস মাইক্রো-টেক্সচার্ড ম্যাট্রিক্স ডটেড কম্বো প্যাক',
    description: '২০ পিস (২ বক্স) আসল MO ডটেড কনডম স্পেশাল কম্বো অফার। রেগুলার ৮০০ টাকার পণ্য পাচ্ছেন মাত্র ৭০০ টাকায়। আন্তর্জাতিক আইএসও ৪০৭৪ মানদণ্ড অনুযায়ী প্রস্তুত।',
    technicalSpecs: {
      'পরিমাণ': '২টি রিটেইল বক্স (মোট ২০ পিস)',
      'প্রস্থ': '৫২ মিমি (±২ মিমি)',
      'লুব্রিকেশন': 'নিউট্রাল পিএইচ সিলিকন অয়েল',
      'প্যাকেজিং': '১০০% নামহীন গোপনীয় পার্সেল'
    },
    benefits: [
      '১০০ টাকা সরাসরি ক্যাশ সাশ্রয়',
      '২টি সিল করা ফ্যাক্টরি বক্সের নিরাপদ স্টক',
      '১০০% গোপনীয় আনলেবেলড মোড়কে হোম ডেলিভারি'
    ]
  },
  {
    id: 'mo-micro-thin-latex-contraceptive-20-pcs-combo',
    slug: 'mo-micro-thin-latex-contraceptive-20-pcs-combo',
    name: 'MO Ultra Thin Condom (20 Pcs Combo)',
    name_bn: 'MO আল্ট্রা থিন কনডম ২০ পিস কম্বো প্যাক',
    category: 'combo',
    category_name: 'কম্বো অফার',
    brand: 'MO',
    origin: 'Authentic MO (ISO 4074 / CE Certified)',
    price: 800,
    regularPrice: 800,
    offerPrice: 599,
    discountPercentage: 25,
    packSize: '২০ পিস (২টি বক্স)',
    stockStatus: 'instock',
    isOutOfStock: false,
    stockAmount: 50,
    imageUrl: resolveImageUrl('/uploads/2609/260927/ultra-thin-condoms-20pcs-combo_main_1790487754394.jpg'),
    images: [
      resolveImageUrl('/uploads/2609/260927/ultra-thin-condoms-20pcs-combo_main_1790487754394.jpg'),
      resolveImageUrl('/uploads/2609/260923/combo-26_main_1790168615316.webp'),
      resolveImageUrl('/uploads/2609/260923/mo-ultra-thin_main_1790169170756.webp')
    ],
    tagline: '২০ পিস ০.০৪৫ মিমি আল্ট্রা থিন কনডম মেগা ভ্যালু প্যাক',
    description: '২০ পিস (২ বক্স) আইএসও ৪০৭৪ সার্টিফাইড আসল MO আল্ট্রা থিন কনডম। রেগুলার ৮০০ টাকার পণ্য মাত্র ৫৯৯ টাকায় (২০১ টাকা ধামাকা সাশ্রয়)।',
    technicalSpecs: {
      'পরিমাণ': '২টি সিল করা বক্স (মোট ২০ পিস)',
      'পুরুত্ব': '০.০৪৫ মিমি আল্ট্রা-থিন',
      'লুব্রিকেশন': 'মেডিক্যাল সিলিকন ফ্লুইড',
      'সার্টিফিকেশন': 'CE ও ISO 4074 কোয়ালিটি সার্টিফাইড'
    },
    benefits: [
      '২০১ টাকা সরাসরি মেগা সেভিংস (২৫% ছাড়)',
      'প্রাকৃতিক স্কিন-টু-স্কিন ফিলিং',
      '১০০% গোপনীয় আনলেবেলড পার্সেল'
    ]
  },
  {
    id: 'mo-micro-ribbed-natural-latex-contraceptive-20-pcs-combo',
    slug: 'mo-micro-ribbed-natural-latex-contraceptive-20-pcs-combo',
    name: 'MO Ultra Ribbed Condom (20 Pcs Combo)',
    name_bn: 'MO আল্ট্রা রিবড কনডম ২০ পিস কম্বো প্যাক',
    category: 'combo',
    category_name: 'কম্বো অফার',
    brand: 'MO',
    origin: 'Authentic MO (ISO 4074 / CE Certified)',
    price: 800,
    regularPrice: 800,
    offerPrice: 650,
    discountPercentage: 19,
    packSize: '২০ পিস (২টি বক্স)',
    stockStatus: 'instock',
    isOutOfStock: false,
    stockAmount: 50,
    imageUrl: resolveImageUrl('/uploads/2609/260927/ribbed-condoms-20pcs-combo_main_1790487639641.jpg'),
    images: [
      resolveImageUrl('/uploads/2609/260927/ribbed-condoms-20pcs-combo_main_1790487639641.jpg'),
      resolveImageUrl('/uploads/2609/260923/combo-26_main_1790165045296.webp'),
      resolveImageUrl('/uploads/2609/260923/mo-ultra-ribbed_main_1790169221979.webp')
    ],
    tagline: '২০ পিস স্পাইরাল রিবড কনডম স্পেশাল বান্ডেল',
    description: '২০ পিস (২ বক্স) আসল MO কনট্যুরড রিবড ল্যাটেক্স কনডম। প্রতিটি ইউনিট আন্তর্জাতিক সুরক্ষা মানসম্পন্ন ও ১০০% ইলেকট্রনিকালি টেস্টেড।',
    technicalSpecs: {
      'পরিমাণ': '২টি রিটেইল বক্স (মোট ২০ পিস)',
      'প্রস্থ': '৫২ মিমি',
      'গঠন': 'স্পাইরাল কনট্যুরড রিবড',
      'টেস্টিং': 'ডাবল ইলেকট্রনিক ল্যাব টেস্টেড'
    },
    benefits: [
      '১৫০ টাকা সাশ্রয়',
      '১০০% আসল ও আন্তর্জাতিক সার্টিফাইড মান',
      '১০০% নামহীন ক্যাশ অন ডেলিভারি'
    ]
  },
  {
    id: 'mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo',
    slug: 'mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo',
    name: 'MO Ultimate 3-in-1 Variety Condom (30 Pcs Combo)',
    name_bn: 'MO আল্টিমেট ৩-ইন-১ ভ্যারাইটি কনডম (৩০ পিস কম্বো)',
    category: 'combo',
    category_name: 'কম্বো অফার',
    brand: 'MO',
    origin: 'Authentic MO (ISO 4074 / CE Certified)',
    price: 1200,
    regularPrice: 1200,
    offerPrice: 900,
    discountPercentage: 25,
    packSize: '৩০ পিস (৩টি বক্স)',
    stockStatus: 'instock',
    isOutOfStock: false,
    stockAmount: 100,
    imageUrl: resolveImageUrl('/uploads/2609/260927/variety-condoms-30pcs-combo_main_1790487255792.jpg'),
    images: [
      resolveImageUrl('/uploads/2609/260927/variety-condoms-30pcs-combo_main_1790487255792.jpg'),
      resolveImageUrl('/uploads/2609/260923/combo-26_main_1790168615316.webp'),
      resolveImageUrl('/uploads/2609/260923/mo-ultra-thin_main_1790169170756.webp'),
      resolveImageUrl('/uploads/2609/260923/mo-dotted_main_1790169125534.webp'),
      resolveImageUrl('/uploads/2609/260923/mo-ultra-ribbed_main_1790169221979.webp')
    ],
    tagline: '৩০ পিস মেগা ট্রায়ো বান্ডেল (আল্ট্রা থিন + ডটেড + রিবড) — ৩০০ টাকা মেগা সেভিংস',
    description: '৩০ পিস স্পেশাল মেগা ট্রায়ো বান্ডেল — ১ বক্স আল্ট্রা থিন (১০ পিস) + ১ বক্স ডটেড (১০ পিস) + ১ বক্স আল্ট্রা রিবড (১০ পিস)। মোট ৩টি পূর্ণাঙ্গ ফ্যাক্টরি বক্স মাত্র ৯০০ টাকায় (রেগুলার মূল্য ১২০০ টাকা)। ৩টি আলাদা ফিলিংসের অসাধারণ কম্বিনেশন।',
    technicalSpecs: {
      'প্যাকেজের পরিমাণ': '৩টি সম্পূর্ণ বক্স (মোট ৩০টি সিল্ড ফয়েল প্যাক)',
      'অন্তর্ভুক্ত ভ্যারিয়েন্ট': '১x আল্ট্রা থিন (১০ পিস) + ১x ডটেড (১০ পিস) + ১x আল্ট্রা রিবড (১০ পিস)',
      'উপাদান': '১০০% মেডিক্যাল গ্রেড প্রাকৃতিক ল্যাটেক্স',
      'প্রস্থ': '৫২ মিমি (±২ মিমি)',
      'সার্টিফিকেশন': 'ISO 4074 / CE সার্টিফাইড ল্যাব টেস্টেড'
    },
    benefits: [
      'ধামাকাদার মেগা অফার (৩০০ টাকা সাশ্রয় / ২৫% ছাড়)',
      'এক প্যাকেজেই ৩টি ভ্যারিয়েন্ট (আল্ট্রা থিন, ডটেড এবং রিবড)',
      'দীর্ঘমেয়াদী ৩০ পিসের নিশ্চিন্ত স্টক',
      '১০০% গোপনীয় নামহীন বক্সে দ্রুত ক্যাশ অন ডেলিভারি'
    ]
  }
];

export default FALLBACK_PRODUCTS;
