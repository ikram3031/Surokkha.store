/*
  সুরক্ষা ব্লগ — শেয়ার্ড ডেটা + UI (blog-archive.html ও blog-post.html এটি ব্যবহার করে)
  নতুন লেখা যোগ করতে POSTS অ্যারেতে একটি অবজেক্ট বাড়ান। ক্যাটাগরি/ট্যাগ বাড়াতে CATS / TAGS দেখুন।
  ছবি দিতে লেখার অবজেক্টে image: 'URL' দিন; না দিলে ব্র্যান্ড-গ্র্যাডিয়েন্ট কভার দেখাবে।
*/
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        primary: { DEFAULT: 'rgb(var(--primary) / <alpha-value>)', foreground: 'rgb(var(--primary-foreground) / <alpha-value>)' },
        secondary: 'rgb(var(--secondary) / <alpha-value>)',
        muted: { DEFAULT: 'rgb(var(--muted) / <alpha-value>)', foreground: 'rgb(var(--muted-foreground) / <alpha-value>)' },
        accent: 'rgb(var(--accent) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        blush: 'rgb(var(--blush) / <alpha-value>)',
      },
      borderRadius: { '2xl': '1.25rem', '3xl': '1.75rem' },
    },
  },
};

window.SB = (() => {
  /* ───────── সাইট কনফিগ ───────── */
  const SITE = {
    shop: 'https://surokkha.store/',
    offer: 'https://surokkha.store/offer',
    wa: '8801600905774',
    email: 'surokkha.store@gmail.com',
    logo: '../SurokkhaStore/public/logo.png',
    logoDark: '../SurokkhaStore/public/logo_2.png',
    archive: 'blog-archive.html',
    post: 'blog-post.html',
    // নিউজলেটার ব্যাকএন্ড এন্ডপয়েন্ট (POST, JSON {email}) বসালে সাবস্ক্রিপশন সত্যিই সেভ হবে
    newsletterEndpoint: '',
  };

  /* ───────── ডেটা ───────── */
  const CATS = [
    { id: 'health', name: 'স্বাস্থ্য', icon: 'heart' },
    { id: 'safety', name: 'নিরাপত্তা', icon: 'shield' },
    { id: 'tips', name: 'টিপস', icon: 'bulb' },
    { id: 'myth', name: 'ভুল ধারণা', icon: 'help' },
    { id: 'guide', name: 'পণ্য গাইড', icon: 'box' },
  ];
  const TAGS = [
    { id: 'condom', name: 'কনডম' },
    { id: 'lube', name: 'লুব্রিকেন্ট' },
    { id: 'size', name: 'সাইজ' },
    { id: 'sti', name: 'STI' },
    { id: 'privacy', name: 'গোপনীয়তা' },
    { id: 'beginner', name: 'নতুনদের জন্য' },
    { id: 'contraception', name: 'গর্ভনিরোধ' },
    { id: 'storage', name: 'সংরক্ষণ' },
  ];

  const POSTS = [
    {
      slug: 'safe-relationship-5-things',
      title: 'নিরাপদ সম্পর্কের জন্য জেনে রাখা জরুরি ৫টি বিষয়',
      excerpt: 'সঠিক তথ্য জানলেই সঠিক সিদ্ধান্ত নেওয়া যায়। সহজ ভাষায় জেনে নিন প্রতিদিনের কাজে লাগার মতো পাঁচটি কথা।',
      cat: 'safety', tags: ['sti', 'contraception', 'beginner'], date: '2026-10-27', read: 5, pop: 98, g: 0, tone: 'light', featured: true,
      body: `
<p>নিরাপদ সম্পর্ক মানে শুধু একটি পণ্য ব্যবহার করা নয়; এটা একটা অভ্যাস। নিচের পাঁচটি বিষয় মনে রাখলে নিজের ও সঙ্গীর সুরক্ষা অনেক বেশি নিশ্চিত হয়।</p>
<h2>১. সম্মতি আর খোলামেলা কথা</h2>
<p>দুজনেরই স্পষ্ট ও স্বতঃস্ফূর্ত সম্মতি থাকা সবার আগে জরুরি। শুরুতেই সুরক্ষা নিয়ে কথা বলে নিলে পরে অস্বস্তি কমে যায়। “আমি কনডম ব্যবহার করতে চাই” কথাটা বলা লজ্জার কিছু নয়, বরং দায়িত্বশীলতার পরিচয়।</p>
<h2>২. প্রতিবার, শুরু থেকে শেষ পর্যন্ত</h2>
<p>কনডম কাজ করে তখনই, যখন সেটা <strong>প্রতিবার এবং শুরু থেকেই</strong> ব্যবহার করা হয়। মাঝপথে পরলে বা মাঝে মাঝে ব্যবহার করলে সুরক্ষা অনেকটাই কমে যায়।</p>
<blockquote>সুরক্ষা তখনই পূর্ণ, যখন সেটা অভ্যাসে পরিণত হয়।</blockquote>
<h2>৩. নিয়মিত স্বাস্থ্য পরীক্ষা</h2>
<p>অনেক যৌনবাহিত সংক্রমণের (STI) শুরুতে কোনো লক্ষণ থাকে না। তাই নতুন সঙ্গী হলে বা ঝুঁকি থাকলে চিকিৎসকের পরামর্শে নিয়মিত পরীক্ষা করানো ভালো।</p>
<h2>৪. মেয়াদ ও মান দেখে কিনুন</h2>
<p>প্যাকেটে মেয়াদের তারিখ (EXP) দেখুন, প্যাকেট ছেঁড়া বা চুপসে যাওয়া হলে ব্যবহার করবেন না। বিশ্বস্ত বিক্রেতার কাছ থেকে কেনাই নিরাপদ।</p>
<h2>৫. জরুরি পরিস্থিতিতে কী করবেন</h2>
<p>কনডম ছিঁড়ে গেলে বা ব্যবহার করা না হলে ও গর্ভধারণ এড়াতে চাইলে যত তাড়াতাড়ি সম্ভব ফার্মেসি বা চিকিৎসকের কাছে জরুরি গর্ভনিরোধ সম্পর্কে পরামর্শ নিন। দেরি করলে কার্যকারিতা কমে।</p>
<div class="callout"><b>মনে রাখুন</b>এই লেখা সাধারণ তথ্যের জন্য। ব্যক্তিগত স্বাস্থ্য-সমস্যায় অবশ্যই চিকিৎসকের পরামর্শ নিন।</div>`,
    },
    {
      slug: 'how-to-use-condom-correctly',
      title: 'কনডম ব্যবহারের সঠিক নিয়ম: ধাপে ধাপে',
      excerpt: 'ভুলভাবে পরলে সুরক্ষা কমে যায়। ছয়টি সহজ ধাপে জেনে নিন কীভাবে ব্যবহার করলে কনডম সবচেয়ে কার্যকর হয়।',
      cat: 'health', tags: ['condom', 'beginner', 'contraception'], date: '2026-10-20', read: 3, pop: 91, g: 6, tone: 'dark',
      body: `
<p>কনডম সঠিকভাবে ব্যবহার করলে গর্ভনিরোধে এটি প্রায় ৯৮% কার্যকর, আর বাস্তব জীবনের সাধারণ ব্যবহারে প্রায় ৮৭%। এই ফাঁকটা আসে মূলত ছোট ছোট ভুল থেকে। চলুন ভুলগুলো এড়ানো শিখি।</p>
<h2>শুরুর আগে যা দেখবেন</h2>
<ul class="checklist">
<li>প্যাকেটে মেয়াদের তারিখ পার হয়নি</li>
<li>প্যাকেট অক্ষত, ছেঁড়া বা চুপসানো নয়</li>
<li>হাতের নখ বা দাঁত দিয়ে প্যাকেট ছিঁড়বেন না</li>
</ul>
<h2>ছয় ধাপে ব্যবহার</h2>
<ol>
<li>আঙুল দিয়ে প্যাকেটের কিনারা থেকে সাবধানে ছিঁড়ে কনডম বের করুন।</li>
<li>কোন দিকে গোটানো, দেখে নিন। রিংটা বাইরের দিকে থাকবে।</li>
<li>ডগার ছোট জায়গাটা আঙুলে চেপে বাতাস বের করুন, এখানে বীর্য জমার জায়গা থাকে।</li>
<li>পুরোপুরি উত্তেজিত অবস্থায় ডগা চেপে ধরে নিচের দিকে গোড়া পর্যন্ত গড়িয়ে দিন।</li>
<li>মিলনের পর কনডমের গোড়া ধরে রেখে সরে আসুন, যাতে খুলে না যায়।</li>
<li>গিঁট বেঁধে টিস্যুতে মুড়ে ময়লার ঝুড়িতে ফেলুন। ফ্লাশ করবেন না।</li>
</ol>
<div class="callout"><b>দুটো একসাথে নয়</b>একসঙ্গে দুটো কনডম পরলে ঘর্ষণে ছিঁড়ে যাওয়ার ঝুঁকি বাড়ে। একবারে একটিই, প্রতিবার নতুন।</div>
<h2>আরামের জন্য</h2>
<p>শুষ্কতা থাকলে ঘর্ষণ বাড়ে। তাই পানি-ভিত্তিক লুব্রিকেন্ট ব্যবহার করতে পারেন। কোন লুব্রিকেন্ট নিরাপদ, তা নিয়ে আলাদা লেখা আছে।</p>`,
    },
    {
      slug: '7-condom-myths',
      title: 'কনডম নিয়ে ৭টি প্রচলিত ভুল ধারণা',
      excerpt: 'যা শুনে আসছেন, তার অনেকটাই ঠিক নয়। ভুল ধারণা ভাঙলেই সুরক্ষা নিয়ে আত্মবিশ্বাস বাড়ে।',
      cat: 'myth', tags: ['condom', 'sti', 'contraception'], date: '2026-10-12', read: 4, pop: 95, g: 2, tone: 'dark',
      body: `
<p>কনডম নিয়ে সমাজে অনেক কথা চালু আছে। তার বেশিরভাগই গুজব। সত্যটা জেনে নিন।</p>
<h2>১. “দুটো পরলে বেশি নিরাপদ”</h2>
<p>উল্টো। দুটো কনডমের মধ্যে ঘর্ষণ হয়, ছিঁড়ে যাওয়ার সম্ভাবনা বাড়ে। একটিই যথেষ্ট, সঠিকভাবে পরলেই।</p>
<h2>২. “সব কনডম একই মাপের”</h2>
<p>না। প্রস্থ ভিন্ন হয়। ঢিলা হলে খুলে যেতে পারে, বেশি টাইট হলে ছিঁড়ে যেতে পারে। সঠিক মাপ নিয়ে আলাদা লেখা দেখুন।</p>
<h2>৩. “বীর্যপাতের আগে সরে এলেই যথেষ্ট”</h2>
<p>বীর্যপাতের আগের তরলেও শুক্রাণু থাকতে পারে। এই পদ্ধতি নির্ভরযোগ্য নয়।</p>
<h2>৪. “কনডম পরলে আনন্দ কমে যায়”</h2>
<p>এখনকার আল্ট্রা-থিন কনডম অনেক পাতলা। ঠিক মাপ ও লুব্রিকেন্ট ব্যবহারে অনুভূতি বেশ স্বাভাবিক থাকে। নিজের পছন্দের ধরনটা খুঁজে নেওয়াই আসল।</p>
<h2>৫. “কনডম সব সংক্রমণ থেকে ১০০% বাঁচায়”</h2>
<p>সঠিক ব্যবহারে ঝুঁকি অনেক কমে, বিশেষ করে এইচআইভি ও গনোরিয়ার মতো সংক্রমণে। তবে কনডম যে অংশ ঢাকে না, সেখানকার ত্বকের সংস্পর্শে ছড়ানো সংক্রমণের ঝুঁকি থেকে যায়। তাই নিয়মিত পরীক্ষা জরুরি।</p>
<h2>৬. “মানিব্যাগে রাখলেই হয়”</h2>
<p>মানিব্যাগের গরম ও চাপে কনডম নষ্ট হতে পারে। এ নিয়ে সংরক্ষণের লেখাটি দেখুন।</p>
<h2>৭. “ল্যাটেক্স অ্যালার্জি থাকলে কোনো উপায় নেই”</h2>
<p>উপায় আছে। ল্যাটেক্স-মুক্ত (পলিআইসোপ্রিন বা পলিইউরিথিন) কনডম পাওয়া যায়। চিকিৎসকের পরামর্শ নিন।</p>`,
    },
    {
      slug: 'choose-right-condom-size',
      title: 'সঠিক সাইজের কনডম বেছে নেওয়ার সহজ উপায়',
      excerpt: 'ঢিলা বা টাইট, দুটোই ঝুঁকির। নিজের জন্য ঠিক মাপ কীভাবে বুঝবেন, তার সহজ গাইড।',
      cat: 'tips', tags: ['condom', 'size', 'beginner'], date: '2026-10-05', read: 3, pop: 84, g: 3, tone: 'light',
      body: `
<p>কনডমের আকার শুধু আরামের বিষয় নয়, এটা সুরক্ষারও বিষয়। ভুল মাপ মানে খুলে যাওয়া বা ছিঁড়ে যাওয়ার ঝুঁকি।</p>
<h2>দৈর্ঘ্য নয়, প্রস্থ আসল</h2>
<p>কনডম ভালোভাবে ফিট হয় মূলত <strong>প্রস্থের (width)</strong> ওপর। প্যাকেটে “nominal width” মিলিমিটারে লেখা থাকে। সাধারণত ৫২–৫৪ মিমি প্রস্থকে স্ট্যান্ডার্ড ধরা হয়।</p>
<h2>ঠিক ফিটের লক্ষণ</h2>
<ul class="checklist">
<li>গোড়া পর্যন্ত সহজে গড়িয়ে নামে</li>
<li>ত্বকের সাথে আরামে লেগে থাকে, চাপ লাগে না</li>
<li>ব্যবহারের সময় সরে যায় না বা খুলে আসে না</li>
</ul>
<h2>মাপ ভুল হলে বুঝবেন কীভাবে</h2>
<p><strong>বেশি টাইট:</strong> গড়াতে কষ্ট হয়, চাপ লাগে, ছিঁড়ে যেতে পারে। <strong>বেশি ঢিলা:</strong> সরে যায় বা খুলে আসে, ভেতরে বাতাস জমে।</p>
<div class="callout"><b>পরামর্শ</b>নিশ্চিত না হলে প্রথমে ছোট প্যাক কিনে একটু পরীক্ষা করে দেখুন। যেটা আরাম দেয়, সেটাই পরে বড় প্যাকে নিন।</div>`,
    },
    {
      slug: 'shop-online-discreetly',
      title: 'গোপনীয়তা বজায় রেখে অনলাইনে কেনাকাটার উপায়',
      excerpt: 'দোকানে গিয়ে কিনতে অস্বস্তি? গোপন প্যাকেজিং আর ক্যাশ অন ডেলিভারিতে নিশ্চিন্তে অর্ডার করার গাইড।',
      cat: 'safety', tags: ['privacy', 'beginner'], date: '2026-09-28', read: 3, pop: 88, g: 4, tone: 'dark',
      body: `
<p>অনেকেই দোকানে গিয়ে এসব পণ্য কিনতে অস্বস্তি বোধ করেন। অনলাইনে কেনা হতে পারে সহজ ও সম্মানজনক সমাধান, যদি কয়েকটা বিষয় দেখে নেন।</p>
<h2>যা দেখে অর্ডার করবেন</h2>
<ul class="checklist">
<li><strong>গোপন প্যাকেজিং:</strong> বাইরে থেকে ভেতরের পণ্য বোঝা যাবে না</li>
<li><strong>ক্যাশ অন ডেলিভারি:</strong> আগে টাকা দেওয়ার ঝুঁকি নেই</li>
<li><strong>সরাসরি যোগাযোগের মাধ্যম:</strong> প্রশ্ন থাকলে WhatsApp-এ জানা যায়</li>
<li><strong>অপ্রয়োজনীয় তথ্য চায় না:</strong> শুধু ডেলিভারির জন্য যতটুকু লাগে</li>
</ul>
<h2>নিজের দিক থেকে যা করবেন</h2>
<p>ডেলিভারির সময় নিজে বা বিশ্বস্ত কেউ যেন ফোন ধরতে পারেন, ঠিকানা স্পষ্ট দিন। পণ্য হাতে পেয়ে মেয়াদের তারিখ আর প্যাকেট অক্ষত কিনা দেখে নিন।</p>
<blockquote>গোপনীয়তা আপনার অধিকার। সংকোচের কিছু নেই।</blockquote>`,
    },
    {
      slug: 'which-lubricant-is-safe',
      title: 'কোন লুব্রিকেন্ট কনডমের সাথে নিরাপদ?',
      excerpt: 'ভুল লুব্রিকেন্ট ল্যাটেক্স কনডম নষ্ট করে দিতে পারে। পানি, সিলিকন আর তেল-ভিত্তিকের পার্থক্য জেনে নিন।',
      cat: 'guide', tags: ['lube', 'condom'], date: '2026-09-20', read: 4, pop: 79, g: 1, tone: 'light',
      body: `
<p>লুব্রিকেন্ট ঘর্ষণ কমায়, আরাম বাড়ায় এবং কনডম ছিঁড়ে যাওয়ার সম্ভাবনা কমাতে সাহায্য করে। কিন্তু সব লুব্রিকেন্ট সব কনডমের জন্য নয়।</p>
<h2>তিন ধরনের লুব্রিকেন্ট</h2>
<h3>পানি-ভিত্তিক (Water-based)</h3>
<p>ল্যাটেক্স কনডমের সাথে সবচেয়ে নিরাপদ ও সহজলভ্য। সহজে ধুয়ে যায়। শুকিয়ে গেলে আবার লাগাতে হতে পারে।</p>
<h3>সিলিকন-ভিত্তিক</h3>
<p>বেশিক্ষণ টেকে এবং ল্যাটেক্স কনডমের সাথে নিরাপদ। তবে সিলিকন খেলনার সাথে ব্যবহার করবেন না, ক্ষতি হতে পারে।</p>
<h3>তেল-ভিত্তিক</h3>
<p>ভ্যাসলিন, নারকেল তেল, বেবি অয়েল বা লোশন <strong>ল্যাটেক্স কনডম দুর্বল করে ছিঁড়ে ফেলতে পারে</strong>। কনডমের সাথে এগুলো ব্যবহার করবেন না।</p>
<div class="callout"><b>নতুনদের জন্য সহজ নিয়ম</b>কনডমের সাথে নিশ্চিন্ত থাকতে চাইলে পানি-ভিত্তিক লুব্রিকেন্ট বেছে নিন। প্রথমবার ব্যবহারের আগে হাতের ত্বকে অল্প লাগিয়ে দেখে নিন জ্বালা করে কিনা।</div>
<h2>কীভাবে ব্যবহার করবেন</h2>
<ol>
<li>কনডম পরার পর বাইরের দিকে অল্প লাগান।</li>
<li>দরকার হলে মাঝপথে আবার যোগ করুন।</li>
<li>বেশি পরিমাণ নয়, অল্পই যথেষ্ট।</li>
</ol>`,
    },
    {
      slug: 'store-condoms-safely',
      title: 'কনডম কোথায় রাখবেন? সংরক্ষণ ও মেয়াদের সহজ নিয়ম',
      excerpt: 'গরম, রোদ আর চাপে কনডম নষ্ট হয়ে যায়। মানিব্যাগ, গাড়ি বা বালিশের নিচে নয়, তাহলে কোথায়?',
      cat: 'tips', tags: ['condom', 'storage'], date: '2026-09-12', read: 3, pop: 66, g: 5, tone: 'light',
      body: `
<p>একটা ভালো কনডমও ভুলভাবে রাখলে নষ্ট হয়ে যেতে পারে। সংরক্ষণের নিয়ম খুব সহজ।</p>
<h2>কোথায় রাখবেন</h2>
<ul class="checklist">
<li>ঠাণ্ডা, শুকনো ও ছায়াযুক্ত জায়গায়, যেমন ড্রয়ার বা বাক্সে</li>
<li>সরাসরি রোদ ও তাপ থেকে দূরে</li>
<li>ধারালো জিনিস, চাবি বা কয়েন থেকে আলাদা</li>
</ul>
<h2>যেখানে রাখবেন না</h2>
<p>মানিব্যাগ বা পকেটে বেশিদিন, গাড়ির ড্যাশবোর্ড, বাথরুম, বালিশের নিচে। এসব জায়গায় গরম, আর্দ্রতা বা ঘর্ষণে প্যাকেট দুর্বল হয়ে পড়ে।</p>
<h2>ব্যবহারের আগে দেখে নিন</h2>
<ol>
<li>মেয়াদের তারিখ (EXP) পার হয়েছে কিনা</li>
<li>প্যাকেটে বাতাসের বুদবুদ আছে কিনা, থাকলে চাপ দিলে মনে হবে বালিশের মতো। চুপসানো হলে সন্দেহজনক</li>
<li>খোলার পর কনডম শুকনো, আঠালো বা ভঙ্গুর হলে ফেলে দিন</li>
</ol>
<div class="callout"><b>বাইরে গেলে</b>সাথে নিতে হলে শক্ত ছোট বাক্সে রাখুন এবং বেশিদিন বহন করবেন না।</div>`,
    },
    {
      slug: 'sti-basics-and-condoms',
      title: 'যৌনবাহিত সংক্রমণ (STI): কনডম কতটা সুরক্ষা দেয়?',
      excerpt: 'STI কী, লক্ষণ কী, কনডম কতটা রক্ষা করে আর কখন চিকিৎসকের কাছে যাবেন, সহজ ভাষায় প্রাথমিক ধারণা।',
      cat: 'health', tags: ['sti', 'condom'], date: '2026-09-03', read: 5, pop: 72, g: 7, tone: 'light',
      body: `
<p>যৌনবাহিত সংক্রমণ (STI) নিয়ে আমাদের সমাজে লজ্জা আর ভুল ধারণা অনেক। কিন্তু সঠিক তথ্য জানলে প্রতিরোধ ও চিকিৎসা দুটোই সহজ হয়।</p>
<h2>STI কী</h2>
<p>যৌন সংস্পর্শের মাধ্যমে ছড়ানো ব্যাকটেরিয়া, ভাইরাস বা পরজীবীজনিত সংক্রমণকে STI বলে। গনোরিয়া, ক্ল্যামিডিয়া, সিফিলিস, হারপিস ও এইচআইভি এর মধ্যে পরিচিত।</p>
<h2>লক্ষণ চেনার উপায়</h2>
<ul>
<li>প্রস্রাবে জ্বালা বা ব্যথা</li>
<li>অস্বাভাবিক স্রাব বা দুর্গন্ধ</li>
<li>যৌনাঙ্গে ঘা, ফোসকা বা চুলকানি</li>
<li>তলপেটে ব্যথা</li>
</ul>
<p>অনেক সময় কোনো লক্ষণই থাকে না, তাই লক্ষণ না থাকলেও পরীক্ষা জরুরি।</p>
<h2>কনডম কতটা সুরক্ষা দেয়</h2>
<p>সঠিক ও নিয়মিত ব্যবহারে কনডম অনেক STI-র ঝুঁকি উল্লেখযোগ্যভাবে কমায়। তবে এটি ১০০% নিশ্চয়তা নয়, বিশেষ করে ত্বকের সংস্পর্শে ছড়ানো সংক্রমণে।</p>
<h2>কখন চিকিৎসকের কাছে যাবেন</h2>
<p>লক্ষণ দেখা দিলে, ঝুঁকিপূর্ণ সংস্পর্শের পর, বা নতুন সঙ্গীর আগে। নিজে নিজে ওষুধ খাবেন না।</p>
<div class="callout"><b>সতর্কতা</b>এটি সাধারণ তথ্য, চিকিৎসা পরামর্শের বিকল্প নয়।</div>`,
    },
    {
      slug: 'beginner-condom-buying-guide',
      title: 'প্রথমবার কনডম কিনছেন? নতুনদের জন্য সহজ গাইড',
      excerpt: 'আল্ট্রা থিন, ডটেড, রিবড, কোনটা কেমন? নিজের জন্য ঠিক ধরনটা বেছে নেওয়ার সহজ নির্দেশিকা।',
      cat: 'guide', tags: ['condom', 'beginner', 'size'], date: '2026-08-25', read: 4, pop: 90, g: 2, tone: 'dark',
      body: `
<p>প্রথমবার কিনতে গেলে অনেকে দ্বিধায় পড়েন। বাজারে নানা রকম, কোনটা নেবেন? চিন্তা নেই, কয়েকটা প্রশ্নের উত্তরেই সিদ্ধান্ত সহজ।</p>
<h2>প্রধান ধরনগুলো</h2>
<h3>রেগুলার</h3>
<p>সাধারণ পুরুত্ব, সবচেয়ে প্রচলিত। প্রথমবারের জন্য ভালো শুরু।</p>
<h3>আল্ট্রা থিন</h3>
<p>পাতলা, ফলে অনুভূতি বেশি স্বাভাবিক লাগে। যাঁদের কাছে অনুভূতি জরুরি তাঁদের পছন্দ।</p>
<h3>ডটেড / রিবড</h3>
<p>গায়ে ছোট বিন্দু বা খাঁজ থাকে, বাড়তি অনুভূতির জন্য।</p>
<h3>ফ্লেভার্ড</h3>
<p>স্বাদযুক্ত, মূলত মুখমৈথুনের জন্য।</p>
<h2>কেনার আগে ভেবে নিন</h2>
<ol>
<li><strong>মাপ:</strong> প্রস্থ দেখুন। সাইজ নিয়ে আলাদা লেখা আছে।</li>
<li><strong>উপাদান:</strong> ল্যাটেক্স অ্যালার্জি থাকলে ল্যাটেক্স-মুক্ত বেছে নিন।</li>
<li><strong>লুব্রিকেন্ট:</strong> আরামের জন্য পানি-ভিত্তিক লুব্রিকেন্ট সাথে রাখুন।</li>
<li><strong>মেয়াদ:</strong> প্যাকেটে EXP দেখে নিন।</li>
</ol>
<div class="callout"><b>শুরুতে ছোট প্যাক</b>প্রথমে ছোট প্যাক কিনে পরীক্ষা করুন কোনটা আপনার কাছে আরামদায়ক। পরে প্রয়োজন অনুযায়ী বড় প্যাকে যান।</div>`,
    },
  ];

  /* ───────── সহায়ক ফাংশন ───────── */
  const BN = '০১২৩৪৫৬৭৮৯';
  const MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  const bn = (n) => String(n).replace(/\d/g, (d) => BN[d]);
  const fmtDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${bn(d)} ${MONTHS[m - 1]} ${bn(y)}`; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const catOf = (id) => CATS.find((c) => c.id === id);
  const tagOf = (id) => TAGS.find((t) => t.id === id);
  const postUrl = (p) => `${SITE.post}?slug=${encodeURIComponent(p.slug)}`;
  const archiveUrl = (o = {}) => {
    const q = new URLSearchParams();
    if (o.cat && o.cat !== 'all') q.set('cat', o.cat);
    if (o.tag) q.set('tag', o.tag);
    if (o.q) q.set('q', o.q);
    const s = q.toString();
    return SITE.archive + (s ? '?' + s : '');
  };
  const waLink = (text) => `https://wa.me/${SITE.wa}?text=${encodeURIComponent(text || 'আসসালামু আলাইকুম, আমি সুরক্ষা থেকে অর্ডার করতে চাই।')}`;

  const ICONS = {
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
    box: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    menu: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
    up: '<path d="m18 15-6-6-6 6"/>',
    thumbUp: '<path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
    thumbDown: '<path d="M17 14V2M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/>',
  };
  const icon = (name, cls = 'h-5 w-5') =>
    `<svg viewBox="0 0 24 24" class="${cls}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  /* ───────── কভার (ছবি না থাকলে ব্র্যান্ড-গ্র্যাডিয়েন্ট) ───────── */
  const GRADS = [['#fbd6db', '#f4919f'], ['#f5e6d3', '#eab9a4'], ['#6b1d37', '#c9475f'], ['#fbf5ec', '#f4b6bf'], ['#4d1224', '#8a2b46'], ['#ebd5ba', '#f4919f'], ['#f4919f', '#c9475f'], ['#fbd6db', '#ebd5ba']];
  const cover = (p, cls = 'aspect-[16/10]') => {
    const g = GRADS[p.g % GRADS.length];
    const fg = p.tone === 'dark' ? '#fbf5ec' : '#4d1224';
    const ic = catOf(p.cat)?.icon || 'heart';
    return `<div class="relative overflow-hidden ${cls}" style="background:linear-gradient(135deg,${g[0]},${g[1]});color:${fg}">
      <div class="cover-inner absolute inset-0">
        <span class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20"></span>
        <span class="absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-white/15"></span>
        <span class="absolute bottom-6 right-10 h-10 w-10 rounded-full bg-white/20"></span>
        ${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy" class="absolute inset-0 h-full w-full object-cover" onerror="this.remove()">` : `
        <span class="absolute left-1/2 top-1/2 grid h-[34%] aspect-square -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/25 backdrop-blur-sm"><svg viewBox="0 0 24 24" class="h-1/2 w-1/2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[ic]}</svg></span>`}
      </div></div>`;
  };

  /* ───────── কার্ড ───────── */
  const card = (p, i = 0) => {
    const c = catOf(p.cat);
    return `<a href="${postUrl(p)}" class="post-card rise group flex flex-col overflow-hidden rounded-3xl border border-border bg-card" style="animation-delay:${Math.min(i, 8) * 55}ms">
      ${cover(p)}
      <div class="flex flex-1 flex-col p-5">
        <div class="flex items-center justify-between gap-3 text-xs">
          <span class="rounded-full bg-accent px-2.5 py-1 font-semibold text-foreground">${c.name}</span>
          <span class="inline-flex items-center gap-1 text-muted-foreground">${icon('clock', 'h-3.5 w-3.5')}${bn(p.read)} মিনিট</span>
        </div>
        <h3 class="font-display mt-3 line-clamp-2 text-lg font-bold leading-snug transition group-hover:text-primary">${p.title}</h3>
        <p class="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">${p.excerpt}</p>
        <div class="mt-auto flex items-center justify-between pt-4 text-sm">
          <span class="text-muted-foreground">${fmtDate(p.date)}</span>
          <span class="inline-flex items-center gap-1 font-semibold text-primary">পড়ুন <span class="transition group-hover:translate-x-1">${icon('arrow', 'h-4 w-4')}</span></span>
        </div>
      </div></a>`;
  };

  /* ───────── CTA ব্লক ───────── */
  const benefits = ['গোপন প্যাকেজিং', 'ক্যাশ অন ডেলিভারি', 'bKash / Nagad পেমেন্ট', 'WhatsApp-এ সরাসরি সাহায্য'];
  const cta = (variant = 'end', ctx = '') => {
    const msg = ctx ? `আসসালামু আলাইকুম, "${ctx}" লেখাটা পড়ে অর্ডার করতে চাই।` : '';
    if (variant === 'inline') {
      return `<aside data-cta="inline" class="not-prose my-10 overflow-hidden rounded-3xl border border-ring/60 bg-accent/60 p-5 sm:p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-primary">সুরক্ষা শপ</p>
            <p class="font-display mt-1 text-xl font-bold leading-snug">নিরাপদ থাকতে ঠিক পণ্যটা হাতের কাছে রাখুন</p>
            <p class="mt-1 text-sm text-muted-foreground">গোপন প্যাকেজিংয়ে ঘরে বসে অর্ডার, ক্যাশ অন ডেলিভারি।</p>
          </div>
          <a href="${SITE.shop}" class="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:scale-105 active:scale-95">পণ্য দেখুন ${icon('arrow', 'h-4 w-4')}</a>
        </div></aside>`;
    }
    return `<section data-cta="end" class="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground">
      <span class="floaty pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10"></span>
      <span class="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-white/10"></span>
      <div class="relative grid gap-6 p-6 sm:p-9 md:grid-cols-[1.3fr_1fr] md:items-center">
        <div>
          <p class="text-sm font-semibold uppercase tracking-wider opacity-80">আজই নিশ্চিন্ত হন</p>
          <h2 class="font-display mt-2 text-2xl font-extrabold leading-snug sm:text-3xl">সুরক্ষা থাকুক সবসময়, ঘরে বসেই</h2>
          <ul class="mt-4 grid gap-2 text-[0.95rem] sm:grid-cols-2">
            ${benefits.map((b) => `<li class="flex items-center gap-2"><span class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20">${icon('check', 'h-3 w-3')}</span>${b}</li>`).join('')}
          </ul>
        </div>
        <div class="flex flex-col gap-3">
          <a href="${SITE.shop}" class="pulse-ring inline-flex h-14 items-center justify-center gap-2 rounded-full bg-card px-6 text-lg font-bold text-primary transition hover:scale-[1.03] active:scale-95">এখনই অর্ডার করুন ${icon('arrow', 'h-5 w-5')}</a>
          <a href="${waLink(msg)}" target="_blank" rel="noopener" class="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/40 px-6 font-semibold transition hover:bg-white/10">${icon('chat', 'h-5 w-5')} WhatsApp-এ জিজ্ঞেস করুন</a>
          <p class="text-center text-xs opacity-75">প্রতিদিন সকাল ১০টা থেকে রাত ১০টা</p>
        </div>
      </div></section>`;
  };

  /* ───────── হেডার / ফুটার ───────── */
  const header = () => `
<div class="bg-primary text-primary-foreground">
  <p class="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-0.5 px-4 py-2 text-center text-xs font-medium sm:text-sm">
    <span class="inline-flex items-center gap-1.5">${icon('lock', 'h-3.5 w-3.5')} গোপন প্যাকেজিং</span>
    <span class="inline-flex items-center gap-1.5">${icon('truck', 'h-3.5 w-3.5')} ক্যাশ অন ডেলিভারি</span>
    <span class="hidden opacity-80 sm:inline">১৮+ প্রাপ্তবয়স্কদের জন্য</span>
  </p>
</div>
<header class="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
  <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
    <a href="${SITE.archive}" class="flex items-center" aria-label="সুরক্ষা ব্লগ হোম">
      <img src="${SITE.logo}" alt="Surokkha" class="h-9 w-auto dark:hidden" width="100" height="32">
      <img src="${SITE.logoDark}" alt="Surokkha" class="hidden h-9 w-auto dark:block" width="100" height="32">
      <span class="ml-3 hidden border-l border-border pl-3 font-display text-sm font-bold text-muted-foreground sm:inline">ব্লগ</span>
    </a>
    <nav class="hidden items-center gap-1 text-[0.95rem] font-medium md:flex" aria-label="প্রধান মেনু">
      <a href="${SITE.archive}" class="rounded-full px-4 py-2 transition hover:bg-accent/60">সব লেখা</a>
      <a href="${SITE.shop}" class="rounded-full px-4 py-2 transition hover:bg-accent/60">শপ</a>
      <a href="${SITE.offer}" class="rounded-full px-4 py-2 transition hover:bg-accent/60">অফার</a>
      <a href="${waLink()}" target="_blank" rel="noopener" class="rounded-full px-4 py-2 transition hover:bg-accent/60">যোগাযোগ</a>
    </nav>
    <div class="flex items-center gap-2">
      <button id="themeToggle" type="button" aria-label="থিম বদলান" class="grid h-10 w-10 place-items-center rounded-full border border-border bg-card transition hover:border-primary hover:text-primary">
        <span class="dark:hidden">${icon('moon', 'h-5 w-5')}</span><span class="hidden dark:inline">${icon('sun', 'h-5 w-5')}</span>
      </button>
      <a href="${SITE.shop}" class="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition hover:scale-105 active:scale-95">অর্ডার করুন</a>
    </div>
  </div>
</header>`;

  const footer = () => `
<footer class="footer-surface mt-20">
  <div class="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
    <div>
      <img src="${SITE.logoDark}" alt="Surokkha" class="h-10 w-auto">
      <p class="mt-3 text-sm opacity-70">Safe today, tomorrow too.</p>
      <p class="mt-3 max-w-xs text-sm opacity-60">সুস্থ ও নিরাপদ সম্পর্ক নিয়ে সহজ ভাষায় সঠিক তথ্য।</p>
    </div>
    <div class="text-sm">
      <h3 class="font-semibold">যোগাযোগ</h3>
      <ul class="mt-3 space-y-2 opacity-75">
        <li>WhatsApp: <a class="hover:underline" href="${waLink()}" target="_blank" rel="noopener">+880 1600-905774</a></li>
        <li>Email: <a class="hover:underline" href="mailto:${SITE.email}">${SITE.email}</a></li>
        <li>প্রতিদিন সকাল ১০টা – রাত ১০টা</li>
      </ul>
    </div>
    <div class="text-sm">
      <h3 class="font-semibold">পেমেন্ট</h3>
      <ul class="mt-3 space-y-2 opacity-75"><li>bKash</li><li>Nagad</li><li>ক্যাশ অন ডেলিভারি</li></ul>
    </div>
  </div>
  <div class="border-t border-white/15 px-4 py-5 text-center text-xs opacity-60">
    <p>এই সাইটের পণ্য শুধুমাত্র ১৮ বছর বা তার বেশি বয়সীদের জন্য। এই ব্লগের লেখা সাধারণ তথ্যের জন্য, চিকিৎসা পরামর্শের বিকল্প নয়।</p>
    <p class="mt-1">&copy; ২০২৬ Surokkha Store. সর্বস্বত্ব সংরক্ষিত।</p>
  </div>
</footer>

<!-- মোবাইলে ভাসমান অর্ডার বার (স্ক্রল করলে দেখা যায়) -->
<div id="stickyCta" class="pointer-events-none fixed inset-x-0 bottom-0 z-30 translate-y-full px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] transition-transform duration-300 lg:hidden">
  <div class="pointer-events-auto mx-auto flex max-w-md items-center gap-2 rounded-full border border-border bg-card/95 p-2 shadow-2xl shadow-primary/30 backdrop-blur">
    <a href="${SITE.shop}" class="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary font-bold text-primary-foreground">এখনই অর্ডার করুন</a>
    <a href="${waLink()}" target="_blank" rel="noopener" aria-label="WhatsApp" class="grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white">${icon('chat', 'h-6 w-6')}</a>
    <button type="button" id="stickyClose" aria-label="বন্ধ করুন" class="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-accent/60">${icon('x', 'h-4 w-4')}</button>
  </div>
</div>

<!-- ডেস্কটপে ভাসমান WhatsApp -->
<a href="${waLink()}" target="_blank" rel="noopener" aria-label="WhatsApp-এ কথা বলুন" class="fixed bottom-6 right-6 z-30 hidden h-14 items-center gap-2 rounded-full bg-[#25D366] pl-4 pr-5 font-semibold text-white shadow-xl transition hover:scale-105 lg:inline-flex">${icon('chat', 'h-6 w-6')} জিজ্ঞেস করুন</a>

<button id="toTop" type="button" aria-label="উপরে যান" class="fixed bottom-24 right-5 z-30 hidden h-11 w-11 place-items-center rounded-full border border-border bg-card shadow-lg transition hover:border-primary hover:text-primary lg:bottom-24 lg:right-8">${icon('up', 'h-5 w-5')}</button>`;

  /* ───────── সাইডবার ───────── */
  const sidebarShell = () => `
<div id="sbOverlay" class="pointer-events-none fixed inset-0 z-40 bg-foreground/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden"></div>
<aside id="sidebar" aria-label="ক্যাটাগরি ও ট্যাগ"
  class="no-scrollbar invisible fixed inset-y-0 left-0 z-50 w-[88%] max-w-sm -translate-x-full space-y-6 overflow-y-auto bg-background p-5 shadow-2xl transition-[transform,visibility] duration-300 ease-[cubic-bezier(.32,.72,0,1)] lg:visible lg:sticky lg:top-24 lg:z-auto lg:max-h-[calc(100vh-7rem)] lg:w-auto lg:max-w-none lg:translate-x-0 lg:self-start lg:overflow-y-auto lg:bg-transparent lg:p-0 lg:pr-1 lg:shadow-none">
  <div class="flex items-center justify-between lg:hidden">
    <p class="font-display text-xl font-bold">ক্যাটাগরি ও ট্যাগ</p>
    <button id="sbClose" type="button" aria-label="বন্ধ করুন" class="grid h-10 w-10 place-items-center rounded-full border border-border bg-card">${icon('x', 'h-5 w-5')}</button>
  </div>

  <form action="${SITE.archive}" method="get" role="search" id="sbSearch">
    <label for="q" class="sr-only">লেখা খুঁজুন</label>
    <div class="relative">
      <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">${icon('search', 'h-5 w-5')}</span>
      <input id="q" name="q" type="search" autocomplete="off" placeholder="লেখা খুঁজুন..." class="h-12 w-full rounded-full border border-border bg-card pl-12 pr-4 outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-4 focus:ring-ring/30 [&::-webkit-search-cancel-button]:appearance-none">
    </div>
  </form>

  <section class="rounded-3xl border border-border bg-card p-4">
    <h2 class="px-1 pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">ব্লগ ক্যাটাগরি</h2>
    <nav id="sbCats" class="space-y-1"></nav>
  </section>

  <section class="rounded-3xl border border-border bg-card p-4">
    <h2 class="px-1 pb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">ট্যাগ</h2>
    <div id="sbTags" class="flex flex-wrap gap-2"></div>
  </section>

  <section class="rounded-3xl border border-border bg-card p-4">
    <h2 class="px-1 pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">জনপ্রিয় লেখা</h2>
    <ol id="sbPopular" class="space-y-1"></ol>
  </section>

  <section class="relative overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground">
    <span class="floaty pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10"></span>
    <p class="relative text-xs font-semibold uppercase tracking-wider opacity-80">সুরক্ষা শপ</p>
    <p class="font-display relative mt-1 text-xl font-bold leading-snug">গোপন প্যাকেজিংয়ে, ক্যাশ অন ডেলিভারি</p>
    <a href="${SITE.shop}" class="relative mt-4 flex h-12 items-center justify-center gap-2 rounded-full bg-card font-bold text-primary transition hover:scale-[1.03] active:scale-95">পণ্য দেখুন ${icon('arrow', 'h-4 w-4')}</a>
    <a href="${waLink()}" target="_blank" rel="noopener" class="relative mt-2 flex h-11 items-center justify-center gap-2 rounded-full border border-white/40 text-sm font-semibold transition hover:bg-white/10">${icon('chat', 'h-4 w-4')} WhatsApp-এ অর্ডার</a>
  </section>

  <section class="rounded-3xl border border-border bg-card p-4">
    <h2 class="font-display text-lg font-bold">নতুন লেখার খবর পান</h2>
    <p class="mt-1 text-sm text-muted-foreground">ইমেইলে পাঠিয়ে দেব। কোনো স্প্যাম নয়।</p>
    <form id="sbNews" class="mt-3 space-y-2">
      <label for="sbEmail" class="sr-only">ইমেইল</label>
      <input id="sbEmail" type="email" required placeholder="আপনার ইমেইল" class="h-11 w-full rounded-full border border-border bg-background px-4 outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/30">
      <button type="submit" class="h-11 w-full rounded-full bg-primary font-semibold text-primary-foreground transition hover:opacity-90 active:scale-95">সাবস্ক্রাইব</button>
      <p id="sbNewsMsg" class="hidden text-sm font-medium text-primary" role="status"></p>
    </form>
  </section>
</aside>`;

  /**
   * সাইডবারের ক্যাটাগরি / ট্যাগ / জনপ্রিয় তালিকা আঁকে।
   * state: { cat, tags: Set } — লিংকগুলো আসল URL, আর্কাইভ পেজ ক্লিক ধরে ইন-পেজ ফিল্টার করে।
   */
  const fillSidebar = (state = {}) => {
    const cat = state.cat || 'all';
    const tags = state.tags || new Set();
    const count = (id) => POSTS.filter((p) => id === 'all' || p.cat === id).length;
    const row = (id, name, ic) =>
      `<a href="${archiveUrl({ cat: id })}" data-cat="${id}" class="cat-row" ${cat === id ? 'aria-current="true"' : ''}>
        <span class="flex items-center gap-2.5">${icon(ic, 'h-4 w-4 opacity-80')}${name}</span><small>${bn(count(id))}</small></a>`;
    document.getElementById('sbCats').innerHTML = row('all', 'সব লেখা', 'menu') + CATS.map((c) => row(c.id, c.name, c.icon)).join('');
    document.getElementById('sbTags').innerHTML = TAGS.map((t) => {
      const n = POSTS.filter((p) => p.tags.includes(t.id)).length;
      return `<a href="${archiveUrl({ tag: t.id })}" data-tag="${t.id}" class="tag-pill" aria-pressed="${tags.has(t.id)}">#${t.name}<span class="text-xs opacity-60">${bn(n)}</span></a>`;
    }).join('');
    const pop = [...POSTS].sort((a, b) => b.pop - a.pop).slice(0, 4);
    document.getElementById('sbPopular').innerHTML = pop.map((p, i) =>
      `<li><a href="${postUrl(p)}" class="group flex gap-3 rounded-2xl p-2 transition hover:bg-accent/50">
        <span class="font-display grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-extrabold text-primary">${bn(i + 1)}</span>
        <span class="line-clamp-2 text-[0.92rem] font-medium leading-snug group-hover:text-primary">${p.title}</span></a></li>`).join('');
  };

  /* ───────── ইনিট (থিম, ড্রয়ার, স্টিকি সিটিএ, নিউজলেটার) ───────── */
  const initTheme = () => {
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      const dark = document.documentElement.classList.toggle('dark');
      try { localStorage.theme = dark ? 'dark' : 'light'; } catch (e) { /* ব্লক হলে সমস্যা নেই */ }
    });
  };

  const initDrawer = () => {
    const sb = document.getElementById('sidebar'), ov = document.getElementById('sbOverlay');
    if (!sb) return { open() {}, close() {} };
    const set = (open) => {
      sb.classList.toggle('is-open', open);
      sb.classList.toggle('invisible', !open);
      sb.classList.toggle('-translate-x-full', !open);
      ov.classList.toggle('opacity-0', !open);
      ov.classList.toggle('pointer-events-none', !open);
      document.body.classList.toggle('locked', open && matchMedia('(max-width:1023px)').matches);
      document.querySelectorAll('[data-open-sidebar]').forEach((b) => b.setAttribute('aria-expanded', open));
    };
    document.querySelectorAll('[data-open-sidebar]').forEach((b) => b.addEventListener('click', () => set(true)));
    document.getElementById('sbClose')?.addEventListener('click', () => set(false));
    ov.addEventListener('click', () => set(false));
    addEventListener('keydown', (e) => e.key === 'Escape' && set(false));
    // ডেস্কটপে গেলে ড্রয়ারের অবস্থা পরিষ্কার
    matchMedia('(min-width:1024px)').addEventListener('change', (e) => { if (e.matches) { sb.classList.remove('invisible', '-translate-x-full'); sb.style.visibility = ''; ov.classList.add('opacity-0', 'pointer-events-none'); document.body.classList.remove('locked'); } else set(false); });
    return { open: () => set(true), close: () => set(false) };
  };

  const initFloaters = () => {
    const bar = document.getElementById('stickyCta'), top = document.getElementById('toTop');
    let dismissed = false;
    try { dismissed = sessionStorage.getItem('sb-cta-x') === '1'; } catch (e) { /* ignore */ }
    document.getElementById('stickyClose')?.addEventListener('click', () => {
      dismissed = true; bar.classList.add('translate-y-full');
      try { sessionStorage.setItem('sb-cta-x', '1'); } catch (e) { /* ignore */ }
    });
    top?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
    const onScroll = () => {
      const y = scrollY;
      if (bar) bar.classList.toggle('translate-y-full', dismissed || y < 400);
      if (top) { top.classList.toggle('hidden', y < 900); top.classList.toggle('grid', y >= 900); }
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  };

  const initNewsletter = () => {
    const f = document.getElementById('sbNews'); if (!f) return;
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = f.querySelector('input').value.trim(), msg = document.getElementById('sbNewsMsg');
      msg.classList.remove('hidden');
      try {
        if (SITE.newsletterEndpoint) {
          const r = await fetch(SITE.newsletterEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
          if (!r.ok) throw new Error('bad');
        }
        msg.textContent = 'ধন্যবাদ! নতুন লেখা এলে জানিয়ে দেব।';
        f.reset();
      } catch (err) { msg.textContent = 'এখন সাবস্ক্রাইব করা গেল না, একটু পরে আবার চেষ্টা করুন।'; }
    });
  };

  /** পেজের কাঠামো বসায় */
  const mountChrome = () => {
    document.getElementById('siteHeader').innerHTML = header();
    document.getElementById('siteFooter').innerHTML = footer();
    const slot = document.getElementById('sidebarSlot');
    if (slot) slot.outerHTML = sidebarShell();
    initTheme(); initFloaters();
  };

  return { SITE, CATS, TAGS, POSTS, bn, fmtDate, esc, catOf, tagOf, postUrl, archiveUrl, waLink, icon, cover, card, cta, mountChrome, fillSidebar, initDrawer, initNewsletter };
})();
