import { Sparkles } from 'lucide-react';
import { ProductShowcaseManager } from './ProductShowcaseManager';

export default function FeaturedProductsTab() {
  return (
    <ProductShowcaseManager
      showcaseKey="featured"
      title="Featured Products"
      icon={Sparkles}
      iconColor="text-amber-500"
    />
  );
}
