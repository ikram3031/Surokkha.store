import { clientConfig } from '@/clientConfig';
import { hasMenuAccess, isReadOnlyRole } from '@/lib/rbac';

// Reorder opens the New Custom Order page, so it needs that feature and that menu
export const canReorder = (role) =>
  Boolean(clientConfig?.features?.customOrders) && !isReadOnlyRole(role) && hasMenuAccess(role, 'orders.custom-new');

// Create-order page prefilled from an existing order
export const reorderPath = (order) => `/dashboard/orders/custom/new?reorder=${encodeURIComponent(order?.id || order?._id || order?.did || order?.orderNumber)}`;
