// Main dashboard menus an Owner can grant to a user on top of their role.
// Keep these keys in sync with dashboard/src/config/accessGroups.js.
export const ACCESS_GROUPS = [
  "overview",
  "sales",
  "catalog",
  "inventory",
  "customers",
  "analytics",
  "reports",
  "accounts",
  "blog",
  "media",
  "support",
  "webmail",
];

// Menus a role always has, before any per-user extras.
// Roles not listed here are authorised by the role groups on each route (see auth.middleware.js).
export const ROLE_DEFAULT_GROUPS = {
  Accountant: ["accounts", "support", "webmail"],
};

// Roles that already see everything, so per-user extras never apply to them
export const FULL_ACCESS_ROLES = ["Owner", "Admin"];

// Every staff member gets these, whatever their role (notification bell, activity entries)
const ALWAYS_GRANTED = ["notifications"];

// Keeps only known menu keys, once each
export const sanitizeAccessGroups = (value) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((key) => ACCESS_GROUPS.includes(key)))];
};

// The menus a user can open: their role's defaults plus the extras granted to them
export const grantedGroupsFor = (user) => {
  const role = user?.role;
  const extras = FULL_ACCESS_ROLES.includes(role) ? [] : sanitizeAccessGroups(user?.extraMenus);
  return new Set([...ALWAYS_GRANTED, ...(ROLE_DEFAULT_GROUPS[role] || []), ...extras]);
};
