import React, { useEffect } from 'react';
import { useStore, parseRouteFromLocation } from './store/useStore';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import Toast from './components/Toast';
import FloatingCart from './components/FloatingCart';
import MobileBottomNav from './components/MobileBottomNav';
import AgeGateModal from './components/AgeGateModal';
import CartDrawer from './components/CartDrawer';

import HomeView from './views/HomeView';
import ShopView from './views/ShopView';
import ProductDetailView from './views/ProductDetailView';
import ComboView from './views/ComboView';
import CheckoutView from './views/CheckoutView';
import ConfirmationView from './views/ConfirmationView';

export default function App() {
  const currentView = useStore((state) => state.currentView);
  const fetchProducts = useStore((state) => state.fetchProducts);
  const navigateTo = useStore((state) => state.navigateTo);
  const openCartDrawer = useStore((state) => state.openCartDrawer);

  useEffect(() => {
    fetchProducts();
    const initial = parseRouteFromLocation();
    if (initial.openCart) {
      openCartDrawer();
    }
  }, [fetchProducts, openCartDrawer]);

  // Sync state when user clicks browser Back/Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const { view, slug, openCart } = parseRouteFromLocation();
      navigateTo(view, slug, true);
      if (openCart) {
        openCartDrawer();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigateTo, openCartDrawer]);

  return (
    <div className="min-h-screen flex flex-col bg-white antialiased text-slate-800 pb-14 md:pb-0">
      <Navbar />
      
      <main id="appContent" className="flex-grow">
        {currentView === 'home' && <HomeView />}
        {currentView === 'shop' && <ShopView />}
        {currentView === 'product' && <ProductDetailView />}
        {currentView === 'combo' && <ComboView />}
        {currentView === 'checkout' && <CheckoutView />}
        {currentView === 'confirmation' && <ConfirmationView />}
      </main>

      <Footer />
      <FloatingWhatsApp />
      <FloatingCart />
      <MobileBottomNav />
      <Toast />
      
      {/* Interactive Slide-Over Cart Drawer */}
      <CartDrawer />

      {/* 18+ Mandatory Age-Gating Modal */}
      <AgeGateModal />
    </div>
  );
}
