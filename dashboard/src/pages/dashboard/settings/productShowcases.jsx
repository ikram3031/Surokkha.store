import { useState } from 'react';
import { Sparkles, Tag, TrendingUp, Sliders, ShieldCheck } from 'lucide-react';
import FeaturedProductsTab from './FeaturedProductsTab';
import OnSaleProductsTab from './OnSaleProductsTab';
import BestSellingProductsTab from './BestSellingProductsTab';
import CatalogPreferencesTab from './CatalogPreferencesTab';
import SecurityAccessTab from './SecurityAccessTab';

// Displays product showcase curation tabs for featured, on sale, and bestseller products
const ProductShowcasesPage = () => {
  const [activeTab, setActiveTab] = useState('featured');

  const tabs = [
    { id: 'featured', label: 'Featured Products', icon: Sparkles, iconColor: 'text-amber-500' },
    { id: 'onsale', label: 'On Sale Products', icon: Tag, iconColor: 'text-rose-500' },
    { id: 'bestseller', label: 'Best Selling Products', icon: TrendingUp, iconColor: 'text-emerald-500' },
    { id: 'catalog-preferences', label: 'Catalog Display', icon: Sliders, iconColor: 'text-blue-500' },
    { id: 'advanced-security', label: 'Security & Access', icon: ShieldCheck, iconColor: 'text-purple-500' },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 w-full">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Products Showcases</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Curate featured, on sale, and best selling product collections highlighted across your storefront.
        </p>
      </div>

      <div className="border-b border-border pb-3">
        <div className="inline-flex flex-wrap items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                }`}
              >
                <Icon className={`h-4 w-4 ${t.iconColor}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full">
        {activeTab === 'featured' && <FeaturedProductsTab />}
        {activeTab === 'onsale' && <OnSaleProductsTab />}
        {activeTab === 'bestseller' && <BestSellingProductsTab />}
        {activeTab === 'catalog-preferences' && <CatalogPreferencesTab />}
        {activeTab === 'advanced-security' && <SecurityAccessTab />}
      </div>
    </div>
  );
};

export default ProductShowcasesPage;
