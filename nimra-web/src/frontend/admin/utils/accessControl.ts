export type AppRole = 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';

export const normalizeRole = (role?: string): AppRole => {
  const value = String(role || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (value === 'SUPER_ADMIN' || value === 'SUPERADMIN') return 'SUPER_ADMIN';
  if (value === 'ADMIN' || value === 'MANAGER') return 'ADMIN';
  return 'CUSTOMER';
};

export const isAdminRole = (role?: string) => ['ADMIN', 'SUPER_ADMIN'].includes(normalizeRole(role));
export const isSuperAdmin = (role?: string) => normalizeRole(role) === 'SUPER_ADMIN';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'export';
export const hasPermission = (
  user: { role?: string; Role?: string; permissions?: string[] | string; Permissions?: string[] | string } | null,
  module: string,
  action: PermissionAction = 'view'
) => {
  if (!user) return false;
  if (isSuperAdmin(user.role || user.Role)) return true;
  if (normalizeRole(user.role || user.Role) !== 'ADMIN') return false;
  const raw = user.permissions ?? user.Permissions;
  if (!raw) return true;
  const permissions = Array.isArray(raw) ? raw : String(raw).split(',').map((item) => item.trim());
  const key = `${module.toLowerCase()}:${action}`;
  return permissions.some((permission) => permission === '*' || permission.toLowerCase() === key);
};
