import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layout
import DashboardLayout from './layouts/dashboardLayout';

// Auth & Onboarding
import Login from './pages/auth/login';
import InvitePage from './pages/invite';

// Dashboard
import Overview from './pages/dashboard/overview';
import Analytics from './pages/dashboard/analytics';
import CloudflareAnalytics from './pages/dashboard/cloudflareAnalytics';
import Users from './pages/dashboard/users';
import Reports from './pages/dashboard/reportsV2';
import Members from './pages/dashboard/members';
import MemberDetails from './pages/dashboard/memberDetails';
import Trash from './pages/dashboard/trash';
import ActivityLogs from './pages/dashboard/activityLogs';
import Reviews from './pages/dashboard/reviews';
import ProductShowcasesPage from './pages/dashboard/settings/productShowcases';
import MetaPixelPage from './pages/dashboard/settings/metaPixel';
import TikTokPixelPage from './pages/dashboard/settings/tiktokPixel';
import CMSContentPage from './pages/dashboard/settings/cmsContent';
import GoogleAnalyticsPage from './pages/dashboard/settings/googleAnalytics';
import SEOSettingsPage from './pages/dashboard/settings/seoSettings';
import PathaoCourierPage from './pages/dashboard/settings/pathaoCourier';
import AllMedia from './pages/dashboard/allMedia';

// Products
import ProductsList from './pages/dashboard/products/productsList';
import OnSaleProductsList from './pages/dashboard/products/onSaleProductsList';
import MiniatureProductsList from './pages/dashboard/products/miniatureProductsList';
import ProductDetails from './pages/dashboard/products/productDetails';
import AddNewProduct from './pages/dashboard/products/addNewProduct';
// import Stock from './pages/dashboard/products/stock';
import Coupons from './pages/dashboard/products/coupons';
import SizeCharts from './pages/dashboard/products/sizeCharts';
import Categories from './pages/dashboard/products/categories';
import Brands from './pages/dashboard/products/brands';
import Attributes from './pages/dashboard/products/attributes';
import EditAttribute from './pages/dashboard/products/editAttribute';

// Orders
import OrdersList from './pages/dashboard/orders/ordersList';
import OrderDetails from './pages/dashboard/orders/orderDetails';
import NewOrder from './pages/dashboard/orders/newOrder';
import InStoreOrders from './pages/dashboard/orders/inStoreOrders';
import CustomOrders from './pages/dashboard/orders/customOrders';
import NewCustomOrder from './pages/dashboard/orders/newCustomOrder';

// Accounts
import BalanceOverview from './pages/dashboard/accounts/balanceOverview';
import AllBills from './pages/dashboard/accounts/allBills';
import AddNewBill from './pages/dashboard/accounts/addNewBill';
import BillTypes from './pages/dashboard/accounts/billTypes';
import AllPayments from './pages/dashboard/accounts/allPayments';
import AddNewPayment from './pages/dashboard/accounts/addNewPayment';
import PaymentTypes from './pages/dashboard/accounts/paymentTypes';
import Investors from './pages/dashboard/accounts/investors';
import InvestmentsList from './pages/dashboard/accounts/investmentsList';
import BillingOverview from './pages/dashboard/billing/billingOverview';
import Payments from './pages/dashboard/billing/payments';
import Billings from './pages/dashboard/billing/billings';

// Tools
import MessagesManager from './pages/dashboard/tools/messagesManager';
import BulkImageResize from './pages/dashboard/tools/bulkImageResize';
import MetaCatalog from './pages/dashboard/tools/metaCatalog';
import SystemLogs from './pages/dashboard/tools/systemLogs';
import SupportDesk from './pages/dashboard/tools/supportDesk';

// AI Studio
import Studio from './pages/dashboard/studio/index';
import BatchImagesStudio from './pages/dashboard/studio/batchImages';

// Operations & cPanel Micro-Frontend
import CPanelManager from './pages/dashboard/cpanel/index';

