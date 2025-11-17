import { supabase } from '@/integrations/supabase/client';
import { User, CreateUserPayload, UpdateUserPayload, AssignRolePayload, UserRole } from '../types';

/**
 * Central service for user and role management operations
 */
export class UserManagementService {
  /**
   * Fetches all users
   */
  static async fetchUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('UserManagementService: Error fetching users', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Fetches users for a specific organization
   */
  static async fetchOrganizationUsers(organizationId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('UserManagementService: Error fetching org users', error);
      throw error;
    }
    
    return data || [];
  }

  /**
   * Fetches a single user by ID
   */
  static async fetchUser(id: string): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('UserManagementService: Error fetching user', error);
      throw error;
    }
    
    return data;
  }

  /**
   * Updates a user's profile
   */
  static async updateUser(id: string, updates: UpdateUserPayload): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('UserManagementService: Error updating user', error);
      throw error;
    }

    return data;
  }

  /**
   * Updates user status (enable/disable)
   */
  static async updateUserStatus(userId: string, enabled: boolean): Promise<void> {
    console.log('UserManagementService: Updating user status', userId, enabled);
    
    const { error } = await supabase.rpc('update_user_status', {
      _user_id: userId,
      _enabled: enabled,
    });
    
    if (error) {
      console.error('UserManagementService: Error updating user status', error);
      throw error;
    }
  }

  /**
   * Fetches user roles
   */
  static async fetchUserRoles(userId: string): Promise<any[]> {
    console.log('UserManagementService: Fetching user roles', userId);
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('UserManagementService: Error fetching user roles', error);
      throw error;
    }
    
    return data || [];
  }

  /**
   * Assigns a role to a user
   */
  static async assignRole(payload: AssignRolePayload): Promise<void> {
    console.log('UserManagementService: Assigning role', payload);
    
    const { error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: payload.user_id,
        role: payload.role,
        organization_id: payload.organization_id || null,
      });
    
    if (error) {
      console.error('UserManagementService: Error assigning role', error);
      throw error;
    }
  }

  /**
   * Removes a role from a user
   */
  static async removeRole(userId: string, role: UserRole): Promise<void> {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);
    
    if (error) {
      console.error('UserManagementService: Error removing role', error);
      throw error;
    }
  }

  /**
   * Checks if user has a specific role
   */
  static async hasRole(userId: string, role: UserRole): Promise<boolean> {
    console.log('UserManagementService: Checking role', userId, role);
    
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: role,
    });
    
    if (error) {
      console.error('UserManagementService: Error checking role', error);
      return false;
    }
    
    return data || false;
  }

  /**
   * Checks if user is super admin
   */
  static async isSuperAdmin(userId: string): Promise<boolean> {
    console.log('UserManagementService: Checking super admin', userId);
    
    const { data, error } = await supabase.rpc('is_super_admin', {
      _user_id: userId,
    });
    
    if (error) {
      console.error('UserManagementService: Error checking super admin', error);
      return false;
    }
    
    return data || false;
  }

  /**
   * Gets current user's role
   */
  static async getCurrentUserRole(): Promise<UserRole> {
    console.log('UserManagementService: Getting current user role');
    
    const { data, error } = await supabase.rpc('get_current_user_role');
    
    if (error) {
      console.error('UserManagementService: Error getting current role', error);
      return 'user';
    }
    
    return data || 'user';
  }
}
