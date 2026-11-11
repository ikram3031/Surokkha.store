import { clientConfig } from '@/clientConfig';
import { hasMenuAccess, isReadOnlyRole } from '@/lib/rbac';

// Reorder opens the New Custom Order page, so it needs that feature and that menu (pass the user object)
export const canReorder = (user) =>
  Boolean(clientConfig?.features?.customOrders) && !isReadOnlyRole(user?.role) && hasMenuAccess(user, 'orders.custom-new');

// Create-order page prefilled from an existing order
export const reorderPath = (order) => `/dashboard/orders/custom/new?reorder=${encodeURIComponent(order?.id || order?._id || order?.did || order?.orderNumber)}`;