// RBAC & Guard
import RoleGuard from './components/RoleGuard';
import NotFound from './components/NotFound';
import { RouteErrorElement } from './components/ErrorBoundary';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <Login />,
    errorElement: <RouteErrorElement />,
  },
  {
    path: '/invite',
    element: <InvitePage />,
    errorElement: <RouteErrorElement />,
  },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    errorElement: <RouteErrorElement />,
    children: [
      {
        path: '',
        element: (
          <RoleGuard menuKey="overview">
            <Overview />
          </RoleGuard>
        ),
      },
      {
        path: 'cpanel',
        element: (
          <RoleGuard menuKey="cpanel">
            <CPanelManager />
          </RoleGuard>
        ),
      },
      {
        path: 'users',
        element: (
          <RoleGuard menuKey="users">
            <Users />
          </RoleGuard>
        ),
      },
      {
        path: 'reports',
        element: (
          <RoleGuard menuKey="reports">
            <Reports />
          </RoleGuard>
        ),
      },
      {
        path: 'analytics',
        element: (
          <RoleGuard menuKey="analytics">
            <Analytics />
          </RoleGuard>
        ),
      },
      {
        path: 'cloudflare-analytics',
        element: (
          <RoleGuard menuKey="analytics">
            <CloudflareAnalytics />
          </RoleGuard>
        ),
      },
      { path: 'cloudflare', element: <Navigate to="/dashboard/cloudflare-analytics" replace /> },
      {
        path: 'members',
        element: (
          <RoleGuard menuKey="members">
            <Members />
          </RoleGuard>
        ),
      },
      {
        path: 'members/:id',
        element: (
          <RoleGuard menuKey="members">
            <MemberDetails />
          </RoleGuard>
        ),
      },
      {
        path: 'customers/:id',
        element: (
          <RoleGuard menuKey="members">
            <MemberDetails />
          </RoleGuard>
        ),
      },
      {
        path: 'reviews',
        element: (
          <RoleGuard menuKey="reviews">
            <Reviews />
          </RoleGuard>
        ),
      },
      {
        path: 'trash',
        element: (
          <RoleGuard menuKey="trash">
            <Trash />
          </RoleGuard>
        ),
      },
      {
        path: 'activity-logs',
        element: (
          <RoleGuard menuKey="activity-logs">
            <ActivityLogs />
          </RoleGuard>
        ),
      },
      {
        path: 'logs',
        element: (
          <RoleGuard menuKey="logs">
            <SystemLogs />
          </RoleGuard>
        ),
      },
      {
        path: 'settings',
        children: [
          { path: '', element: <Navigate to="products" replace /> },
          {
            path: 'products',
            element: (
              <RoleGuard menuKey="settings">
                <ProductShowcasesPage />
              </RoleGuard>
            ),
          },
          {
            path: 'meta-pixel',
            element: (
              <RoleGuard menuKey="settings">
                <MetaPixelPage />
              </RoleGuard>
            ),
          },
          {
            path: 'tiktok-pixel',
            element: (
              <RoleGuard menuKey="settings">
                <TikTokPixelPage />
              </RoleGuard>
            ),
          },
          {
            path: 'cms-content',
            element: (
              <RoleGuard menuKey="settings">
                <CMSContentPage />
              </RoleGuard>
            ),
          },
          { path: 'cms', element: <Navigate to="cms-content" replace /> },
          {
            path: 'google-analytics',
            element: (
              <RoleGuard menuKey="settings">
                <GoogleAnalyticsPage />
              </RoleGuard>
            ),
          },
          {
            path: 'seo',
            element: (
              <RoleGuard menuKey="settings">
                <SEOSettingsPage />
              </RoleGuard>
            ),
          },
          {
            path: 'pathao-courier',
            element: (
              <RoleGuard menuKey="settings">
                <PathaoCourierPage />
              </RoleGuard>
            ),
          },
          { path: 'pathao', element: <Navigate to="pathao-courier" replace /> },
        ],
      },
      {
        path: 'media',
        element: <AllMedia />,
      },
      {
        path: 'tools',
        children: [
          { path: '', element: <Navigate to="messages" replace /> },
          {
            path: 'messages',
            element: (
              <RoleGuard menuKey="tools.messages">
                <MessagesManager />
              </RoleGuard>
            ),
          },
          {
            path: 'assets',
            element: <Navigate to="/dashboard/settings/cms-content" replace />,
          },
          { path: 'media', element: <Navigate to="/dashboard/media" replace /> },
          {
            path: 'bulk-image-resize',
            element: (
              <RoleGuard menuKey="tools.bulk-image-resize">
                <BulkImageResize />
              </RoleGuard>
            ),
          },
          {
            path: 'meta-catalog',
            element: (
              <RoleGuard menuKey="tools.meta-catalog">
                <MetaCatalog />
              </RoleGuard>
            ),
          },
          {
            path: 'support',
            element: (
              <RoleGuard menuKey="tools.support">
                <SupportDesk />
              </RoleGuard>
            ),
          },
          { path: 'analytics', element: <Navigate to="/dashboard/analytics" replace /> },
          { path: 'cloudflare-analytics', element: <Navigate to="/dashboard/cloudflare-analytics" replace /> },
          { path: 'cloudflare', element: <Navigate to="/dashboard/cloudflare-analytics" replace /> },
          { path: 'google-analytics', element: <Navigate to="/dashboard/settings/google-analytics" replace /> },
          { path: 'activity-logs', element: <Navigate to="/dashboard/activity-logs" replace /> },
          { path: 'logs', element: <Navigate to="/dashboard/logs" replace /> },
        ],
      },
      { path: 'messages', element: <Navigate to="/dashboard/tools/messages" replace /> },
      {
        path: 'developer',
        children: [
          { path: 'bulk-image-resize', element: <Navigate to="/dashboard/tools/bulk-image-resize" replace /> },
          { path: 'meta-catalog', element: <Navigate to="/dashboard/tools/meta-catalog" replace /> },
          { path: 'logs', element: <Navigate to="/dashboard/logs" replace /> },
        ],
      },
      {
        path: 'products',
        children: [
          {
            path: '',
            element: (
              <RoleGuard menuKey="products.list">
                <ProductsList />
              </RoleGuard>
            ),
          },
          {
            path: 'list',
            element: (
              <RoleGuard menuKey="products.list">
                <ProductsList />
              </RoleGuard>
            ),
          },
          {
            path: 'on-sale',
            element: (
              <RoleGuard menuKey="products.on-sale">
                <OnSaleProductsList />
              </RoleGuard>
            ),
          },
          {
            path: 'miniature',
            element: (
              <RoleGuard menuKey="products.miniature">
                <MiniatureProductsList />
              </RoleGuard>
            ),
          },
          {
            path: 'new',
            element: (
              <RoleGuard menuKey="products.new">
                <AddNewProduct />
              </RoleGuard>
            ),
          },
          {
            path: 'new/:category',
            element: (
              <RoleGuard menuKey="products.new">
                <AddNewProduct />
              </RoleGuard>
            ),
          },
          /* {
            path: 'stock',
            element: (
              <RoleGuard menuKey="products.list">
                <Stock />
              </RoleGuard>
            ),
          }, */
          {
            path: 'coupons',
            element: (
              <RoleGuard menuKey="products.coupons">
                <Coupons />
              </RoleGuard>
            ),
          },
          {
            path: 'size-charts',
            element: (
              <RoleGuard menuKey="products.size-charts">
                <SizeCharts />
              </RoleGuard>
            ),
          },
          { path: 'reviews', element: <Navigate to="/dashboard/reviews" replace /> },
          {
            path: 'categories',
            element: (
              <RoleGuard menuKey="products.categories">
                <Categories />
              </RoleGuard>
            ),
          },
          {
            path: 'brands',
            element: (
              <RoleGuard menuKey="products.brands">
                <Brands />
              </RoleGuard>
            ),
          },
          {
            path: 'attributes',
            element: (
              <RoleGuard menuKey="products.attributes">
                <Attributes />
              </RoleGuard>
            ),
          },
          {
            path: 'attributes/:id',
            element: (
              <RoleGuard menuKey="products.attributes">
                <EditAttribute />
              </RoleGuard>
            ),
          },
          {
            path: ':id',
            element: (
              <RoleGuard menuKey="products.list">
                <ProductDetails />
              </RoleGuard>
            ),
          },
        ],
      },
      {
        path: 'orders',
        children: [
          {
            path: '',
            element: (
              <RoleGuard menuKey="orders.list">
                <OrdersList />
              </RoleGuard>
            ),
          },
          {
            path: 'list',
            element: (
              <RoleGuard menuKey="orders.list">
                <OrdersList />
              </RoleGuard>
            ),
          },
          {
            path: 'in-store',
            element: (
              <RoleGuard menuKey="orders.instore">
                <InStoreOrders />
              </RoleGuard>
            ),
          },
          {
            path: 'instore',
            element: (
              <RoleGuard menuKey="orders.instore">
                <InStoreOrders />
              </RoleGuard>
            ),
          },
          {
            path: 'custom',
            element: (
              <RoleGuard menuKey="orders.custom">
                <CustomOrders />
              </RoleGuard>
            ),
          },
          {
            path: 'custom/new',
            element: (
              <RoleGuard menuKey="orders.custom-new">
                <NewCustomOrder />
              </RoleGuard>
            ),
          },
          {
            path: 'custom-new',
            element: (
              <RoleGuard menuKey="orders.custom-new">
                <NewCustomOrder />
              </RoleGuard>
            ),
          },
          {
            path: 'new',
            element: (
              <RoleGuard menuKey="orders.new">
                <NewOrder />
              </RoleGuard>
            ),
          },
          {
            path: ':id',
            element: (
              <RoleGuard menuKey="orders.list">
                <OrderDetails />
              </RoleGuard>
            ),
          },
        ],
      },
      {
        path: 'accounts',
        children: [
          { path: '', element: <Navigate to="balance" replace /> },
          {
            path: 'balance',
            element: (
              <RoleGuard menuKey="accounts.balance">
                <BalanceOverview />
              </RoleGuard>
            ),
          },
          {
            path: 'bills',
            children: [
              {
                path: '',
                element: (
                  <RoleGuard menuKey="accounts.bills">
                    <AllBills />
                  </RoleGuard>
                ),
              },
              {
                path: 'new',
                element: (
                  <RoleGuard menuKey="accounts.bills.new">
                    <AddNewBill />
                  </RoleGuard>
                ),
              },
              {
                path: 'types',
                element: (
                  <RoleGuard menuKey="accounts.bills.types">
                    <BillTypes />
                  </RoleGuard>
                ),
              },
              {
                path: 'payment-methods',
                element: (
                  <RoleGuard menuKey="accounts.payments.types">
                    <PaymentTypes />
                  </RoleGuard>
                ),
              },
              {
                path: 'methods',
                element: (
                  <RoleGuard menuKey="accounts.payments.types">
                    <PaymentTypes />
                  </RoleGuard>
                ),
              },
            ],
          },
          {
            path: 'payments',
            children: [
              {
                path: '',
                element: (
                  <RoleGuard menuKey="accounts.payments">
                    <AllPayments />
                  </RoleGuard>
                ),
              },
              {
                path: 'new',
                element: (
                  <RoleGuard menuKey="accounts.payments.new">
                    <AddNewPayment />
                  </RoleGuard>
                ),
              },
              {
                path: 'types',
                element: (
                  <RoleGuard menuKey="accounts.payments.types">
                    <PaymentTypes />
                  </RoleGuard>
                ),
              },
              {
                path: 'methods',
                element: (
                  <RoleGuard menuKey="accounts.payments.types">
                    <PaymentTypes />
                  </RoleGuard>
                ),
              },
              {
                path: 'payment-methods',
                element: (
                  <RoleGuard menuKey="accounts.payments.types">
                    <PaymentTypes />
                  </RoleGuard>
                ),
              },
            ],
          },
          {
            path: 'payment-methods',
            element: (
              <RoleGuard menuKey="accounts.payments.types">
                <PaymentTypes />
              </RoleGuard>
            ),
          },
          {
            path: 'investors',
            element: (
              <RoleGuard menuKey="accounts.investors">
                <Investors />
              </RoleGuard>
            ),
          },
          {
            path: 'investments',
            element: (
              <RoleGuard menuKey="accounts.investments">
                <InvestmentsList />
              </RoleGuard>
            ),
          },
        ],
      },
      {
        path: 'billing',
        children: [
          { path: '', element: <Navigate to="/dashboard/accounts/balance" replace /> },
          { path: 'payments', element: <Navigate to="/dashboard/accounts/payments" replace /> },
          { path: 'billings', element: <Navigate to="/dashboard/accounts/bills" replace /> },
        ],
      },
      {
        path: 'studio',
        element: (
          <RoleGuard menuKey="studio">
            <Studio />
          </RoleGuard>
        ),
        children: [
          { path: '', element: <Navigate to="batch-images" replace /> },
          {
            path: 'batch-images',
            element: (
              <RoleGuard menuKey="studio.batch-images">
                <BatchImagesStudio />
              </RoleGuard>
            ),
          },
        ],
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
