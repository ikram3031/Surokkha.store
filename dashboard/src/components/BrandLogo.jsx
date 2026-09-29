import React, { useState, useEffect } from 'react';
import { clientConfig } from '@/clientConfig';
import { apiClient, resolveImageUrl } from '@/lib/api-client';
import surokkhaLogo from '@/assets/surokkha_logo.png';
import decantreLogo from '@/assets/decantre_logo.png';
import engulficLogo from '@/assets/engulfic_logo.webp';

const staticClientLogos = {
  surokkha: surokkhaLogo,
  decantre: decantreLogo,
  engulfic: engulficLogo,
};

// Renders the tenant branding logo with fixed proportional width and dynamic height
export const BrandLogo = ({
  src,
  className = 'w-[115px] h-auto',
  imgClassName = '',
  alt = 'Brand logo',
  iconOnly = false,
  centered = false,
}) => {
  const { clientKey = 'decantre', brandName = 'Decantre', logoUrl } = clientConfig || {};

  const [logoVersion, setLogoVersion] = useState(() => {
    try {
      return localStorage.getItem('brand_logo_version') || '';
    } catch {
      return '';
    }
  });

  const bundledLogo = staticClientLogos[clientKey?.toLowerCase()] || null;
  const defaultLogo = '/uploads/assets/logo.webp';
  const rawUrl = src || (logoUrl && !logoUrl.includes('demo_logo') ? logoUrl : (bundledLogo || defaultLogo)) || defaultLogo;

  // Resolves image paths and appends version query string for real-time asset invalidation
  const resolveLogoUrl = (url, version) => {
    if (!url) return null;
    if (typeof url === 'string' && (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/src/assets/'))) {
      return url;
    }
    let finalUrl = resolveImageUrl(url);
    if (version && !finalUrl.startsWith('data:') && !finalUrl.startsWith('blob:')) {
      finalUrl += `${finalUrl.includes('?') ? '&' : '?'}v=${version}`;
    }
    return finalUrl;
  };

  const primaryUrl = resolveLogoUrl(rawUrl, logoVersion);
  const [currentSrc, setCurrentSrc] = useState(primaryUrl || bundledLogo);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const handleLogoUpdated = (e) => {
      const newVersion = e?.detail?.timestamp || Date.now();
      setLogoVersion(newVersion);
      try {
        localStorage.setItem('brand_logo_version', String(newVersion));
      } catch {}
    };

    window.addEventListener('brand-logo-updated', handleLogoUpdated);
    return () => {
      window.removeEventListener('brand-logo-updated', handleLogoUpdated);
    };
  }, []);

  useEffect(() => {
    setCurrentSrc(primaryUrl || bundledLogo);
    setImageError(false);
  }, [primaryUrl, bundledLogo]);

  // Handles image load failures and falls back to bundled static logo
  const handleImageError = () => {
    if (bundledLogo && currentSrc !== bundledLogo) {
      setCurrentSrc(bundledLogo);
    } else {
      setImageError(true);
    }
  };

  const isCentered = centered || className.includes('mx-auto') || className.includes('justify-center');

  if (currentSrc && !imageError) {
    return (
      <div className={`relative flex items-center shrink-0 ${isCentered ? 'justify-center' : 'justify-start'} ${className}`}>
        <img
          src={currentSrc}
          alt={alt || brandName}
          className={`w-full h-full object-contain ${isCentered ? 'object-center mx-auto' : 'object-left'} ${imgClassName}`}
          onError={handleImageError}
        />
      </div>
    );
  }

  if (iconOnly) {
    return (
      <div className={`flex items-center justify-center font-bold text-primary shrink-0 ${className}`}>
        <span className="bg-primary/20 px-2 py-0.5 rounded border border-primary/30 uppercase text-xs font-black">
          {clientKey ? clientKey.slice(0, 2) : 'WL'}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 font-bold tracking-wider text-xl text-primary shrink-0 ${className}`}>
      <span className="bg-primary/20 px-2 py-0.5 rounded border border-primary/30 uppercase text-xs font-black">
        {clientKey ? clientKey.slice(0, 2) : 'WL'}
      </span>
      <span className="truncate">{brandName}</span>
    </div>
  );
};

export default BrandLogo;
