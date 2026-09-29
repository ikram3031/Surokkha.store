import { TrendingUp } from 'lucide-react';
import { ProductShowcaseManager } from './ProductShowcaseManager';

export default function BestSellingProductsTab() {
  return (
    <ProductShowcaseManager
      showcaseKey="bestSeller"
      title="Best Selling Products"
      icon={TrendingUp}
      iconColor="text-emerald-500"
    />
  );
}
