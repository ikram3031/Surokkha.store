// Helper to create clean inline SVG sample product images as Data URLs using arrow function
const createSampleProductSvg = (name, iconType, primaryColor, secondaryColor, detailText) => {
  let shapeSvg = '';

  if (iconType === 'sneaker') {
    shapeSvg = `
      <g transform="translate(100, 140)">
        <path d="M 40 180 Q 80 120 180 110 Q 240 100 270 140 Q 300 170 340 180 L 360 210 Q 330 230 180 230 Q 60 230 40 210 Z" fill="${primaryColor}" filter="drop-shadow(0 15px 25px rgba(0,0,0,0.25))" />
        <path d="M 60 210 L 350 210 Q 340 235 290 235 L 80 235 Q 50 235 60 210 Z" fill="#ffffff" />
        <path d="M 120 140 Q 180 140 210 180" stroke="${secondaryColor}" stroke-width="12" stroke-linecap="round" fill="none" />
        <circle cx="280" cy="165" r="10" fill="${secondaryColor}" />
        <path d="M 160 115 L 185 95 M 190 120 L 215 100 M 220 125 L 245 105" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
      </g>
    `;
  } else if (iconType === 'perfume') {
    shapeSvg = `
      <g transform="translate(140, 80)">
        <rect x="75" y="40" width="70" height="40" rx="6" fill="${secondaryColor}" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.3))" />
        <rect x="95" y="80" width="30" height="15" fill="#e5e5e5" />
        <rect x="25" y="95" width="170" height="230" rx="28" fill="${primaryColor}" fill-opacity="0.88" filter="drop-shadow(0 20px 30px rgba(0,0,0,0.25))" />
        <rect x="40" y="110" width="140" height="200" rx="18" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.4" />
        <rect x="55" y="170" width="110" height="80" rx="8" fill="#ffffff" />
        <text x="110" y="205" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle" fill="#111827">EAU DE PARFUM</text>
        <text x="110" y="225" font-family="system-ui, sans-serif" font-size="10" letter-spacing="2" text-anchor="middle" fill="#6b7280">PARIS - 100 ML</text>
        <path d="M 45 130 Q 110 140 175 130" stroke="#ffffff" stroke-width="4" stroke-opacity="0.5" fill="none" />
      </g>
    `;
  } else if (iconType === 'watch') {
    shapeSvg = `
      <g transform="translate(130, 70)">
        <rect x="90" y="20" width="80" height="380" rx="16" fill="${secondaryColor}" filter="drop-shadow(0 10px 20px rgba(0,0,0,0.3))" />
        <circle cx="130" cy="210" r="105" fill="#1f2937" stroke="${primaryColor}" stroke-width="12" filter="drop-shadow(0 15px 25px rgba(0,0,0,0.4))" />
        <circle cx="130" cy="210" r="92" fill="#0f172a" />
        <circle cx="130" cy="210" r="4" fill="#ffffff" />
        <line x1="130" y1="210" x2="130" y2="150" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
        <line x1="130" y1="210" x2="180" y2="210" stroke="${primaryColor}" stroke-width="3" stroke-linecap="round" />
        <line x1="130" y1="125" x2="130" y2="135" stroke="#94a3b8" stroke-width="3" />
        <line x1="130" y1="285" x2="130" y2="295" stroke="#94a3b8" stroke-width="3" />
        <line x1="45" y1="210" x2="55" y2="210" stroke="#94a3b8" stroke-width="3" />
        <line x1="205" y1="210" x2="215" y2="210" stroke="#94a3b8" stroke-width="3" />
      </g>
    `;
  } else if (iconType === 'headphones') {
    shapeSvg = `
      <g transform="translate(110, 80)">
        <path d="M 60 220 C 60 80 220 80 220 220" stroke="${primaryColor}" stroke-width="28" stroke-linecap="round" fill="none" filter="drop-shadow(0 10px 20px rgba(0,0,0,0.3))" />
        <rect x="40" y="190" width="45" height="90" rx="20" fill="${secondaryColor}" />
        <rect x="195" y="190" width="45" height="90" rx="20" fill="${secondaryColor}" />
        <rect x="35" y="200" width="18" height="70" rx="9" fill="#374151" />
        <rect x="227" y="200" width="18" height="70" rx="9" fill="#374151" />
      </g>
    `;
  } else if (iconType === 'skincare') {
    shapeSvg = `
      <g transform="translate(150, 70)">
        <rect x="55" y="120" width="130" height="230" rx="65" fill="${primaryColor}" fill-opacity="0.9" filter="drop-shadow(0 15px 25px rgba(0,0,0,0.2))" />
        <rect x="95" y="40" width="50" height="75" rx="10" fill="${secondaryColor}" />
        <rect x="105" y="20" width="30" height="20" rx="4" fill="#d1d5db" />
        <circle cx="120" cy="220" r="35" fill="#ffffff" fill-opacity="0.3" />
        <text x="120" y="225" font-family="system-ui, sans-serif" font-size="12" font-weight="600" text-anchor="middle" fill="#ffffff">SERUM</text>
      </g>
    `;
  } else {
    shapeSvg = `
      <g transform="translate(130, 90)">
        <rect x="40" y="40" width="200" height="240" rx="24" fill="${primaryColor}" filter="drop-shadow(0 15px 25px rgba(0,0,0,0.25))" />
        <rect x="70" y="80" width="140" height="160" rx="12" fill="#ffffff" fill-opacity="0.2" />
        <circle cx="140" cy="160" r="40" fill="${secondaryColor}" />
      </g>
    `;
  }

  const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="1000" height="1000">
    <defs>
      <linearGradient id="bgGrad-${iconType}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc" />
        <stop offset="100%" stop-color="#e2e8f0" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bgGrad-${iconType})" />
    ${shapeSvg}
    <text x="250" y="450" font-family="system-ui, sans-serif" font-size="18" font-weight="600" text-anchor="middle" fill="#64748b">${detailText}</text>
  </svg>`;

  const base64 = typeof window !== 'undefined' && window.btoa
    ? window.btoa(unescape(encodeURIComponent(rawSvg)))
    : Buffer.from(rawSvg).toString('base64');

  return 'data:image/svg+xml;base64,' + base64;
};

export const SAMPLE_PRODUCTS = [
  {
    name: 'AeroGlide Pro Runner',
    category: 'Footwear',
    dataUrl: createSampleProductSvg('AeroGlide Pro Runner', 'sneaker', '#ef4444', '#111827', 'PERFORMANCE FOOTWEAR'),
    dimensions: { width: 1000, height: 1000 },
    defaultPrompt: 'Planted on a sleek dark asphalt track with low golden hour sunlight, motion blur background, cinematic commercial footwear advertising.',
  },
  {
    name: 'Velvet Rose Eau De Parfum',
    category: 'Perfume & Cosmetics',
    dataUrl: createSampleProductSvg('Velvet Rose', 'perfume', '#f43f5e', '#fbbf24', 'LUXURY FRAGRANCE 100ML'),
    dimensions: { width: 1000, height: 1000 },
    defaultPrompt: 'Resting on a polished pink onyx pedestal with delicate rose petals scattered around, soft diffused morning sunlight, luxury cosmetic photography.',
  },
  {
    name: 'Chronos Stealth Automatic Watch',
    category: 'Jewelry & Watches',
    dataUrl: createSampleProductSvg('Chronos Stealth', 'watch', '#0284c7', '#334155', 'MATTE TITANIUM CHRONOGRAPH'),
    dimensions: { width: 1000, height: 1000 },
    defaultPrompt: 'Positioned on a dark obsidian stone slab with subtle golden dust and ambient metallic reflections, moody dramatic rim lighting.',
  },
  {
    name: 'SonicPulse Noise-Canceling Headphones',
    category: 'Electronics',
    dataUrl: createSampleProductSvg('SonicPulse ANC', 'headphones', '#8b5cf6', '#1e1b4b', 'WIRELESS OVER-EAR AUDIO'),
    dimensions: { width: 1000, height: 1000 },
    defaultPrompt: 'Centered in a modern futuristic tech studio with cyan and magenta neon rim lighting, glossy wet reflective dark acrylic floor.',
  },
  {
    name: 'Lumiere Botanical Glow Serum',
    category: 'Skincare',
    dataUrl: createSampleProductSvg('Lumiere Serum', 'skincare', '#10b981', '#064e3b', 'ORGANIC HYDATION DROPS'),
    dimensions: { width: 1000, height: 1000 },
    defaultPrompt: 'Resting on smooth light sandstone with natural dappled leaf shadows, warm golden sunlight streaming from the top left, soft blurred eucalyptus foliage.',
  },
];
