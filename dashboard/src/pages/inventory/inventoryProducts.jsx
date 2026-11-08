import CatalogLinks from './catalogLinks';

// Inventory → Products: link products to inventory pieces
export default function InventoryProducts() {
  return <CatalogLinks entity="product" />;
}
