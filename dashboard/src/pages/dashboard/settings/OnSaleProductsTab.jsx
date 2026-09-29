import { Tag } from 'lucide-react';
import { ProductShowcaseManager } from './ProductShowcaseManager';

// Renders product showcase manager for on sale items
const OnSaleProductsTab = () => {
  return (
    <ProductShowcaseManager
      showcaseKey="onSale"
      title="On Sale Products"
      icon={Tag}
      iconColor="text-rose-500"
    />
  );
};

export default OnSaleProductsTab;
