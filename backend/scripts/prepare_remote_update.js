import { execSync } from "child_process";
import fs from "fs";

// Products update payload for Surokkha DB
const updates = [
  // 1. MO Ultra Thin Condom (mo-ultra-thin)
  {
    _id: "6ab2c80d6fa8d45f03d4ba70",
    slug: "mo-ultra-thin",
    name: "MO Ultra Thin Condom",
    description: "Premium ultra-thin natural latex condoms designed for maximum real-touch sensitivity, effortless comfort, and certified leak-proof protection.",
    longDescription: "<p>MO Ultra Thin condoms are crafted from high-grade natural rubber latex using advanced micro-membrane technology. Designed to deliver an authentic skin-to-skin feeling while strictly maintaining international safety certifications.</p>",
    origin: "China Imported (ISO / CE Certified)",
    expiryDate: "Valid until 2030 (5 Years)",
    packSize: "10 Pieces / Box",
    packageContents: "1 Box (10 Individually Foil-Sealed Ultra Thin Condoms)",
    specifications: {
      "Brand": "MO (Personage Hygiene)",
      "Product Line": "Personage Ultra Thin",
      "Model Number": "ULTRA THIN 10 COUNT",
      "Material": "100% Natural Rubber Latex",
      "Texture / Surface": "Ultra-Thin Smooth Finish",
      "Nominal Width": "52mm ± 2mm",
      "Nominal Length": "180mm ± 10mm",
      "Thickness": "Approx. 0.04mm (Ultra Thin)",
      "Lubrication": "Medical-Grade Silicone Lubricant (Long Lasting)",
      "Flavor / Scent": "Neutral / Natural",
      "Testing & Inspection": "100% Electronically Tested for Micro-pinholes",
      "Certifications": "CE Certified, ISO 13485, ISO 4074",
      "Packaging Dimensions": "12 x 6.5 x 2.5 cm (Gross Weight: 0.3 kg)"
    },
    benefits: [
      {
        title: "Barely-There Sensitivity",
        description: "Engineered with an ultra-thin membrane that maximizes body heat transfer and authentic skin-to-skin tactile sensation."
      },
      {
        title: "Skin-Friendly Formulation",
        description: "Purified natural latex eliminates unpleasant rubber smell and reduces skin irritation risk for effortless comfort."
      },
      {
        title: "100% Electronic Voltage Testing",
        description: "Every single piece is individually tested with high-voltage electronic screening to ensure zero leakage and tear-resistance."
      },
      {
        title: "Extended Glide Lubrication",
        description: "Infused with medical-grade non-drying silicone lubricant to maintain smooth, friction-free performance throughout."
      },
      {
        title: "100% Discreet Delivery",
        description: "Delivered in confidential, unmarked plain packaging across Bangladesh with cash-on-delivery."
      }
    ],
    sections: [
      {
        heading: "Why Choose Ultra Thin Condoms & Skin-to-Skin Feel?",
        content: "Many users find traditional thick condoms dull their natural sensation. MO Ultra Thin condoms feature an ultra-thin 0.04mm profile that conducts natural warmth instantly, delivering an uninterrupted intimate connection without compromising contraceptive and STI safety."
      },
      {
        heading: "100% Electronic Inspection & Certified Safety",
        content: "Manufactured by Shanghai Personage Hygiene under strict ISO 4074 and ISO 13485 standards. Every individual condom undergoes computerized electronic testing to ensure complete burst-strength integrity."
      },
      {
        heading: "Usage & Storage Guidelines",
        content: "Single-use only. Avoid sharp nails or scissors when opening the individual foil. Store in a cool, dry place away from direct sunlight."
      }
    ],
    bn: {
      tagline: "ত্বকের স্বাভাবিক অনুভূতি ও নিশ্চিত সুরক্ষার নিখুঁত মেলবন্ধন",
      description: "সর্বোচ্চ স্পর্শানুভূতি ও আরামদায়ক অভিজ্ঞতার জন্য প্রিমিয়াম আল্ট্রা-থিন ন্যাচারাল ল্যাটেক্স কনডম। শতভাগ ইলেকট্রনিক্যালি পরীক্ষিত ও নিরাপদ।",
      longDescription: "<p>MO Ultra Thin কনডম তৈরি হয়েছে উন্নত মাইক্রো-মেমব্রেন প্রযুক্তিতে পরিশোধিত প্রাকৃতিক ল্যাটেক্স দিয়ে। এর অতি-পাতলা স্তর সর্বোচ্চ রিয়েল-টাচ অনুভূতি নিশ্চিত করে আন্তর্জাতিক মান বজায় রেখে সম্পূর্ণ নিরাপত্তা দেয়।</p>",
      origin: "চীন থেকে সরাসরি আমদানিকৃত (ISO / CE সার্টিফাইড)",
      expiryDate: "২০৩০ সাল পর্যন্ত মেয়াদ (দীর্ঘস্থায়ী)",
      packSize: "১০ পিস প্রতি বক্স",
      packageContents: "১টি বক্স (১০টি সিল্ড ইনডিভিজুয়াল ফয়েল প্যাক)",
      specifications: {
        "ব্র্যান্ড": "MO (Personage Hygiene)",
        "মডেল": "ULTRA THIN 10 COUNT",
        "উপাদান": "১০০% প্রিমিয়াম ন্যাচারাল রাবার ল্যাটেক্স",
        "টেক্সচার / সারফেস": "মসৃণ ও অতি-পাতলা (Ultra-Thin Smooth)",
        "প্রস্থ (Width)": "৫২ মিমি (±২ মিমি)",
        "দৈর্ঘ্য (Length)": "১৮০ মিমি (±১০ মিমি)",
        "পুরুত্ব (Thickness)": "প্রায় ০.০৪ মিমি (সুপার থিন)",
        "লুব্রিকেন্ট": "মেডিকেল গ্রেড লং-লাস্টিং সিলিকন লুব্রিকেন্ট",
        "ফ্লেভার / ঘ্রাণ": "ন্যাচারাল / গন্ধহীন",
        "কোয়ালিটি টেস্টিং": "১০০% ইলেকট্রনিক পিনহোল ও লিক টেস্টেড",
        "আন্তর্জাতিক স্বীকৃতি": "CE সার্টিফাইড, ISO 13485, ISO 4074",
        "প্যাকেট সাইজ": "১২ × ৬.৫ × ২.৫ সেমি (ওজন: ০.৩ কেজি)"
      },
      benefits: [
        {
          title: "স্বাভাবিক ত্বকের স্পর্শানুভূতি",
          description: "অতি-পাতলা মেমব্রেন যা শারীরিক উষ্ণতা ও বাস্তব স্পর্শের অনুভূতি অক্ষুণ্ণ রাখে।"
        },
        {
          title: "ত্বকের জন্য নিরাপদ ও গন্ধহীন",
          description: "পরিশোধিত প্রাকৃতিক ল্যাটেক্স যা অ্যালার্জি বা অস্বস্তিকর রাবারের গন্ধ দূর করে।"
        },
        {
          title: "১০০% ইলেকট্রনিক ভোল্টেজ পরীক্ষা",
          description: "প্রতিটি পিস আলাদাভাবে ইলেকট্রনিক টেস্টের মাধ্যমে প্রস্তুত, যা কোনো ধরনের ছিদ্র বা ফেটে যাওয়া প্রতিরোধ করে।"
        },
        {
          title: "দীর্ঘস্থায়ী সিল্কি লুব্রিকেশন",
          description: "উচ্চমানের সিলিকন লুব্রিকেন্ট যা মসৃণ মুভমেন্ট বজায় রাখে এবং ঘর্ষণজনিত জ্বালাপোড়া কমায়।"
        },
        {
          title: "শতভাগ গোপন ডেলিভারি",
          description: "কোনো প্রকার নাম বা চিহ্ন ছাড়া সম্পূর্ণ নিরপেক্ষ পার্সেল বক্সে হোম ডেলিভারি।"
        }
      ],
      sections: [
        {
          heading: "আল্ট্রা থিন কনডম কেন বেছে নেবেন?",
          content: "অনেকে সাধারণ কনডমে স্বাভাবিক অনুভূতি পান না। আল্ট্রা থিন কনডম আপনাকে আসল মিলনের প্রাকৃতিক স্পর্শ উপহার দেয় এবং একই সাথে পূর্ণ গর্ভনিরোধ ও যৌন সুরক্ষার নিশ্চয়তা দেয়।"
        },
        {
          heading: "গুণগত মান ও সার্টিফিকেশন",
          content: "সাংহাই পারসোনেজ হাইজিন কর্তৃক আন্তর্জাতিক ISO 4074 ও ISO 13485 স্ট্যান্ডার্ড মেনে তৈরি। প্রতিটি কনডম কম্পিউটারাইজড ইলেকট্রনিক পরীক্ষার মাধ্যমে শতভাগ নিরাপদ প্রমাণিত।"
        },
        {
          heading: "ব্যবহার ও সংরক্ষণ নির্দেশিকা",
          content: "প্রতিটি মিলনে একটি নতুন কনডম ব্যবহার করুন। নখ বা ধারালো বস্তু থেকে সাবধানে রাখুন। শুষ্ক ও সাধারণ তাপমাত্রায় সংরক্ষণ করুন।"
        }
      ]
    }
  },

  // 2. MO Dotted Condom (mo-dotted)
  {
    _id: "6ab2c80d6fa8d45f03d4ba6f",
    slug: "mo-dotted",
    name: "MO Dotted Condom",
    description: "Specially designed with raised matrix dots for heightened stimulation, partner pleasure, and reliable dual protection.",
    longDescription: "<p>MO Dotted Pleasure condoms feature strategically positioned raised matrix dots that offer intense sensory stimulation. Manufactured under strict ISO and CE compliance for enhanced intimacy with complete peace of mind.</p>",
    origin: "China Imported (ISO / CE Certified)",
    expiryDate: "Valid until 2030 (5 Years)",
    packSize: "10 Pieces / Box",
    packageContents: "1 Box (10 Individually Foil-Sealed Dotted Pleasure Condoms)",
    specifications: {
      "Brand": "MO",
      "Product Line": "Dotted Pleasure",
      "Model Number": "Dotted Pleasure 10 COUNT",
      "Material": "Natural High-Elasticity Latex",
      "Texture / Surface": "Raised Micro-Dotted Pleasure Matrix",
      "Nominal Width": "52mm ± 2mm",
      "Nominal Length": "180mm ± 20mm",
      "Thickness": "0.065mm ± 0.015mm (Enhanced Strength)",
      "Lubrication": "Silicone High-Glide Lubricant",
      "Flavor / Scent": "Non-Flavored / Natural",
      "Testing & Inspection": "100% Electronically Tested & Tensile Certified",
      "Certifications": "CE, ISO 4074, US 510(k), ISO 13485",
      "Packaging Dimensions": "20 x 15 x 11 cm (Outer / Standard 10-pack box)"
    },
    benefits: [
      {
        title: "Intense Dotted Stimulation",
        description: "Evenly distributed surface dots produce targeted friction and heightened sensory excitement during every movement."
      },
      {
        title: "Extra Tear & Burst Resistance",
        description: "Reinforced 0.065mm natural latex wall provides strong durability during high-intensity moments."
      },
      {
        title: "Dual Certified Protection",
        description: "Effective pregnancy prevention and STI protection backed by FDA 510(k) and CE standard validations."
      },
      {
        title: "Optimal Glide Formula",
        description: "Non-sticky silicone moisture layer prevents discomfort and maintains effortless glide throughout."
      },
      {
        title: "100% Discreet Packaging",
        description: "Completely anonymous parcel packaging with cash-on-delivery everywhere in Bangladesh."
      }
    ],
    sections: [
      {
        heading: "How Raised Matrix Dots Maximize Partner Pleasure",
        content: "Dotted condoms are crafted with hundreds of raised micro-dots along the shaft. These textured points create rhythmic, stimulating friction against sensitive nerve endings, helping female partners reach peak satisfaction faster."
      },
      {
        heading: "Reinforced Latex & Safety Assurance",
        content: "Constructed with higher tensile strength latex without losing elasticity. 100% electronically tested against leaks, bursting, and microscopic pinholes."
      },
      {
        heading: "Usage & Storage Guidelines",
        content: "Single-use condom. Open carefully by tearing at the notched edge. Store away from heat, humidity, and direct sunlight."
      }
    ],
    bn: {
      tagline: "উঁচু ডটের বিশেষ টেক্সচারে বাড়তি রোমাঞ্চ ও দ্বিগুণ আনন্দ",
      description: "সঙ্গীর বাড়তি আনন্দ ও রোমাঞ্চকর অভিজ্ঞতার জন্য বিশেষভাবে তৈরি উঁচু ডটেড কনডম। শক্তিশালী ল্যাটেক্স ও সম্পূর্ণ নির্ভরযোগ্য সুরক্ষা।",
      longDescription: "<p>MO Dotted Pleasure কনডমের চারপাশে রয়েছে সারিবদ্ধ উঁচু ডট যা সম্পর্কের ঘনিষ্ঠ মুহূর্তে বাড়তি সেনসেশন ও উদ্দীপনা তৈরি করে। আন্তর্জাতিক ISO এবং 510(k) মানের নিশ্চয়তায় শতভাগ নিরাপদ।</p>",
      origin: "চীন থেকে সরাসরি আমদানিকৃত (ISO / CE সার্টিফাইড)",
      expiryDate: "২০৩০ সাল পর্যন্ত মেয়াদ (দীর্ঘস্থায়ী)",
      packSize: "১০ পিস প্রতি বক্স",
      packageContents: "১টি বক্স (১০টি সিল্ড ইনডিভিজুয়াল ফয়েল প্যাক)",
      specifications: {
        "ব্র্যান্ড": "MO",
        "মডেল": "Dotted Pleasure 10 COUNT",
        "উপাদান": "হাই-ইলাস্টিসিটি ন্যাচারাল ল্যাটেক্স",
        "টেক্সচার / সারফেস": "রেইজড মাইক্রো-ডটেড টেক্সচার (Raised Dots)",
        "প্রস্থ (Width)": "৫২ মিমি (±২ মিমি)",
        "দৈর্ঘ্য (Length)": "১৮০ মিমি (±২০ মিমি)",
        "পুরুত্ব (Thickness)": "০.০৬৫ মিমি (±০.০১৫ মিমি - এক্সট্রা ডিউরেবল)",
        "লুব্রিকেন্ট": "হাই-গ্লাইড সিলিকন লুব্রিকেন্ট",
        "ফ্লেভার / ঘ্রাণ": "ন্যাচারাল / সুবাসহীন",
        "কোয়ালিটি টেস্টিং": "১০০% ইলেকট্রনিক প্রেশার ও লিক টেস্টেড",
        "আন্তর্জাতিক স্বীকৃতি": "CE, ISO 4074, US FDA 510(k), ISO 13485",
        "প্যাকেট সাইজ": "স্ট্যান্ডার্ড ১০ পিস রিটেইল বক্স"
      },
      benefits: [
        {
          title: "উঁচু ডটের বিশেষ সেনসেশন",
          description: "বিশেষভাবে তৈরি ডট প্যাটার্ন যা ঘনিষ্ঠ মুহূর্তে বাড়তি স্পর্শানুভূতি ও চরম উদ্দীপনা তৈরি করে।"
        },
        {
          title: "অতিরিক্ত স্থায়িত্ব ও মজবুত গঠন",
          description: "০.০৬৫ মিমি স্থিতিস্থাপক স্তর যা তীব্র মুহূর্তেও কোনো ধরনের ছিঁড়ে যাওয়া বা লিক হওয়ার ঝুঁকি রাখে না।"
        },
        {
          title: "সার্টিফাইড ডুয়াল প্রটেকশন",
          description: "অনাকাঙ্ক্ষিত গর্ভধারণ রোধ ও স্বাস্থ্য সুরক্ষায় আন্তর্জাতিক 510(k) ও CE স্ট্যান্ডার্ড নিশ্চিত।"
        },
        {
          title: "মসৃণ সিলিকন আবরণ",
          description: "প্রিমিয়াম লুব্রিকেশন যা শুকিয়ে যায় না এবং অস্বস্তিমুক্ত আরামদায়ক ব্যবহার নিশ্চিত করে।"
        },
        {
          title: "শতভাগ গোপন ডেলিভারি",
          description: "কোনো নাম-ঠিকানা বা পণ্যের বিবরণ বাইরে না লিখে সম্পূর্ণ গোপন পার্সেল ডেলিভারি।"
        }
      ],
      sections: [
        {
          heading: "ডটেড কনডম কাদের জন্য এবং এর বিশেষত্ব কি?",
          content: "ডটেড কনডমে থাকা শত শত উঁচু বিন্দুর স্পর্শ মিলনের সময় অতিরিক্ত উদ্দীপনা তৈরি করে। এটি স্বাভাবিকের চেয়ে পার্টনারকে দ্রুত ও তীব্র চরম সুখে পৌঁছাতে সাহায্য করে।"
        },
        {
          heading: "গুণগত মান ও নিরাপত্তা পরীক্ষা",
          content: "প্রতিটি পিস ফ্যাক্টরিতে ইলেকট্রনিক টেস্টিং ও প্রেশার টেস্টের মাধ্যমে সার্টিফাইড করা। আন্তর্জাতিক CE ও ISO 4074 সার্টিফাইড পণ্য।"
        },
        {
          heading: "ব্যবহার ও সংরক্ষণ নির্দেশিকা",
          content: "একবার ব্যবহারের পর ফেলে দিন। নখ বা ধারালো বস্তু এড়িয়ে চলুন। স্বাভাবিক কক্ষ তাপমাত্রায় সংরক্ষণ করুন।"
        }
      ]
    }
  },

  // 3. MO Ultra Ribbed Condom (mo-ultra-ribbed)
  {
    _id: "6ab2c80d6fa8d45f03d4ba71",
    slug: "mo-ultra-ribbed",
    name: "MO Ultra Ribbed Condom",
    description: "High-sensitivity ultra ribbed textured condoms with premium TT silicone lubricant for amplified friction, intense stimulation, and seamless comfort.",
    longDescription: "<p>MO Ultra Ribbed condoms are engineered with precision micro-rib ridges along the body to maximize tactile friction and pleasure. Infused with non-sticky TT silicone lubricant to eliminate irritation while delivering complete peace of mind.</p>",
    origin: "China Imported (ISO / CE Certified)",
    expiryDate: "Valid until 2030 (5 Years)",
    packSize: "10 Pieces / Box",
    packageContents: "1 Box (10 Individually Foil-Sealed Ultra Ribbed Condoms with TT Silicone Lube)",
    specifications: {
      "Brand": "MO",
      "Product Line": "Personage Ultra Ribbed",
      "Model Number": "Ribbed Pleasure 10 COUNT",
      "Material": "High-Tensile Natural Latex",
      "Texture / Surface": "Continuous Spiral Micro-Ribbed Ridges",
      "Nominal Width": "52mm ± 2mm",
      "Nominal Length": "180mm - 200mm",
      "Thickness": "0.04mm - 0.06mm",
      "Lubrication": "Advanced TT Silicone Lubricant (Friction-Free)",
      "Flavor / Scent": "Natural Flavor / Neutral",
      "Testing & Inspection": "100% Electronically Tested for Tensile Strength & Micro-holes",
      "Certifications": "CE, FSC, ISO 4074, ISO 13485, US 510(k)",
      "Packaging Dimensions": "12 x 6.4 x 2.5 cm (Gross Weight: 0.045 kg)"
    },
    benefits: [
      {
        title: "Targeted Spiral Ribbed Stimulation",
        description: "Precision rib contours create continuous textured friction and heightened excitement during every stroke."
      },
      {
        title: "TT Silicone Lubricant Infusion",
        description: "Advanced TT silicone formula ensures lasting moisture, eliminates dryness, and maintains ultra-smooth glide throughout."
      },
      {
        title: "Form-Fitting Elasticity",
        description: "180-200mm stretchable contoured design provides a snug, slip-free, and natural fit."
      },
      {
        title: "5-Fold International Certification",
        description: "Rigorously validated with CE, ISO 4074, ISO 13485, FSC, and FDA 510(k) standards for ultimate peace of mind."
      },
      {
        title: "Discreet Parcel Shipping",
        description: "Packed in plain, confidential parcels with cash-on-delivery service nationwide."
      }
    ],
    sections: [
      {
        heading: "What Does 'Ribbed' Mean & How Does It Elevate Intimacy?",
        content: "Ribbed refers to the raised spiral rings that encircle the condom. Unlike plain condoms, these ridges physically stimulate the most sensitive inner nerve endings with every movement, creating waves of intense pleasure."
      },
      {
        heading: "TT Silicone Lubricant Formula",
        content: "Formulated with medical-grade TT silicone lube that does not evaporate or dry out quickly, minimizing friction discomfort for both partners."
      },
      {
        heading: "Usage & Storage Guidelines",
        content: "Single-use only. Open carefully from the notched edge. Store in a dry drawer at room temperature away from direct sunlight."
      }
    ],
    bn: {
      tagline: "মাইক্রো-রিবড খাঁজ ও প্রিমিয়াম টিটি সিলিকন লুব্রিকেশনে দ্বিগুণ উদ্দীপনা",
      description: "উন্নত মাইক্রো-রিবড টেক্সচার এবং দীর্ঘস্থায়ী টিটি সিলিকন লুব্রিকেন্ট সমৃদ্ধ কনডম। তীব্র অনুভূতি, বাড়তি ঘর্ষণ ও নির্ভরযোগ্য নিরাপত্তা।",
      longDescription: "<p>MO Ultra Ribbed কনডমে রয়েছে নিখুঁতভাবে বসানো রিবড (খাঁজকাটা) টেক্সচার যা স্পর্শে বাড়তি সেনসেশন এনে দেয়। এর সাথে যুক্ত প্রিমিয়াম TT সিলিকন লুব্রিকেন্ট ঘর্ষণহীন মসৃণতা বজায় রাখে এবং অস্বস্তি রোধ করে।</p>",
      origin: "চীন থেকে সরাসরি আমদানিকৃত (ISO / CE সার্টিফাইড)",
      expiryDate: "২০৩০ সাল পর্যন্ত মেয়াদ (দীর্ঘস্থায়ী)",
      packSize: "১০ পিস প্রতি বক্স",
      packageContents: "১টি বক্স (১০টি সিল্ড ইনডিভিজুয়াল ফয়েল প্যাক)",
      specifications: {
        "ব্র্যান্ড": "MO",
        "মডেল": "Ribbed Pleasure 10 COUNT",
        "উপাদান": "হাই-টেনসাইল ন্যাচারাল রাবার ল্যাটেক্স",
        "টেক্সচার / সারফেস": "ধারাবাহিক মাইক্রো-রিবড (Micro-Ribbed Ridges)",
        "প্রস্থ (Width)": "৫২ মিমি (±২ মিমি)",
        "দৈর্ঘ্য (Length)": "১৮০ মিমি - ২০০ মিমি",
        "পুরুত্ব (Thickness)": "০.০৪ মিমি - ০.০৬ মিমি",
        "লুব্রিকেন্ট": "উন্নত TT সিলিকন লুব্রিকেন্ট (লং-লাস্টিং গ্লাইড)",
        "ফ্লেভার / ঘ্রাণ": "ন্যাচারাল সুবাসহীন",
        "কোয়ালিটি টেস্টিং": "১০০% ইলেকট্রনিক প্রেশার ও টেনসাইল টেস্টেড",
        "আন্তর্জাতিক স্বীকৃতি": "CE, FSC, ISO 4074, ISO 13485, US FDA 510(k)",
        "প্যাকেট সাইজ": "১২ × ৬.৪ × ২.৫ সেমি"
      },
      benefits: [
        {
          title: "টার্গেটেড মাইক্রো-রিবড খাঁজ",
          description: "বিশেষ রিবড টেক্সচার প্রতিটি মুভমেন্টে তীব্র উদ্দীপনা ও অনন্য স্পর্শানুভূতি তৈরি করে।"
        },
        {
          title: "উন্নত TT সিলিকন লুব্রিকেশন",
          description: "দীর্ঘক্ষণ আর্দ্রতা ও মসৃণতা ধরে রাখে, ফলে কোনো প্রকার জ্বালাপোড়া বা টান লাগে না।"
        },
        {
          title: "নিখুঁত ও স্থিতিস্থাপক ফিটিং",
          description: "১৮০-২০০ মিমি পর্যন্ত প্রসার্য ও স্লিপ-প্রুফ গ্রিপ নিশ্চিত করে।"
        },
        {
          title: "আন্তর্জাতিক ৫ স্তরের মান নিয়ন্ত্রণ",
          description: "CE, ISO 4074, ISO 13485, FSC এবং 510(k) অনুমোদিত শতভাগ সুরক্ষিত কনডম।"
        },
        {
          title: "শতভাগ গোপন ডেলিভারি",
          description: "সম্পূর্ণ নিরপেক্ষ ও আনমার্কড বক্সে হোম ডেলিভারি করা হয়।"
        }
      ],
      sections: [
        {
          heading: "রিবড কনডম কাদের জন্য উপযোগী?",
          content: "যারা মিলনে সাধারণের চেয়ে একটু বাড়তি রোমাঞ্চ ও নতুনত্বের অনুভূতি খুঁজছেন, তাদের জন্য রিবড কনডম সবচেয়ে চমৎকার অভিজ্ঞতা এনে দেয়।"
        },
        {
          heading: "টিটি সিলিকন লুব্রিকেন্টের বিশেষ সুবিধা",
          content: "সাধারণ লুব্রিকেন্টের চেয়ে বেশি পিচ্ছিলকারক ও দীর্ঘস্থায়ী, যা ব্যবহারের পুরো সময়জুড়ে মসৃণ অনুভূতি বজায় রাখে।"
        },
        {
          heading: "ব্যবহার ও সংরক্ষণ নির্দেশিকা",
          content: "প্রতিটি মিলনে ১টি নতুন কনডম ব্যবহার করুন। শুষ্ক ও ঠাণ্ডা স্থানে সংরক্ষণ করুন।"
        }
      ]
    }
  },

  // 4. Ultra Thin Condoms: 20pcs Combo (ultra-thin-condoms-20pcs-combo)
  {
    _id: "6ab81e97721c81cc8921136e",
    slug: "ultra-thin-condoms-20pcs-combo",
    name: "Ultra Thin Condoms: 20pcs Combo",
    description: "Mega saving combo pack containing 2 full factory boxes (20 condoms) of MO Ultra Thin series at a special discounted bundle price.",
    longDescription: "<p>Ultra Thin 20pcs Combo pack is designed for regular users who demand authentic skin-to-skin touch and consistent protection. Receive 2 sealed boxes (20 individual foil packs) valid until 2030 at massive bundle savings.</p>",
    origin: "China Imported (ISO / CE Certified)",
    expiryDate: "Valid until 2030 (5 Years)",
    packSize: "20 Pieces Combo (2 Boxes x 10 pcs)",
    packageContents: "2 Factory Sealed Boxes (Total 20 Foil-Sealed Ultra Thin Condoms)",
    specifications: {
      "Combo Bundle Structure": "2 Full Boxes (10 pcs per box = Total 20 Condoms)",
      "Product Type Included": "MO Ultra Thin Real Touch Natural Latex",
      "Material": "Ultra-Fine Purified Natural Rubber Latex",
      "Nominal Dimensions": "Width 52mm (±2mm) | Length 180mm (±10mm)",
      "Thickness Profile": "0.03mm - 0.04mm Ultra-Thin Membrane",
      "Lubrication": "Silky Non-Sticky Silicone Lubricant",
      "Regular Price": "৳800",
      "Combo Offer Price": "৳599 (Save ৳201 / 25% OFF)",
      "Certifications": "CE Certified, ISO 4074, ISO 13485",
      "Packaging": "Discreet Double Sealed Protective Carton"
    },
    benefits: [
      {
        title: "Mega Bundle Savings (Save ৳201)",
        description: "Get 20 premium ultra-thin condoms at ৳599 instead of ৳800 regular retail price with single delivery fee."
      },
      {
        title: "0.03mm Skin-to-Skin Sensation",
        description: "Micro-thin latex membrane conducts body heat instantly, making you feel completely connected."
      },
      {
        title: "Dual Box Freshness till 2030",
        description: "Two separately sealed 10-piece boxes allow you to open one while keeping the second box 100% factory fresh."
      },
      {
        title: "100% Electronically Hole Screened",
        description: "Every unit is individually checked with high-voltage testing for zero leakage and strong burst resistance."
      },
      {
        title: "Confidential Doorstep Delivery",
        description: "Sent in unbranded, discreet packaging across all districts in Bangladesh."
      }
    ],
    sections: [
      {
        heading: "Combo Package Overview & Cost Advantage",
        content: "This 20-piece combo is the most cost-effective choice for couples who value natural touch. By purchasing in a 2-box bundle, you save ৳201 and minimize repeated shipping costs."
      },
      {
        heading: "Preservation & Shelf Life",
        content: "Both boxes are hermetically sealed with multi-layer foil and dated up to 2030. Keep in a dry, cool cabinet."
      }
    ],
    bn: {
      tagline: "২০ পিস মেগা কম্বো প্যাক—২ বক্স আল্ট্রা থিন পাচ্ছেন এক সাথে সাশ্রয়ী অফারে",
      description: "এমও আল্ট্রা থিনের ২টি পূর্ণ বক্স (মোট ২০টি কনডম) সমৃদ্ধ বিশেষ সেভিং কম্বো প্যাক। ৮০০ টাকার রেগুলার প্রাইসের পণ্য এখন পাচ্ছেন মাত্র ৫৯৯ টাকায় (২০১ টাকা সাশ্রয়)।",
      longDescription: "<p>আল্ট্রা থিন ২০ পিস কম্বো প্যাক (Ultra Thin Condoms: 20pcs Combo) রেগুলার কাপলদের জন্য সেরা পছন্দের সাশ্রয়ী বান্ডেল। এতে রয়েছে ২ বক্স (২০ পিস) ০.০৩ মিমি আল্ট্রা থিন কনডম, যা দেয় আসল স্কিন-টু-স্কিন স্বাভাবিক উষ্ণতা। ২০৩০ সাল পর্যন্ত মেয়াদের নিশ্চয়তা।</p>",
      origin: "চীন থেকে সরাসরি আমদানিকৃত (ISO / CE সার্টিফাইড)",
      expiryDate: "২০৩০ সাল পর্যন্ত মেয়াদ (দীর্ঘস্থায়ী)",
      packSize: "২০ পিস কম্বো (২ বক্স x ১০ পিস)",
      packageContents: "২টি সিল্ড বক্স (মোট ২০টি আলাদা ফয়েল প্যাক)",
      specifications: {
        "কম্বো বিবরণ": "২টি বক্স (প্রতি বক্সে ১০ পিস = মোট ২০ পিস কনডম)",
        "অন্তর্ভুক্ত প্রোডাক্ট": "MO Ultra Thin রিয়েল টাচ ন্যাচারাল ল্যাটেক্স",
        "উপাদান": "আল্ট্রা-ফাইন ন্যাচারাল রাবার ল্যাটেক্স",
        "ডাইমেনশন": "প্রস্থ ৫২ মিমি (±২ মিমি) | দৈর্ঘ্য ১৮০ মিমি (±১০ মিমি)",
        "পুরুত্ব": "০.০৩ - ০.০৪ মিমি আল্ট্রা থিন মেমব্রেন",
        "লুব্রিকেশন": "সিল্কি মেডিকেল গ্রেড সিলিকন অয়েল",
        "রেগুলার মূল্য": "৳৮০০",
        "কম্বো অফার মূল্য": "৳৫৯৯ (সাশ্রয় ২০১ টাকা / ২৫% ছাড়)",
        "আন্তর্জাতিক স্বীকৃতি": "CE সার্টিফাইড, ISO 4074, ISO 13485",
        "প্যাকেজিং": "সম্পূর্ণ গোপন ও ডিসক্রিট সিল্ড পার্সেল"
      },
      benefits: [
        {
          title: "সর্বোচ্চ সেভিং সুপার ডিল (২০১ টাকা সাশ্রয়)",
          description: "২টি পূর্ণ সিল্ড বক্স (মোট ২০ পিস) MO Ultra Thin কনডম পাচ্ছেন ৮০০ টাকার বদলে মাত্র ৫৯৯ টাকায়।"
        },
        {
          title: "০.০৩ মিমি প্রাকৃতিক স্পর্শ",
          description: "কনডম ছাড়া স্বাভাবিক অনুভূতির মতো নিখুঁত স্পর্শ ও ঘনিষ্ঠতার অভিজ্ঞতা।"
        },
        {
          title: "ডাবল স্টক ও দীর্ঘ মেয়াদের নিশ্চিন্ততা",
          description: "২০৩০ সাল পর্যন্ত মেয়াদ থাকায় একটি বক্স ব্যবহারের সময় অন্য বক্সটি সম্পূর্ণ সুরক্ষিত থাকবে।"
        },
        {
          title: "১০০% ইলেকট্রনিক ভোল্টেজ পরীক্ষা",
          description: "প্রতিটি পিস আলাদাভাবে ইলেকট্রনিক লিক টেস্টে উত্তীর্ণ ও সম্পূর্ণ নিরাপদ।"
        },
        {
          title: "শতভাগ গোপন ডেলিভারি",
          description: "বাইরে কোনো নাম বা লেখা ছাড়া সম্পূর্ণ নিরপেক্ষ প্যাকেজিংয়ে পাঠানো হয়।"
        }
      ],
      sections: [
        {
          heading: "এই ২০ পিস কম্বো কেন কিনবেন?",
          content: "একক প্যাক বারবার অর্ডার না করে এক সাথে ২০ পিস নিলে ডেলিভারি খরচ ও মূল্যে সর্বোচ্চ ২০১ টাকা সাশ্রয় হয়। নিয়মিত ব্যবহারকারীদের জন্য এটি সবচেয়ে লাভজনক।"
        },
        {
          heading: "সংরক্ষণ নির্দেশিকা",
          content: "বক্স দুটি শুষ্ক ও স্বাভাবিক তাপমাত্রায় রাখুন। প্রতিটি ফয়েল প্যাক ব্যবহারের পূর্ব মুহূর্ত পর্যন্ত ইনট্যাক্ট রাখুন।"
        }
      ]
    }
  },

  // 5. Ribbed Condoms: 20pcs Combo (ribbed-condoms-20pcs-combo)
  {
    _id: "6ab81e97721c81cc89211371",
    slug: "ribbed-condoms-20pcs-combo",
    name: "Ribbed Condoms: 20pcs Combo",
    description: "High-value stimulation bundle consisting of 2 full boxes (20 condoms) of MO Ultra Ribbed series with TT silicone lubricant at massive 37% discount.",
    longDescription: "<p>Ribbed Condoms 20pcs Combo provides 2 boxes of textured micro-rib condoms designed for couples seeking enhanced stimulation, frictionless movement, and superior bulk savings.</p>",
    origin: "China Imported (ISO / CE Certified)",
    expiryDate: "Valid until 2030 (5 Years)",
    packSize: "20 Pieces Combo (2 Boxes x 10 pcs)",
    packageContents: "2 Factory Sealed Boxes (Total 20 Foil-Sealed Ultra Ribbed Condoms)",
    specifications: {
      "Combo Bundle Structure": "2 Full Boxes (10 pcs per box = Total 20 Condoms)",
      "Product Type Included": "MO Ultra Ribbed with TT Silicone Lubricant",
      "Material": "High-Tensile Natural Rubber Latex",
      "Texture / Pattern": "Continuous Spiral Micro-Ribs (Khajkata)",
      "Nominal Dimensions": "Width 52mm (±2mm) | Length 180-200mm",
      "Lubrication": "Premium TT Silicone Friction-Free Formula",
      "Regular Price": "৳800",
      "Combo Offer Price": "৳499 (Save ৳301 / 37% OFF)",
      "Certifications": "CE, FSC, ISO 4074, ISO 13485, US 510(k)",
      "Packaging": "Discreet Protective Parcel"
    },
    benefits: [
      {
        title: "Maximum Mega Savings (Save ৳301 / 37% OFF)",
        description: "Enjoy 2 full boxes (20 condoms) of MO Ultra Ribbed for only ৳499 instead of ৳800 regular price."
      },
      {
        title: "Dynamic Spiral Ribbed Contours",
        description: "Raised ridges create rhythmic stimulation and heightened friction with every movement for intense partner pleasure."
      },
      {
        title: "TT Silicone Lubrication Glide",
        description: "Infused with medical-grade TT silicone lube that stays slick and avoids drying or burning sensation."
      },
      {
        title: "Two-Box Independent Sealed Storage",
        description: "Use one box while the other remains completely factory airtight with shelf life up to 2030."
      },
      {
        title: "100% Discreet Unmarked Delivery",
        description: "Confidential delivery nationwide with plain unmarked packaging."
      }
    ],
    sections: [
      {
        heading: "Why Choose the 20pcs Ribbed Combo?",
        content: "Ribbed texture offers the most exciting sensation for adventurous couples. Buying 20 pieces together provides the best price in Bangladesh (৳499) while ensuring consistent supply."
      },
      {
        heading: "Quality Certification & Strength",
        content: "Tested for high tensile burst pressure and micro-pinholes under ISO 4074 standards. Safe for vigorous intimate use."
      }
    ],
    bn: {
      tagline: "২০ পিস রিবড মেগা কম্বো—খাঁজকাটা টেক্সচারের বাড়তি উদ্দীপনা ও ৩৭% বিশাল মূল্যছাড়",
      description: "এমও আল্ট্রা রিবডের ২টি পূর্ণ বক্স (মোট ২০টি কনডম) সমৃদ্ধ বিশেষ সেভিং কম্বো প্যাক। ৮০০ টাকার পণ্য এখন পাচ্ছেন মাত্র ৪৯৯ টাকায় (৩০১ টাকা সাশ্রয়)।",
      longDescription: "<p>রিবড কনডম ২০ পিস কম্বো প্যাক (Ribbed Condoms: 20pcs Combo) মিলনে বাড়তি রোমাঞ্চ ও তীব্র স্পর্শানুভূতির জন্য বিশেষ অফার বান্ডেল। এতে রয়েছে ২ বক্স (২০ পিস) স্পাইরাল খাঁজকাটা কনডম যা দিচ্ছে ৩৭% সরাসরি মূল্যছাড়। ২০৩০ সাল পর্যন্ত মেয়াদের নিশ্চয়তা।</p>",
      origin: "চীন থেকে সরাসরি আমদানিকৃত (ISO / CE সার্টিফাইড)",
      expiryDate: "২০৩০ সাল পর্যন্ত মেয়াদ (দীর্ঘস্থায়ী)",
      packSize: "২০ পিস কম্বো (২ বক্স x ১০ পিস)",
      packageContents: "২টি সিল্ড বক্স (মোট ২০টি আলাদা ফয়েল প্যাক)",
      specifications: {
        "কম্বো বিবরণ": "২টি বক্স (প্রতি বক্সে ১০ পিস = মোট ২০ পিস কনডম)",
        "অন্তর্ভুক্ত প্রোডাক্ট": "MO Ultra Ribbed টিটি সিলিকন লুব্রিকেন্ট সমৃদ্ধ",
        "উপাদান": "হাই-টেনসাইল প্রিমিয়াম ন্যাচারাল ল্যাটেক্স",
        "টেক্সচার / ডিজাইন": "স্পাইরাল ও অনুভূমিক মাইক্রো-রিবড (খাঁজকাটা)",
        "ডাইমেনশন": "প্রস্থ ৫২ মিমি (±২ মিমি) | দৈর্ঘ্য ১৮০ - ২০০ মিমি",
        "লুব্রিকেশন": "উন্নত TT সিলিকন লুব্রিকেন্ট",
        "রেগুলার মূল্য": "৳৮০০",
        "কম্বো অফার মূল্য": "৳৪৯৯ (সাশ্রয় ৩০১ টাকা / ৩৭% মেগা ডিসকাউন্ট)",
        "আন্তর্জাতিক স্বীকৃতি": "CE, FSC, ISO 4074, ISO 13485, US FDA 510(k)",
        "প্যাকেজিং": "সম্পূর্ণ গোপন ও ডিসক্রিট সিল্ড পার্সেল"
      },
      benefits: [
        {
          title: "সর্বোচ্চ সেভিং সুপার ডিল (৩০১ টাকা সাশ্রয়)",
          description: "এক সাথে ২০ পিস নেওয়ায় মিলছে ৩৭% অবিশ্বাস্য সরাসরি মূল্যছাড় (৮০০ টাকার পণ্য মাত্র ৪৯৯ টাকায়)।"
        },
        {
          title: "স্পাইরাল রিবড খাঁজের উদ্দীপনা",
          description: "ধারাবাহিক খাঁজকাটা টেক্সচার মিলনের প্রতিটি মুভমেন্টে তীব্র সেনসেশন এনে দেয়।"
        },
        {
          title: "উন্নত TT সিলিকন মসৃণতা",
          description: "দীর্ঘক্ষণ পিচ্ছিলভাব ধরে রাখে এবং ঘর্ষণজনিত অস্বস্তি পুরোপুরি দূর করে।"
        },
        {
          title: "ডাবল বক্স স্টক ২০৩০ সাল পর্যন্ত",
          description: "দুটি আলাদা বক্সে থাকায় একটি ব্যবহারের সময় অপরটি সম্পূর্ণ সতেজ ও সুরক্ষিত থাকে।"
        },
        {
          title: "শতভাগ গোপন ডেলিভারি",
          description: "কোনো নাম-চিহ্ন ছাড়া সম্পূর্ণ নিরপেক্ষ প্যাকেজিংয়ে হোম ডেলিভারি।"
        }
      ],
      sections: [
        {
          heading: "এই রিবড কম্বো কেন বেছে নেবেন?",
          content: "যারা মিলনে অতিরিক্ত ঘর্ষণ ও রোমাঞ্চকর স্পর্শ চান, তাদের জন্য এই ২০ পিস কম্বো প্যাকটি সবচেয়ে সাশ্রয়ী ও কার্যকর।"
        },
        {
          heading: "সংরক্ষণ নির্দেশিকা",
          content: "বক্স দুটি শুষ্ক ও স্বাভাবিক তাপমাত্রায় রাখুন। ব্যবহারের সময় একটি করে ফয়েল খুলুন।"
        }
      ]
    }
  },

  // 6. Dotted Condoms: 20pcs Combo (dotted-condoms-20pcs-combo)
  {
    _id: "6ab81e97721c81cc89211374",
    slug: "dotted-condoms-20pcs-combo",
    name: "Dotted Condoms: 20pcs Combo",
    description: "Multi-stimulation mega savings bundle containing 2 full boxes (20 condoms) of MO Dotted Pleasure series at an exclusive 30% discount.",
    longDescription: "<p>Dotted Condoms 20pcs Combo includes 2 boxes of raised-dot pleasure condoms with reinforced latex walls and high-glide silicone lubrication for heightened partner excitement and reliable protection.</p>",
    origin: "China Imported (ISO / CE Certified)",
    expiryDate: "Valid until 2030 (5 Years)",
    packSize: "20 Pieces Combo (2 Boxes x 10 pcs)",
    packageContents: "2 Factory Sealed Boxes (Total 20 Foil-Sealed Dotted Pleasure Condoms)",
    specifications: {
      "Combo Bundle Structure": "2 Full Boxes (10 pcs per box = Total 20 Condoms)",
      "Product Type Included": "MO Dotted Pleasure Multi-Stimulation Condoms",
      "Material": "Reinforced Natural Latex (0.065mm)",
      "Texture / Surface": "Raised Matrix Micro-Dots",
      "Nominal Dimensions": "Width 52mm (±2mm) | Length 180mm (±20mm)",
      "Lubrication": "Silicone Smooth Moisture Layer",
      "Regular Price": "৳800",
      "Combo Offer Price": "৳559 (Save ৳241 / 30% OFF)",
      "Certifications": "CE, ISO 4074, US 510(k), ISO 13485",
      "Packaging": "Discreet Confidential Double Box Carton"
    },
    benefits: [
      {
        title: "Exclusive Combo Discount (Save ৳241 / 30% OFF)",
        description: "Get 2 full factory boxes (20 condoms) for only ৳559 instead of ৳800 regular retail price."
      },
      {
        title: "Hundreds of Raised Pleasure Dots",
        description: "Precision-placed matrix dots produce targeted sensory stimulation, helping partner reach peak climax."
      },
      {
        title: "Reinforced 0.065mm Burst-Proof Latex",
        description: "Added thickness offers worry-free durability during energetic intimate sessions."
      },
      {
        title: "Dual Box Sealed Integrity",
        description: "Sealed independently to preserve factory lubrication and latex flexibility until 2030."
      },
      {
        title: "Confidential Shipping Guarantee",
        description: "Shipped in plain, anonymous packaging with no product mentions on the outer box."
      }
    ],
    sections: [
      {
        heading: "Dotted Pleasure Combo Advantages",
        content: "Dotted condoms deliver unique tactile excitement that plain condoms cannot match. This 20-piece pack saves you ৳241 while keeping you stocked with certified safe products."
      },
      {
        heading: "Storage & Safe Handling",
        content: "Store in a dry location below 30°C. Do not puncture foil packs with scissors or sharp objects."
      }
    ],
    bn: {
      tagline: "২০ পিস ডটেড মেগা কম্বো—উঁচু ডটের রোমাঞ্চ ও ৩০% সেভিং অফার",
      description: "এমও ডটেড প্লেজারের ২টি পূর্ণ বক্স (মোট ২০টি কনডম) সমৃদ্ধ বিশেষ সেভিং কম্বো প্যাক। ৮০০ টাকার পণ্য এখন পাচ্ছেন মাত্র ৫৫৯ টাকায় (২৪১ টাকা সাশ্রয়)।",
      longDescription: "<p>ডটেড কনডম ২০ পিস কম্বো প্যাক (Dotted Condoms: 20pcs Combo) পার্টনারের বাড়তি উত্তেজনা ও উদ্দীপনার জন্য সেরা পছন্দের কম্বো। এতে রয়েছে ২ বক্স (২০ পিস) উঁচু ডটেড কনডম যা দিচ্ছে ৩০% বিশেষ মূল্যছাড়। ২০৩০ সাল পর্যন্ত মেয়াদের নিশ্চয়তা।</p>",
      origin: "চীন থেকে সরাসরি আমদানিকৃত (ISO / CE সার্টিফাইড)",
      expiryDate: "২০৩০ সাল পর্যন্ত মেয়াদ (দীর্ঘস্থায়ী)",
      packSize: "২০ পিস কম্বো (২ বক্স x ১০ পিস)",
      packageContents: "২টি সিল্ড বক্স (মোট ২০টি আলাদা ফয়েল প্যাক)",
      specifications: {
        "কম্বো বিবরণ": "২টি বক্স (প্রতি বক্সে ১০ পিস = মোট ২০ পিস কনডম)",
        "অন্তর্ভুক্ত প্রোডাক্ট": "MO Dotted Pleasure রেইজড ডটেড কনডম",
        "উপাদান": "রিইনফোর্সড প্রিমিয়াম ন্যাচারাল ল্যাটেক্স",
        "টেক্সচার / ডিজাইন": "রেইজড মাইক্রো-ডটেড টেক্সচার (উঁচু ডট)",
        "ডাইমেনশন": "প্রস্থ ৫২ মিমি (±২ মিমি) | দৈর্ঘ্য ১৮০ মিমি (±২০ মিমি)",
        "পুরুত্ব": "০.০৬৫ মিমি (এক্সট্রা ডিউরেবল)",
        "লুব্রিকেশন": "সিল্কি সিলিকন লুব্রিকেন্ট",
        "রেগুলার মূল্য": "৳৮০০",
        "কম্বো অফার মূল্য": "৳৫৫৯ (সাশ্রয় ২৪১ টাকা / ৩০% ডিসকাউন্ট)",
        "আন্তর্জাতিক স্বীকৃতি": "CE, ISO 4074, US FDA 510(k), ISO 13485",
        "প্যাকেজিং": "সম্পূর্ণ গোপন ও ডিসক্রিট সিল্ড পার্সেল"
      },
      benefits: [
        {
          title: "৩০% বিশাল সাশ্রয়ী ডিল (২৪১ টাকা সাশ্রয়)",
          description: "২টি পূর্ণ বক্স (২০ পিস ডটেড কনডম) পাচ্ছেন ৮০০ টাকার বদলে মাত্র ৫৫৯ টাকায়।"
        },
        {
          title: "শত শত উঁচু ডটের বিশেষ সেনসেশন",
          description: "বিশেষ ডট টেক্সচার মিলনে তীব্র উদ্দীপনা ও স্পর্শানুভূতি তৈরি করে।"
        },
        {
          title: "মজবুত ০.০৬৫ মিমি গঠন",
          description: "ফেটে যাওয়া বা লিক হওয়ার কোনো ঝুঁকি ছাড়া নিশ্চিন্ত ও দীর্ঘস্থায়ী ব্যবহার।"
        },
        {
          title: "ডাবল বক্স স্টক ২০৩০ সাল পর্যন্ত",
          description: "আলাদা দুটি সিল্ড বক্সে থাকায় দীর্ঘদিন পর্যন্ত সতেজ ও সুরক্ষিত থাকে।"
        },
        {
          title: "শতভাগ গোপন ডেলিভারি",
          description: "বাইরে কোনো নাম বা লেখা ছাড়া সম্পূর্ণ গোপন প্যাকেজিংয়ে পাঠানো হয়।"
        }
      ],
      sections: [
        {
          heading: "ডটেড ২০ পিস কম্বো কেন কিনবেন?",
          content: "সঙ্গীর বিশেষ আনন্দের জন্য ডটেড কনডম সবচেয়ে জনপ্রিয়। এক সাথে ২০ পিস নিলে ডেলিভারি ও পণ্যের মূল্যে সর্বোচ্চ ২৪১ টাকা সাশ্রয় হয়।"
        },
        {
          heading: "সংরক্ষণ নির্দেশিকা",
          content: "বক্স দুটি শুষ্ক ও ঠাণ্ডা স্থানে সংরক্ষণ করুন। ব্যবহারের সময় একটি করে ফয়েল প্যাক খুলুন।"
        }
      ]
    }
  }
];

// Write update script to temporary file for remote execution
const mongoScript = `
const updates = ${JSON.stringify(updates)};

for (const u of updates) {
  const filter = { _id: ObjectId(u._id) };
  const updateDoc = {
    $set: {
      name: u.name,
      description: u.description,
      longDescription: u.longDescription,
      origin: u.origin,
      expiryDate: u.expiryDate,
      packSize: u.packSize,
      packageContents: u.packageContents,
      specifications: u.specifications,
      benefits: u.benefits,
      sections: u.sections,
      bn: u.bn,
      updatedAt: new Date()
    }
  };
  const res = db.products.updateOne(filter, updateDoc);
  print("Updated product " + u.slug + " (ID: " + u._id + "): matched " + res.matchedCount + ", modified " + res.modifiedCount);
}
`;

fs.writeFileSync("d:/mtEcomWhite/backend/scripts/update_surokkha_products_remote.js", mongoScript);
console.log("Remote update script written successfully.");
