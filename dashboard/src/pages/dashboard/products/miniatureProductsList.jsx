import React from 'react';
import ProductsPage from './productsList';

// Renders the miniature products view filtered specifically to the miniature category
const MiniatureProductsList = () => {
  return <ProductsPage fixedCategory="Miniature" pageTitle="Miniature Products" />;
};

export default MiniatureProductsList;
