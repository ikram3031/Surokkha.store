import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { PRODUCTS as DEFAULT_PRODUCTS } from '../data/products';
import { Skeleton } from './ui/skeleton';
import { SITE_CONFIG } from '../config/siteConfig';

const API_BASE_URL = SITE_CONFIG.apiBaseUrl;

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
      (typeof productKey === 'string' && Object.values(storeProducts).find(item => item?.id === productKey || item?.slug === productKey || item?.did === productKey || item?._id === productKey)) ||
      DEFAULT_PRODUCTS[productKey] ||
      DEFAULT_PRODUCTS['mo-dotted']);

  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  let rawImg =
    customImageUrl ||
    p?.featuredImage ||
    p?.featured_image ||
    p?.imageUrl ||
    p?.image_url ||
    p?.image ||
    p?.thumbnailUrl ||
    p?.thumbnail_url ||
    (Array.isArray(p?.images) && p.images.length > 0 ? p.images[0] : null) ||
    p?.photo ||
    p?.picture ||
    null;

  let resolvedImgUrl = null;

  if (rawImg && typeof rawImg === 'string') {
    const trimmed = rawImg.trim();
    if (trimmed !== '' && trimmed !== '#' && trimmed !== '/#' && trimmed.toLowerCase() !== 'null' && trimmed.toLowerCase() !== 'undefined') {
      const cleanBase = (API_BASE_URL || '').replace(/\/$/, '');
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        try {
          const urlObj = new URL(trimmed);
          if ((urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') && urlObj.pathname.startsWith('/uploads')) {
            resolvedImgUrl = cleanBase ? `${cleanBase}${urlObj.pathname}${urlObj.search}` : trimmed;
          } else {
            resolvedImgUrl = trimmed;
          }
        } catch (_) {
          resolvedImgUrl = trimmed;
        }
      } else if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
        resolvedImgUrl = trimmed;
      } else {
        const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
        resolvedImgUrl = cleanBase ? `${cleanBase}${cleanPath}` : cleanPath;
      }
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
  const brandName = (p?.brand || (p?.name ? p.name.split(' ')[0] : 'MO')).toUpperCase();
  const slugKey = String(p?.slug || productKey || '').toLowerCase();
  const prodName = String(p?.name || '').toLowerCase();
  const isLubricant = prodName.includes('jelly') || prodName.includes('gel') || prodName.includes('lubricant') || slugKey.includes('jelly') || slugKey.includes('lubricant') || p?.iconType === 'lubricant';
  const isDelay = prodName.includes('long love') || prodName.includes('delay') || slugKey.includes('long-love');
  const isGold = prodName.includes('gold') || slugKey.includes('gold');
  const isBlack = prodName.includes('black') || slugKey.includes('black');
  const isDotted = p?.iconType === 'dotted' || slugKey.includes('dotted') || prodName.includes('dotted') || prodName.includes('textured');
  const isThin = p?.iconType === 'thin' || slugKey.includes('thin') || prodName.includes('thin');
  const isCombo = p?.iconType === 'combo' || slugKey.includes('combo') || slugKey.includes('20pcs') || slugKey.includes('30pcs') || prodName.includes('combo');

  let boxGradient = null;
  let patternSvg = null;
  let accentBadge = 'MEDICAL GRADE BARRIER';
  let variantLabel = 'PREMIUM PROTECTION';
  let foilColor = '#FDA4AF';
  let badgeBg = '#9F1239';
  let classLabel = 'LATEX CONTRACEPTIVE BARRIER';

  if (isLubricant) {
    classLabel = 'PERSONAL LUBRICANT GEL';
    variantLabel = prodName.includes('strawberry') ? 'STRAWBERRY FLAVOR (100ml)' : 'WATER BASED MOISTURE (50g)';
    accentBadge = 'PH BALANCED • DERMA TESTED';
    foilColor = prodName.includes('strawberry') ? '#FDA4AF' : '#7DD3FC';
    badgeBg = prodName.includes('strawberry') ? '#881337' : '#0369A1';
    boxGradient = (
      <linearGradient id={`boxGrad-${productKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={prodName.includes('strawberry') ? '#9F1239' : '#0369A1'} />
        <stop offset="50%" stopColor={prodName.includes('strawberry') ? '#881337' : '#0284C7'} />
        <stop offset="100%" stopColor={prodName.includes('strawberry') ? '#4C0519' : '#0C4A6E'} />
      </linearGradient>
    );
    patternSvg = (
      <g fill={foilColor} opacity="0.75">
        <circle cx="150" cy="170" r="28" fill="none" stroke={foilColor} strokeWidth="2.5" />
        <circle cx="150" cy="170" r="16" fill="none" stroke={foilColor} strokeWidth="1.5" />
        <circle cx="150" cy="170" r="5" fill="#FFFFFF" />
        <path d="M150 130 Q150 145 150 160" stroke={foilColor} strokeWidth="3" strokeLinecap="round" />
        <circle cx="100" cy="220" r="4" fill="#FFFFFF" />
        <circle cx="200" cy="220" r="4" fill="#FFFFFF" />
        <circle cx="150" cy="235" r="5" fill="#FFFFFF" />
      </g>
    );
  } else if (isGold) {
    classLabel = 'LATEX CONTRACEPTIVE BARRIER';
    variantLabel = 'EXOTIC METALLIC GOLD';
    accentBadge = 'VANILLA SCENTED BARRIER';
    foilColor = '#FDE68A';
    badgeBg = '#78350F';
    boxGradient = (
      <linearGradient id={`boxGrad-${productKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#B45309" />
        <stop offset="50%" stopColor="#92400E" />
        <stop offset="100%" stopColor="#451A03" />
      </linearGradient>
    );
    patternSvg = (
      <g stroke="#FDE68A" strokeWidth="2" fill="none" opacity="0.8">
        <polygon points="150,140 185,200 115,200" strokeWidth="2.5" />
        <polygon points="150,230 185,170 115,170" strokeWidth="2" />
        <circle cx="150" cy="185" r="8" fill="#FDE68A" />
      </g>
    );
  } else if (isBlack) {
    classLabel = 'LATEX CONTRACEPTIVE BARRIER';
    variantLabel = 'EXOTIC OBSIDIAN BLACK';
    accentBadge = 'PREMIUM SMOOTH BARRIER';
    foilColor = '#E2E8F0';
    badgeBg = '#27272A';
    boxGradient = (
      <linearGradient id={`boxGrad-${productKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#27272A" />
        <stop offset="50%" stopColor="#18181B" />
        <stop offset="100%" stopColor="#09090B" />
      </linearGradient>
    );
    patternSvg = (
      <g stroke="#CBD5E1" strokeWidth="2.5" fill="none" opacity="0.85">
        <rect x="90" y="150" width="120" height="75" rx="10" stroke="#94A3B8" strokeWidth="2" />
        <line x1="105" y1="187" x2="195" y2="187" stroke="#F8FAFC" strokeWidth="3" />
      </g>
    );
  } else if (isDelay) {
    classLabel = 'LATEX CONTRACEPTIVE BARRIER';
    variantLabel = 'LONG LOVE (4.5% BENZOCAINE)';
    accentBadge = 'EXTENDED CLIMAX CONTROL';
    foilColor = '#FEF08A';
    badgeBg = '#713F12';
    boxGradient = (
      <linearGradient id={`boxGrad-${productKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A16207" />
        <stop offset="50%" stopColor="#854D0E" />
        <stop offset="100%" stopColor="#422006" />
      </linearGradient>
    );
    patternSvg = (
      <g fill="#FEF08A" opacity="0.75">
        <circle cx="105" cy="165" r="4" /> <circle cx="135" cy="165" r="4" /> <circle cx="165" cy="165" r="4" /> <circle cx="195" cy="165" r="4" />
        <circle cx="120" cy="190" r="5" fill="#FFF" /> <circle cx="150" cy="190" r="6" fill="#FFF" /> <circle cx="180" cy="190" r="5" fill="#FFF" />
        <circle cx="105" cy="215" r="4" /> <circle cx="135" cy="215" r="4" /> <circle cx="165" cy="215" r="4" /> <circle cx="195" cy="215" r="4" />
      </g>
    );
  } else if (isDotted) {
    classLabel = 'LATEX CONTRACEPTIVE BARRIER';
    variantLabel = 'TEXTURED MATRIX';
    accentBadge = 'CERTIFIED SAFETY BARRIER';
    foilColor = '#FECDD3';
    badgeBg = '#4C0519';
    boxGradient = (
      <linearGradient id={`boxGrad-${productKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9F1239" />
        <stop offset="50%" stopColor="#881337" />
        <stop offset="100%" stopColor="#4C0519" />
      </linearGradient>
    );
    patternSvg = (
      <g fill="#FFE4E6" opacity="0.6">
        <circle cx="95" cy="150" r="3.5" /> <circle cx="120" cy="150" r="3.5" /> <circle cx="150" cy="150" r="4" fill="#FFF" /> <circle cx="180" cy="150" r="3.5" /> <circle cx="205" cy="150" r="3.5" />
        <circle cx="105" cy="175" r="4" fill="#FFF" /> <circle cx="135" cy="175" r="4.5" fill="#F43F5E" /> <circle cx="165" cy="175" r="4.5" fill="#F43F5E" /> <circle cx="195" cy="175" r="4" fill="#FFF" />
        <circle cx="95" cy="200" r="4" /> <circle cx="120" cy="200" r="5" fill="#FB7185" /> <circle cx="150" cy="200" r="5.5" fill="#FFF" /> <circle cx="180" cy="200" r="5" fill="#FB7185" /> <circle cx="205" cy="200" r="4" />
        <circle cx="105" cy="225" r="4" fill="#FFF" /> <circle cx="135" cy="225" r="4.5" fill="#F43F5E" /> <circle cx="165" cy="225" r="4.5" fill="#F43F5E" /> <circle cx="195" cy="225" r="4" fill="#FFF" />
        <circle cx="95" cy="250" r="3.5" /> <circle cx="120" cy="250" r="3.5" /> <circle cx="150" cy="250" r="4" fill="#FFF" /> <circle cx="180" cy="250" r="3.5" /> <circle cx="205" cy="250" r="3.5" />
      </g>
    );
  } else if (isThin) {
    classLabel = 'LATEX CONTRACEPTIVE BARRIER';
    variantLabel = 'ULTRA THIN (0.045mm)';
    accentBadge = 'NATURAL LATEX BARRIER';
    foilColor = '#93C5FD';
    badgeBg = '#172554';
    boxGradient = (
      <linearGradient id={`boxGrad-${productKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1E3A8A" />
        <stop offset="50%" stopColor="#1E40AF" />
        <stop offset="100%" stopColor="#172554" />
      </linearGradient>
    );
    patternSvg = (
      <g stroke="#93C5FD" strokeWidth="2.5" fill="none" opacity="0.8">
        <path d="M60 170 C 110 140, 180 190, 240 160" strokeLinecap="round" />
        <path d="M50 195 C 100 165, 190 215, 250 185" strokeWidth="3.5" stroke="#FFFFFF" strokeLinecap="round" />
        <path d="M60 220 C 110 190, 180 240, 240 210" strokeLinecap="round" opacity="0.6" />
        <path d="M70 245 C 120 215, 190 265, 230 235" strokeLinecap="round" opacity="0.4" />
      </g>
    );
  } else if (isCombo) {
    classLabel = 'CONTRACEPTIVE VALUE PACK';
    variantLabel = 'MULTI-PACK VALUE BUNDLE';
    accentBadge = 'CERTIFIED VALUE BUNDLE';
    foilColor = '#FDE047';
    badgeBg = '#3F3F46';
    boxGradient = (
      <linearGradient id={`boxGrad-${productKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#18181B" />
        <stop offset="50%" stopColor="#27272A" />
        <stop offset="100%" stopColor="#09090B" />
      </linearGradient>
    );
    patternSvg = (
      <g opacity="0.95">
        <rect x="65" y="145" width="75" height="105" rx="8" fill="#1E3A8A" stroke="#93C5FD" strokeWidth="2" />
        <text x="102" y="185" fill="#FFF" fontSize="12" fontWeight="800" textAnchor="middle">THIN</text>
        <rect x="160" y="145" width="75" height="105" rx="8" fill="#881337" stroke="#FECDD3" strokeWidth="2" />
        <text x="197" y="185" fill="#FFF" fontSize="12" fontWeight="800" textAnchor="middle">BARRIER</text>
        <rect x="95" y="260" width="110" height="20" rx="10" fill="#EAB308" />
        <text x="150" y="274" fill="#09090B" fontSize="10" fontWeight="900" textAnchor="middle" letterSpacing="0.5">SAVER PACK</text>
      </g>
    );
  } else {
    classLabel = 'LATEX CONTRACEPTIVE BARRIER';
    variantLabel = 'CONTOURED RIDGES';
    accentBadge = '52mm ERGONOMIC BARRIER';
    foilColor = '#E2E8F0';
    badgeBg = '#0F172A';
    boxGradient = (
      <linearGradient id={`boxGrad-${productKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="50%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
    );
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

        {/* Brand Name Dynamic */}
        <text x="56" y="82" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="900" fontSize={brandName.length > 6 ? "28" : "36"} fill="#FFFFFF" letterSpacing="1.5">{brandName}</text>

        {/* Strict 18+ Age Gating Stamp on Packaging */}
        <circle cx="155" cy="68" r="13" fill="#000000" fillOpacity="0.5" stroke={foilColor} strokeWidth="1.2" />
        <text x="155" y="73" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="900" fill="#FFFFFF" textAnchor="middle">18+</text>

        {/* Compliance Pill */}
        <rect x="178" y="56" width="76" height="24" rx="12" fill={badgeBg} fillOpacity="0.85" stroke={foilColor} strokeWidth="1" />
        <text x="216" y="72" fontFamily="Inter, sans-serif" fontSize="8.5" fontWeight="800" fill={foilColor} textAnchor="middle" letterSpacing="0.5">AUTHENTIC</text>

        {/* Regulated Classification Text */}
        <text x="56" y="106" fontFamily="Inter, sans-serif" fontSize="8.5" fontWeight="700" fill="#FFFFFF" opacity="0.85" letterSpacing="0.8">{classLabel}</text>

        {/* Geometric Technical Texture */}
        {patternSvg}

        {/* Variant Title */}
        <text x="150" y="305" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" fontSize="13" fill="#FFFFFF" textAnchor="middle" letterSpacing="0.6">{variantLabel}</text>

        {/* Specification Subtitle */}
        <rect x="50" y="316" width="200" height="18" rx="5" fill="#000000" fillOpacity="0.45" />
        <text x="150" y="329" fontFamily="Inter, sans-serif" fontSize="8" fontWeight="700" fill={foilColor} textAnchor="middle" letterSpacing="0.5">{accentBadge}</text>
      </svg>
    </div>
  );
}
