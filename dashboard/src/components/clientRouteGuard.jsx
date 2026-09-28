import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { clientConfig } from '@/clientConfig';

// Maps request path to corresponding menu permission key
const getRequiredPermission = (pathname) => {
  const cleanPath = pathname.replace(/\/$/, '');

  if (cleanPath === '/dashboard') return 'overview';
  if (cleanPath === '/dashboard/orders/custom/new' || cleanPath === '/dashboard/orders/custom-new') return 'orders.custom-new';
  if (cleanPath === '/dashboard/orders/custom') return 'orders.custom';
  if (cleanPath === '/dashboard/orders/new') return 'orders.new';
  if (cleanPath === '/dashboard/orders/in-store' || cleanPath === '/dashboard/orders/instore') return 'orders.instore';
  if (cleanPath.startsWith('/dashboard/orders')) return 'orders.list';
  
  if (cleanPath === '/dashboard/products/new' || cleanPath.startsWith('/dashboard/products/new/')) return 'products.new';
  if (cleanPath === '/dashboard/products/on-sale') return 'products.on-sale';
  if (cleanPath === '/dashboard/products/miniature') return 'products.miniature';
  if (cleanPath === '/dashboard/products/categories') return 'products.categories';
  if (cleanPath === '/dashboard/products/brands') return 'products.brands';
  if (cleanPath === '/dashboard/products/attributes') return 'products.attributes';
  if (cleanPath === '/dashboard/products/coupons') return 'products.coupons';
  if (cleanPath === '/dashboard/products/size-charts') return 'products.size-charts';
  if (cleanPath.startsWith('/dashboard/products')) return 'products.list';

  if (cleanPath.startsWith('/dashboard/members') || cleanPath.startsWith('/dashboard/customers')) return 'members';

  if (cleanPath === '/dashboard/accounts/bills/new') return 'accounts.bills.new';
  if (cleanPath === '/dashboard/accounts/bills/types') return 'accounts.bills.types';
  if (cleanPath === '/dashboard/accounts/bills') return 'accounts.bills';
  if (cleanPath === '/dashboard/accounts/payments/new') return 'accounts.payments.new';
  if (cleanPath === '/dashboard/accounts/payments/types') return 'accounts.payments.types';
  if (cleanPath === '/dashboard/accounts/payments') return 'accounts.payments';
  if (cleanPath === '/dashboard/accounts/investors') return 'accounts.investors';
  if (cleanPath === '/dashboard/accounts/investments') return 'accounts.investments';
  if (cleanPath === '/dashboard/accounts/balance' || cleanPath === '/dashboard/accounts') return 'accounts.balance';
  if (cleanPath.startsWith('/dashboard/accounts')) return 'accounts';

  if (cleanPath === '/dashboard/billing/billings') return 'billing.billings';
  if (cleanPath === '/dashboard/billing/payments') return 'billing.payments';
  if (cleanPath.startsWith('/dashboard/billing')) return 'billing';

  if (cleanPath.startsWith('/dashboard/reports')) return 'reports';
  if (cleanPath.startsWith('/dashboard/users')) return 'users';
  if (cleanPath.startsWith('/dashboard/developer')) return 'developer';
  if (cleanPath === '/dashboard/cpanel' || cleanPath.startsWith('/dashboard/cpanel')) return 'cpanel';

  return null;
};

// Protects dashboard routes matching tenant allowedMenus and capability flags
export const ClientRouteGuard = ({ children }) => {
  const location = useLocation();
  const requiredPermission = getRequiredPermission(location.pathname);
  const allowedMenus = clientConfig.allowedMenus || [];
  const features = clientConfig.features || {};
  const modules = clientConfig.modules || {};

  if (requiredPermission === 'cpanel' && (modules?.cpanelAccess === false || features?.cpanelAccess === false)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredPermission === 'products.size-charts' && !features?.sizeChart) {
    return <Navigate to="/dashboard" replace />;
  }

  if ((requiredPermission === 'orders.instore' || requiredPermission === 'orders.new') && features?.inStoreOrder === false) {
    return <Navigate to="/dashboard" replace />;
  }

  if ((requiredPermission === 'orders.custom' || requiredPermission === 'orders.custom-new') && !features?.customOrders) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredPermission && !allowedMenus.includes('*')) {
    const parentPermission = requiredPermission.includes('.') ? requiredPermission.split('.')[0] : null;
    const isExplicitlyAllowed = allowedMenus.includes(requiredPermission);
    const isParentAllowed = parentPermission && allowedMenus.includes(parentPermission);
    if (!isExplicitlyAllowed && !isParentAllowed) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ClientRouteGuard;
