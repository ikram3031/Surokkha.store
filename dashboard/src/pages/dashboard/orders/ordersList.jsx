import { useSearchParams } from 'react-router-dom';
import { clientConfig } from '@/clientConfig';
import { useOrderList } from './orderList/useOrderList';
import View1 from './orderList/View1';
import View2 from './orderList/View2';

// Orders list page. All logic lives in useOrderList; the views only render.
//
// Which view is shown:
//   1. ?view=1 or ?view=2 in the URL (handy for comparing)
//   2. clientConfig.ui.orderListView (per client)
//   3. DEFAULT_VIEW
const VIEWS = { 1: View1, 2: View2 };
const DEFAULT_VIEW = 2;

const resolveView = (urlValue) => {
  const fromUrl = Number(urlValue);
  if (VIEWS[fromUrl]) return fromUrl;
  const fromConfig = Number(clientConfig?.ui?.orderListView);
  if (VIEWS[fromConfig]) return fromConfig;
  return DEFAULT_VIEW;
};

const OrdersPage = () => {
  const [searchParams] = useSearchParams();
  const view = resolveView(searchParams.get('view'));

  // View1 renders the shared OrdersTable, which fetches its own rows; only View2 needs the hook to fetch
  const list = useOrderList({ fetchData: view === 2 });

  const View = VIEWS[view];
  return <View list={list} />;
};

export default OrdersPage;
