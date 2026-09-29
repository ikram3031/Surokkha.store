import React, { useEffect } from 'react';
import { clientConfig } from '@/clientConfig';
import { resolveImageUrl } from '@/lib/api-client';

// Updates the browser favicon link tag with resolved API base URL and cache busting version
const updateFavicon = (version = '') => {
  if (typeof document === 'undefined') return;
  const rawFavicon = clientConfig?.siteIconUrl || clientConfig?.logoUrl || '/uploads/assets/logo.webp';
  const cleanFavicon = (!rawFavicon || rawFavicon.includes('demo_logo')) ? '/uploads/assets/logo.webp' : rawFavicon;
  const resolved = resolveImageUrl(cleanFavicon);
  if (!resolved) return;
  const finalUrl = version ? `${resolved}${resolved.includes('?') ? '&' : '?'}v=${version}` : resolved;
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = finalUrl;
};

// Injects tenant theme variables, browser title, and dynamic favicon matching active client
export const ClientThemeProvider = ({ children }) => {
  useEffect(() => {
    const handleLogoUpdated = (e) => {
      const version = e?.detail?.timestamp || Date.now();
      updateFavicon(version);
    };

    window.addEventListener('brand-logo-updated', handleLogoUpdated);
    return () => {
      window.removeEventListener('brand-logo-updated', handleLogoUpdated);
    };
  }, []);

  useEffect(() => {
    // Applies dynamic brand title, favicon link, and CSS theme variables
    const applyTheme = () => {
      if (typeof document !== 'undefined') {
        const brandName = clientConfig?.brandName || 'Decantre';
        document.title = `Dashboard - ${brandName}`;

        const savedVersion = typeof window !== 'undefined' ? localStorage.getItem('brand_logo_version') || '' : '';
        updateFavicon(savedVersion);
      }

      const themeConfig = clientConfig.theme || {};
      let cssText = ':root {\n';
      if (themeConfig.light) {
        Object.entries(themeConfig.light).forEach(([property, value]) => {
          cssText += `  ${property}: ${value} !important;\n`;
        });
      }
      cssText += '}\n\n.dark {\n';
      if (themeConfig.dark) {
        Object.entries(themeConfig.dark).forEach(([property, value]) => {
          cssText += `  ${property}: ${value} !important;\n`;
        });
      }
      cssText += '}\n';

      let styleTag = document.getElementById('client-theme-styles');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'client-theme-styles';
        document.head.appendChild(styleTag);
      }
      styleTag.innerHTML = cssText;
    };

    applyTheme();
  }, []);

  return <>{children}</>;
};

export default ClientThemeProvider;
