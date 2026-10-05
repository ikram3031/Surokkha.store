import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layout
import DashboardLayout from './layouts/dashboardLayout';
import AdminLayout from './layouts/adminLayout';

// Auth & Onboarding
import Login from './pages/auth/login';
import InvitePage from './pages/invite';

// Dashboard
import Overview from './pages/dashboard/overview';
import Analytics from './pages/dashboard/analytics';
import CloudflareAnalytics from './pages/dashboard/cloudflareAnalytics';
import UserProfile from './pages/dashboard/profile';
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
import SmtpSettingsPage from './pages/dashboard/settings/smtpSettings';
import TemplatesPage from './pages/dashboard/templates/index';
import AllMedia from './pages/dashboard/allMedia';
import AdminStylesPage from './pages/dashboard/settings/adminStyles';

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

const dashboardRoutes = [
      {
        path: '',
        element: (
          <RoleGuard menuKey="overview">
            <Overview />
          </RoleGuard>
        ),
      },
      {
        path: 'profile',
        element: <UserProfile />,
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
dashboardRoutes,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    errorElement: <RouteErrorElement />,
    children: dashboardRoutes
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
