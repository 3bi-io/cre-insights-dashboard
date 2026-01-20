// Admin & Organization type definitions
import type { Organization, User } from '@/types/common.types';
export type { Organization, User };

export type UserRole = 'super_admin' | 'admin' | 'moderator' | 'recruiter' | 'user';

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role: UserRole;
  organization_id: string | null;
  created_at: string;
}

export interface AdminDashboardMetrics {
  totalOrganizations: number;
  totalUsers: number;
  totalAdmins: number;
  totalApplications: number;
  totalJobs: number;
  totalRevenue: number;
  monthlySpend: number;
  recentSignups: number;
}

export interface OrganizationStats {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  // subscription_status removed - all features available to all users
  userCount: number;
  jobCount: number;
  applicationCount: number;
  monthlySpend: number;
}

export interface UserActivity {
  id: string;
  email: string;
  full_name: string;
  organization_name: string;
  role: string;
  last_sign_in_at: string;
}

export interface OrganizationFormData {
  name: string;
  slug: string;
  adminEmail?: string;
  subscription_status?: string;
  settings?: Record<string, any>;
}

export interface OrganizationUpdatePayload {
  name?: string;
  slug?: string;
  logo_url?: string;
  subscription_status?: string;
  settings?: Record<string, any>;
}

export interface OrganizationFeature {
  feature_name: string;
  enabled: boolean;
  settings?: Record<string, any>;
}

export interface PlatformAccess {
  platform_name: string;
  enabled: boolean;
}

export interface UserManagementData {
  users: User[];
  organizationId: string;
}

export interface CreateUserPayload {
  email: string;
  full_name?: string;
  organization_id: string;
  role?: UserRole;
}

export interface UpdateUserPayload {
  email?: string;
  full_name?: string;
  enabled?: boolean;
}

export interface AssignRolePayload {
  user_id: string;
  role: UserRole;
  organization_id?: string;
}
