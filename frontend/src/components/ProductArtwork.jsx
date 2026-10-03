import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { PRODUCTS as DEFAULT_PRODUCTS } from '../data/products';
import { Skeleton } from './ui/skeleton';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'https://api.surokkha.store';

export default function ProductArtwork({
  productKey,
  customImageUrl = null,
  sizeClass = "w-full aspect-square",
  imgClassName = "w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105 rounded-2xl"
}) {
  const storeProducts = useStore((state) => state.products);
  const p = (typeof productKey === 'object' && productKey !== null)
    ? productKey
    : (storeProducts[productKey] ||
      (typeof productKey === 'string' && storeProducts[productKey.replace(/-condom$/, '')]) ||
      (typeof productKey === 'string' && storeProducts[`${productKey}-condom`]) ||
      DEFAULT_PRODUCTS[productKey] ||
      DEFAULT_PRODUCTS['mo-dotted']);

  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  let rawImg = customImageUrl || p?.imageUrl || p?.image || p?.thumbnailUrl || (Array.isArray(p?.images) && p.images[0]) || p?.photo || p?.picture || p?.featured_image || null;
  let resolvedImgUrl = null;

  if (rawImg && typeof rawImg === 'string' && rawImg.trim() !== '') {
    const trimmed = rawImg.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
      resolvedImgUrl = trimmed;
    } else {
      resolvedImgUrl = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    }
  }

  React.useEffect(() => {
    setImgError(false);
    setImgLoaded(false);
  }, [rawImg, customImageUrl, productKey]);

  if (resolvedImgUrl && !imgError) {
    return (
      <div className={`${sizeClass} relative flex items-center justify-center overflow-hidden rounded-2xl bg-slate-50`}>
        {!imgLoaded && (
          <Skeleton className="absolute inset-0 w-full h-full rounded-2xl" />
        )}
        <img
          src={resolvedImgUrl}
          alt={p?.name || 'Product Packaging'}
          className={`${imgClassName || "w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105 rounded-2xl"} ${imgLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            setImgError(true);
            setImgLoaded(true);
          }}
          loading="lazy"
        />
      </div>
    );
  }

  // Meta Compliant Sealed Box Artwork
  let boxGradient = null;
  let patternSvg = null;
  let accentBadge = '';
  let variantLabel = '';
  let foilColor = '#FDA4AF';
  let badgeBg = '#9F1239';

  if (p?.iconType === 'dotted' || productKey === 'mo-dotted' || productKey === 'mo-dotted-condom') {
    boxGradient = (
      <linearGradient id={`boxGrad-${productKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9F1239" />
        <stop offset="50%" stopColor="#881337" />
        <stop offset="100%" stopColor="#4C0519" />
      </linearGradient>
    );
    foilColor = '#FECDD3';
    badgeBg = '#4C0519';
    variantLabel = 'TEXTURED MATRIX';
    accentBadge = '  CERTIFIED BARRIER';
    patternSvg = (
      <g fill="#FFE4E6" opacity="0.6">
        <circle cx="95" cy="150" r="3.5" /> <circle cx="120" cy="150" r="3.5" /> <circle cx="150" cy="150" r="4" fill="#FFF" /> <circle cx="180" cy="150" r="3.5" /> <circle cx="205" cy="150" r="3.5" />
        <circle cx="105" cy="175" r="4" fill="#FFF" /> <circle cx="135" cy="175" r="4.5" fill="#F43F5E" /> <circle cx="165" cy="175" r="4.5" fill="#F43F5E" /> <circle cx="195" cy="175" r="4" fill="#FFF" />
        <circle cx="95" cy="200" r="4" /> <circle cx="120" cy="200" r="5" fill="#FB7185" /> <circle cx="150" cy="200" r="5.5" fill="#FFF" /> <circle cx="180" cy="200" r="5" fill="#FB7185" /> <circle cx="205" cy="200" r="4" />
        <circle cx="105" cy="225" r="4" fill="#FFF" /> <circle cx="135" cy="225" r="4.5" fill="#F43F5E" /> <circle cx="165" cy="225" r="4.5" fill="#F43F5E" /> <circle cx="195" cy="225" r="4" fill="#FFF" />
        <circle cx="95" cy="250" r="3.5" /> <circle cx="120" cy="250" r="3.5" /> <circle cx="150" cy="250" r="4" fill="#FFF" /> <circle cx="180" cy="250" r="3.5" /> <circle cx="205" cy="250" r="3.5" />
      </g>
    );
  } else if (p?.iconType === 'thin' || productKey === 'mo-ultra-thin' || productKey === 'mo-ultra-thin-condom') {
    boxGradient = (
      <linearGradient id={`boxGrad-${productKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1E3A8A" />
        <stop offset="50%" stopColor="#1E40AF" />
        <stop offset="100%" stopColor="#172554" />
      </linearGradient>
    );
    foilColor = '#93C5FD';
    badgeBg = '#172554';
    variantLabel = 'ULTRA THIN (0.045mm)';
    accentBadge = 'MEDICAL GRADE NATURAL LATEX';
    patternSvg = (
      <g stroke="#93C5FD" strokeWidth="2.5" fill="none" opacity="0.8">
        <path d="M60 170 C 110 140, 180 190, 240 160" strokeLinecap="round" />
        <path d="M50 195 C 100 165, 190 215, 250 185" strokeWidth="3.5" stroke="#FFFFFF" strokeLinecap="round" />
        <path d="M60 220 C 110 190, 180 240, 240 210" strokeLinecap="round" opacity="0.6" />
        <path d="M70 245 C 120 215, 190 265, 230 235" strokeLinecap="round" opacity="0.4" />
      </g>
    );
  } else if (p?.iconType === 'combo' || productKey.startsWith('combo') || productKey.includes('20pcs')) {
    boxGradient = (
      <linearGradient id={`boxGrad-${productKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#18181B" />
        <stop offset="50%" stopColor="#27272A" />
        <stop offset="100%" stopColor="#09090B" />
      </linearGradient>
    );
    foilColor = '#FDE047';
    badgeBg = '#3F3F46';
    variantLabel = 'FAMILY PLANNING (20 PCS)';
    accentBadge = 'CERTIFIED 2-PACK VALUE BUNDLE';
    patternSvg = (
      <g opacity="0.95">
        <rect x="65" y="145" width="75" height="105" rx="8" fill="#1E3A8A" stroke="#93C5FD" strokeWidth="2" />
        <text x="102" y="185" fill="#FFF" fontSize="12" fontWeight="800" textAnchor="middle">10 PCS</text>
        <text x="102" y="202" fill="#93C5FD" fontSize="10" fontWeight="600" textAnchor="middle">THIN</text>

        <rect x="160" y="145" width="75" height="105" rx="8" fill="#881337" stroke="#FECDD3" strokeWidth="2" />
        <text x="197" y="185" fill="#FFF" fontSize="12" fontWeight="800" textAnchor="middle">10 PCS</text>
        <text x="197" y="202" fill="#FECDD3" fontSize="10" fontWeight="600" textAnchor="middle">BARRIER</text>

        <rect x="95" y="260" width="110" height="20" rx="10" fill="#EAB308" />
        <text x="150" y="274" fill="#09090B" fontSize="10" fontWeight="900" textAnchor="middle" letterSpacing="0.5">20 UNITS TOTAL</text>
      </g>
    );
  } else {
    boxGradient = (
      <linearGradient id={`boxGrad-${productKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="50%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
    );
    foilColor = '#E2E8F0';
    badgeBg = '#0F172A';
    variantLabel = 'CONTOURED RIDGES';
    accentBadge = '52mm ERGONOMIC BARRIER';
    patternSvg = (
      <g stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" opacity="0.8">
        <line x1="75" y1="160" x2="225" y2="160" stroke="#94A3B8" />
        <line x1="60" y1="185" x2="240" y2="185" stroke="#FFFFFF" strokeWidth="3.5" />
        <line x1="45" y1="210" x2="255" y2="210" stroke="#F43F5E" strokeWidth="4" />
        <line x1="60" y1="235" x2="240" y2="235" stroke="#FFFFFF" strokeWidth="3.5" />
        <line x1="75" y1="260" x2="225" y2="260" stroke="#94A3B8" />
      </g>
    );
  }

  return (
    <div className={`${sizeClass} flex items-center justify-center p-2 select-none`}>
      <svg viewBox="0 0 300 375" className="w-full h-full max-h-full drop-shadow-xl transition-transform duration-300 group-hover:scale-105" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {boxGradient}
          <filter id={`shadow-${productKey}`} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Sealed 3D Retail Box Shell */}
        <rect x="25" y="20" width="250" height="335" rx="20" fill={`url(#boxGrad-${productKey})`} filter={`url(#shadow-${productKey})`} />

        {/* Clean Satin Sheen */}
        <path d="M25 45 Q150 20 275 45 L275 100 Q150 80 25 100 Z" fill="#FFFFFF" opacity="0.06" />

        {/* Precision Border */}
        <rect x="35" y="30" width="230" height="315" rx="16" fill="none" stroke={foilColor} strokeWidth="1.2" opacity="0.4" />

        {/* Brand Name "MO" */}
        <text x="56" y="82" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="900" fontSize="38" fill="#FFFFFF" letterSpacing="1.5">MO</text>

        {/* Strict 18+ Age Gating Stamp on Packaging */}
        <circle cx="155" cy="68" r="13" fill="#000000" fillOpacity="0.5" stroke={foilColor} strokeWidth="1.2" />
        <text x="155" y="73" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="900" fill="#FFFFFF" textAnchor="middle">18+</text>

        {/*   Medical Device Compliance Pill */}
        <rect x="178" y="56" width="76" height="24" rx="12" fill={badgeBg} fillOpacity="0.85" stroke={foilColor} strokeWidth="1" />
        <text x="216" y="72" fontFamily="Inter, sans-serif" fontSize="8.5" fontWeight="800" fill={foilColor} textAnchor="middle" letterSpacing="0.5"> </text>

        {/* Regulated Medical Classification Text */}
        <text x="56" y="106" fontFamily="Inter, sans-serif" fontSize="9" fontWeight="700" fill="#FFFFFF" opacity="0.85" letterSpacing="0.8">LATEX CONTRACEPTIVE BARRIER</text>

        {/* Geometric Technical Texture */}
        {patternSvg}

        {/* Variant Title */}
        <text x="150" y="305" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" fontSize="14" fill="#FFFFFF" textAnchor="middle" letterSpacing="0.8">{variantLabel}</text>

        {/* Specification Subtitle */}
        <rect x="65" y="316" width="170" height="18" rx="5" fill="#000000" fillOpacity="0.45" />
        <text x="150" y="329" fontFamily="Inter, sans-serif" fontSize="8.5" fontWeight="700" fill={foilColor} textAnchor="middle" letterSpacing="0.6">{accentBadge}</text>
      </svg>
    </div>
  );
}
