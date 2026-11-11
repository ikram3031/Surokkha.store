// Main menus the Owner can grant to a user on top of their role.
// Keys must match backend/src/common/config/accessGroups.js; `menus` are the dashboard menu keys
// each one unlocks (a key also unlocks all of its sub-menus, e.g. "products" covers "products.list").
export const ACCESS_GROUPS = [
  { key: 'overview', label: 'Overview', description: 'Dashboard overview', menus: ['overview'] },
  { key: 'sales', label: 'Sales', description: 'Orders, Pathao parcels, in-store and custom orders', menus: ['orders'] },
  { key: 'catalog', label: 'Catalog', description: 'Products, items, categories, coupons, reviews', menus: ['products', 'items', 'reviews'] },
  { key: 'inventory', label: 'Inventory', description: 'Stock, purchases and vendors', menus: ['inventory'] },
  { key: 'customers', label: 'Customers', description: 'Customer and member lists', menus: ['customers', 'members'] },
  { key: 'analytics', label: 'Analytics', description: 'Store and product analytics', menus: ['analytics', 'analytics-reports'] },
  { key: 'reports', label: 'Reports', description: 'Sales and finance reports', menus: ['reports'] },
  { key: 'accounts', label: 'Accounts', description: 'Balance, bills, payments, investments', menus: ['accounts', 'billing'] },
  { key: 'blog', label: 'Blog', description: 'Posts, categories and blog SEO', menus: ['blog'] },
  { key: 'media', label: 'Media & Tools', description: 'Media library, image resize, Meta catalog', menus: ['tools.media', 'tools.assets', 'tools.bulk-image-resize', 'tools.meta-catalog'] },
  { key: 'support', label: 'Support Desk', description: 'Customer support tickets', menus: ['tools.support'] },
  { key: 'webmail', label: 'Webmail', description: 'Store mailbox', menus: ['webmail', 'tools.messages'] },
];

// Menus a role always has; these show as locked (on) in the access editor
export const ROLE_DEFAULT_GROUPS = {
  Accountant: ['accounts', 'support', 'webmail'],
};

// Roles that already see everything, so extras never apply
export const FULL_ACCESS_ROLES = ['Owner', 'Admin'];

// Dashboard menu keys unlocked by a user's per-user extras
export const menusForGroups = (groupKeys = []) => {
  const keys = new Set(Array.isArray(groupKeys) ? groupKeys : []);
  return ACCESS_GROUPS.filter((group) => keys.has(group.key)).flatMap((group) => group.menus);
};
