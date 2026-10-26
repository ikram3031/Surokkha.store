import { useOrderList } from './orderList/useOrderList';
import View2 from './orderList/View2';

// In-store orders list: the same table, filters, quick view and bulk actions as the main orders list,
// scoped to orderType "instore". All logic lives in useOrderList; View2 only renders.
const InStoreOrdersPage = () => {
  const list = useOrderList({ fetchData: true, orderType: 'instore' });
  return <View2 list={list} />;
};

export default InStoreOrdersPage;
