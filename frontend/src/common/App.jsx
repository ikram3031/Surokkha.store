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
import TermsView from './views/TermsView';
import PrivacyView from './views/PrivacyView';
import RefundView from './views/RefundView';
import FaqView from './views/FaqView';
import ContactView from './views/ContactView';

export default function App() {
  const currentView = useStore((state) => state.currentView);
  const fetchProducts = useStore((state) => state.fetchProducts);
  const fetchCategories = useStore((state) => state.fetchCategories);
  const navigateTo = useStore((state) => state.navigateTo);
  const openCartDrawer = useStore((state) => state.openCartDrawer);

  useEffect(() => {
    if (fetchCategories) fetchCategories();
    const initial = parseRouteFromLocation();
    if (initial.openCart) {
      openCartDrawer();
    }
  }, [fetchCategories, openCartDrawer]);

  useEffect(() => {
    if (currentView !== 'product' && currentView !== 'checkout') {
      const state = useStore.getState();
      if (!state.hasFetchedAllProducts) {
        fetchProducts();
      }
    }
  }, [currentView, fetchProducts]);

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
        {currentView === 'terms' && <TermsView />}
        {currentView === 'privacy' && <PrivacyView />}
        {currentView === 'refund' && <RefundView />}
        {currentView === 'faq' && <FaqView />}
        {currentView === 'contact' && <ContactView />}
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
