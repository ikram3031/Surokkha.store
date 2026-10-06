import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { FloatingCartButton } from './components/FloatingCartButton';
import { Footer } from './components/Footer';
import { fetchCatalogProducts } from './services/productService';
import { FALLBACK_PRODUCTS } from './data/fallbackProducts';
import { toBengaliNumber } from './utils/formatters';
import { Sparkles, SearchX, RefreshCw } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch live products on mount, falling back to local dataset
  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        const data = await fetchCatalogProducts();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      } catch (e) {
        console.error('Failed to load products from API:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts = {
      all: products.length,
      condom: 0,
      spray: 0,
      lubricant: 0,
      combo: 0,
    };

    products.forEach((p) => {
      if (counts[p.category] !== undefined) {
        counts[p.category] += 1;
      }
    });

    return counts;
  }, [products]);

  // Filter products by category and search query
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (activeCategory !== 'all' && product.category !== activeCategory) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const nameMatch = (product.name || '').toLowerCase().includes(query);
        const nameBnMatch = (product.name_bn || '').toLowerCase().includes(query);
        const brandMatch = (product.brand || '').toLowerCase().includes(query);
        const packSizeMatch = (product.packSize || '').toLowerCase().includes(query);
        const catMatch = (product.category_name || '').toLowerCase().includes(query);
        const descMatch = (product.description || '').toLowerCase().includes(query);
        const taglineMatch = (product.tagline || '').toLowerCase().includes(query);

        return nameMatch || nameBnMatch || brandMatch || packSizeMatch || catMatch || descMatch || taglineMatch;
      }

      return true;
    });
  }, [products, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b1329] text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Main Catalog Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
        {/* Hero Banner / Catalog Notice */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-900/40 p-4 sm:p-6 shadow-xl">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 sm:space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>অফিসিয়াল ডিজিটাল ক্যাটালগ • সরাসরি ইনবক্স অর্ডার</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-tight">
                সুরক্ষা প্রিমিয়াম পার্সোনাল কেয়ার ও সেক্সুয়াল ওয়েলনেস কালেকশন
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                আপনার পছন্দের প্রোডাক্ট সরাসরি কার্টে যোগ করে অথবা এক ক্লিকে হোয়াটসঅ্যাপে অর্ডার কনফার্ম করুন। ১০০% গোপনীয় সিল করা মোড়কে ক্যাশ অন ডেলিভারি।
              </p>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto text-xs text-slate-400 bg-slate-950/50 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border border-slate-800/80 sm:border-0">
              <span className="font-semibold text-emerald-400">
                মোট {toBengaliNumber(products.length)} টি প্রোডাক্ট
              </span>
              <span className="text-[11px] text-slate-400">
                সর্বোচ্চ ৬৭% পর্যন্ত ছাড়
              </span>
            </div>
          </div>
        </div>

        {/* Category Filter Pills Bar */}
        <div className="sticky top-[102px] sm:top-[74px] z-30 bg-[#0b1329]/95 backdrop-blur-md pt-1 pb-2 border-b border-slate-800/60">
          <CategoryFilter
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            categoryCounts={categoryCounts}
          />
        </div>

        {/* Filter / Search Status Summary */}
        {(searchQuery || activeCategory !== 'all') && (
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
            <span>
              {searchQuery && (
                <>
                  "<span className="text-white font-medium">{searchQuery}</span>" এর জন্য{' '}
                </>
              )}
              খুঁজে পাওয়া গেছে:{' '}
              <span className="text-emerald-400 font-bold">
                {toBengaliNumber(filteredProducts.length)} টি প্রোডাক্ট
              </span>
            </span>

            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline text-xs"
            >
              সব ফিল্টার মুছুন
            </button>
          </div>
        )}

        {/* Responsive Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 pt-2">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id || product.slug}
                product={product}
                onOpenModal={setSelectedProduct}
              />
            ))}
          </div>
        ) : (
          /* Empty Search / Filter State */
          <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-slate-850/50 rounded-3xl border border-slate-800 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
              <SearchX className="w-7 h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-200">
              কোনো প্রোডাক্ট খুঁজে পাওয়া যায়নি
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md">
              আপনার খোঁজা কীওয়ার্ড বা ক্যাটাগরিতে কোনো পণ্য মেলেনি। অনুগ্রহ করে অন্য নাম দিয়ে খুঁজুন অথবা সব প্রোডাক্ট দেখতে বাটনে ক্লিক করুন।
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              <span>সকল প্রোডাক্ট দেখুন</span>
            </button>
          </div>
        )}
      </main>

      {/* Floating Cart & Support Action */}
      <FloatingCartButton />

      {/* Product Detail Modal Sheet */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Cart Drawer Sidebar */}
      <CartDrawer />

      {/* Footer */}
      <Footer />
    </div>
  );
}
