import coreConfig from '@/config/core.json';

// Validates whether a specific user role has access to a given menu or submenu key
export const hasMenuAccess = (role, menuKey) => {
  if (!role || !menuKey) return false;

  const normalizedRole = String(role).trim();
  const lowerRole = normalizedRole.toLowerCase();

  if (lowerRole === 'owner' || lowerRole === 'admin') {
    return true;
  }

  if (menuKey === 'admin' || menuKey.startsWith('admin.') || menuKey.startsWith('admin/')) {
    return false;
  }

  const roleConfig =
    coreConfig?.userRoles?.[normalizedRole] ||
    coreConfig?.userRoles?.[normalizedRole.replace(/\s+/g, '-')] ||
    coreConfig?.userRoles?.[normalizedRole.replace(/-/g, ' ')];

  if (!roleConfig || !Array.isArray(roleConfig.allowedMenus)) {
    return false;
  }

  const { allowedMenus } = roleConfig;

  if (allowedMenus.includes('*')) {
    return true;
  }

  if (menuKey.includes('.')) {
    const parentKey = menuKey.split('.')[0];
    if (!allowedMenus.includes(parentKey)) {
      return false;
    }
  }

  return allowedMenus.includes(menuKey);
};

// Gets the default landing route URL for a given role upon login
export const getDefaultRedirect = (role) => {
  if (!role) return '/login';

  if (hasMenuAccess(role, 'overview')) {
    return '/dashboard';
  }

  if (hasMenuAccess(role, 'products.list')) {
    return '/dashboard/products/list';
  }

  if (hasMenuAccess(role, 'orders.list')) {
    return '/dashboard/orders/list';
  }

  if (hasMenuAccess(role, 'tools.bulk-image-resize')) {
    return '/dashboard/tools/bulk-image-resize';
  }

  return '/dashboard';
};

// Returns true if the role is read-only (Investor) — cannot delete, edit, or create anything
export const isReadOnlyRole = (role) => {
  if (!role) return false;
  const lower = String(role).trim().toLowerCase();
  return lower === 'investor';
};
