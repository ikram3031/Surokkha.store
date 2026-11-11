import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { Navigate } from 'react-router-dom';
import { getDefaultRedirect, hasMenuAccess } from '@/lib/rbac';
import NotFound from '@/components/NotFound';

import { clientConfig } from '@/clientConfig';

// Guards dashboard routes by validating role permission and tenant feature capability
const RoleGuard = ({ menuKey, children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-1 p-8 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
        <div className="h-64 w-full bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  const features = clientConfig?.features;
  if (menuKey === 'products.size-charts' && !features?.sizeChart) {
    return <NotFound />;
  }
  if (menuKey === 'products.brands' && features?.brand === false) {
    return <NotFound />;
  }
  if (menuKey === 'season' && features?.season === false) {
    return <NotFound />;
  }
  if (menuKey === 'tools.messages' && features?.webmail === false) {
    return <NotFound />;
  }
  if ((menuKey === 'orders.instore' || menuKey === 'orders.new') && features?.inStoreOrder === false) {
    return <NotFound />;
  }
  if ((menuKey === 'orders.custom' || menuKey === 'orders.custom-new') && !features?.customOrders) {
    return <NotFound />;
  }

  const isAllowed = hasMenuAccess(user, menuKey);

  if (!isAllowed) {
    // Users without the Overview (e.g. Accountant) land on the first page they can open instead
    const home = menuKey === 'overview' ? getDefaultRedirect(user) : null;
    if (home && home !== '/dashboard') return <Navigate to={home} replace />;
    return <NotFound />;
  }

  return children;
};

export default RoleGuard;
