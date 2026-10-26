import { useOrderList } from './orderList/useOrderList';
import View2 from './orderList/View2';

// Custom orders list: the same table, filters, quick view and bulk actions as the main orders list,
// scoped to orderType "custom". All logic lives in useOrderList; View2 only renders.
const CustomOrders = () => {
  const list = useOrderList({ fetchData: true, orderType: 'custom' });
  return <View2 list={list} />;
};

export default CustomOrders;
