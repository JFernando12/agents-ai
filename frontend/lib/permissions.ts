import { UserRole } from './user';

// Permission definitions per role (additive from viewer up)
// Hierarchy: super_admin > owner > admin > editor > viewer
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  viewer: [
    'view_agents',
    'chat',
    'view_conversations',
  ],
  editor: [
    'view_agents',
    'chat',
    'view_conversations',
    'create_agents',
    'edit_agents',
    'view_tools',
    'view_products',
  ],
  admin: [
    'view_agents',
    'chat',
    'view_conversations',
    'create_agents',
    'edit_agents',
    'delete_agents',
    'view_tools',
    'create_tools',
    'edit_tools',
    'delete_tools',
    'view_products',
    'create_products',
    'edit_products',
    'delete_products',
    'view_users',
    'create_users',
    'edit_users',
    'delete_users',
    'reset_user_password',
    'view_logs',
    'view_unanswered',
  ],
  owner: [
    'view_agents',
    'chat',
    'view_conversations',
    'create_agents',
    'edit_agents',
    'delete_agents',
    'view_tools',
    'create_tools',
    'edit_tools',
    'delete_tools',
    'view_products',
    'create_products',
    'edit_products',
    'delete_products',
    'view_users',
    'create_users',
    'edit_users',
    'delete_users',
    'reset_user_password',
    'view_logs',
    'view_unanswered',
    'manage_account',
  ],
  super_admin: [
    'view_agents',
    'chat',
    'view_conversations',
    'create_agents',
    'edit_agents',
    'delete_agents',
    'view_tools',
    'create_tools',
    'edit_tools',
    'delete_tools',
    'view_products',
    'create_products',
    'edit_products',
    'delete_products',
    'view_users',
    'create_users',
    'edit_users',
    'delete_users',
    'reset_user_password',
    'view_logs',
    'view_unanswered',
    'manage_accounts',
    'view_all_accounts',
    'manage_account',
  ],
};

export function can(role: UserRole | undefined, action: string): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}

export function isAtLeastAdmin(role: UserRole | undefined): boolean {
  return role === 'admin' || role === 'owner' || role === 'super_admin';
}

export function isOwnerOrAbove(role: UserRole | undefined): boolean {
  return role === 'owner' || role === 'super_admin';
}

export function isSuperAdmin(role: UserRole | undefined): boolean {
  return role === 'super_admin';
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    owner: 'Dueño',
    admin: 'Admin',
    editor: 'Editor',
    viewer: 'Viewer',
  };
  return labels[role] ?? role;
}
