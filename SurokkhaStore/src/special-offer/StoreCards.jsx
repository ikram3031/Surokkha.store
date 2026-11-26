import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import storeCss from '@/index.css?inline';
import cardsCss from './storeCards.css?inline';
import { CartProvider } from '@/context/CartContext';
import { ProductCard } from '@/components/shop/ProductCard';

// The store theme targets :root, html and body; inside the shadow root those become the host
const SHADOW_CSS = storeCss.replace(/:root\b/g, ':host').replace(/(^|[\s,}])(html|body)(?=[\s,{])/g, '$1:host') + cardsCss;

// The store card navigates inside the main app; on this standalone page that needs a full page load
const followStoreLink = () => {
  setTimeout(() => { if (window.location.pathname !== '/special-offer') window.location.reload(); }, 0);
};

// Renders the store's own ProductCard with the store CSS kept inside a shadow root, so it cannot restyle the landing page
const StoreCards = ({ products }) => {
  const hostRef = useRef(null);
  const [root, setRoot] = useState(null);
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });
    if (!shadow.querySelector('style')) {
      const style = document.createElement('style');
      style.textContent = SHADOW_CSS;
      shadow.appendChild(style);
    }
    let mount = shadow.querySelector('div');
    if (!mount) {
      mount = document.createElement('div');
      shadow.appendChild(mount);
    }
    setRoot(mount);
  }, []);
  return (
    <div ref={hostRef}>
      {root && createPortal(
        <CartProvider>
          <div className="mo30-grid" onClickCapture={followStoreLink}>
            {products.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </CartProvider>,
        root,
      )}
    </div>
  );
};

export default StoreCards;
