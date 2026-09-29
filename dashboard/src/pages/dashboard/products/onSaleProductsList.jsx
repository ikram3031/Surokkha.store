import ProductsPage from './productsList';

// Renders the on sale products inventory list filtered exclusively to discounted items
const OnSaleProductsList = () => {
  return <ProductsPage fixedOnSale={true} pageTitle="On Sale Products" />;
};

export default OnSaleProductsList;
