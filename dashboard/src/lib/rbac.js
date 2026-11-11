import coreConfig from '@/config/core.json';

import { FULL_ACCESS_ROLES, menusForGroups } from '@/config/accessGroups';

// A granted entry unlocks the key itself and every sub-menu under it ("accounts" or "accounts.*" -> "accounts.bills.new")
const coversKey = (entry, menuKey) => {
  const base = entry.endsWith('.*') ? entry.slice(0, -2) : entry;
  return menuKey === base || menuKey.startsWith(`${base}.`);
};

/**
 * Whether a user (or a bare role name) may open a menu or sub-menu.
 * Pass the user object where possible so the Owner's per-user menu grants (extraMenus) count.
 */
export const hasMenuAccess = (roleOrUser, menuKey) => {
  const role = typeof roleOrUser === 'object' && roleOrUser !== null ? roleOrUser.role : roleOrUser;
  if (!role || !menuKey) return false;

  const normalizedRole = String(role).trim();
  const lowerRole = normalizedRole.toLowerCase();

  if (lowerRole === 'owner') {
    return true;
  }

  if (coreConfig?.ownerOnlyMenus?.includes(menuKey)) {
    return false;
  }

  if (lowerRole === 'admin') {
    return true;
  }

  if (menuKey === 'admin' || menuKey.startsWith('admin.') || menuKey.startsWith('admin/')) {
    return false;
  }

  const roleConfig =
    coreConfig?.userRoles?.[normalizedRole] ||
    coreConfig?.userRoles?.[normalizedRole.replace(/\s+/g, '-')] ||
    coreConfig?.userRoles?.[normalizedRole.replace(/-/g, ' ')];

  const roleMenus = Array.isArray(roleConfig?.allowedMenus) ? roleConfig.allowedMenus : [];
  if (roleMenus.includes('*')) {
    return true;
  }

  // Role menus match exactly (or by "parent.*"); per-user grants unlock whole menus with their sub-menus
  if (roleMenus.some((entry) => (entry.endsWith('.*') ? coversKey(entry, menuKey) : entry === menuKey))) {
    return true;
  }

  const extras = typeof roleOrUser === 'object' && !FULL_ACCESS_ROLES.includes(normalizedRole) ? menusForGroups(roleOrUser?.extraMenus) : [];
  return extras.some((entry) => coversKey(entry, menuKey));
};

// Gets the default landing route URL for a given role upon login
// Accepts a role name or the user object
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

  if (hasMenuAccess(role, 'accounts.balance')) {
    return '/finance/balance';
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
