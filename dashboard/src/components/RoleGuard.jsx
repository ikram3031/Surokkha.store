import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { hasMenuAccess } from '@/lib/rbac';
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

  const userRole = user?.role || 'Marketing Expert';
  const isAllowed = hasMenuAccess(userRole, menuKey);

  if (!isAllowed) {
    return <NotFound />;
  }

  return children;
};

export default RoleGuard;
