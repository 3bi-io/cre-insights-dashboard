import { BaseFeatureService } from '@/features/shared/services/BaseFeatureService';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import type { Client, CreateClientData, UpdateClientData, ClientFilters } from '../types/client.types';

// Validation schemas
const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending']).default('active'),
});

const updateClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending']).default('active'),
});

const clientIdSchema = z.string().uuid('Invalid client ID');

export class ClientsService {
  constructor() {}

  async getClients(filters?: ClientFilters, organizationId?: string): Promise<{ data: Client[]; error: string | null }> {
    try {
      let query = supabase
        .from('clients')
        .select('*')
        .order('name');

      // Apply organization filter (defense in depth - RLS also enforces this)
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      // Apply search filter
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,company.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      // Apply status filter
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply location filter
      if (filters?.location) {
        query = query.or(`city.ilike.%${filters.location}%,state.ilike.%${filters.location}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching clients:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getClients:', error);
      return { data: [], error: 'Failed to fetch clients' };
    }
  }

  async createClient(data: CreateClientData): Promise<{ data: Client | null; error: string | null }> {
    try {
      // Validate input data
      const validatedData = createClientSchema.parse(data);

      const { data: result, error } = await supabase
        .from('clients')
        .insert(validatedData as any)
        .select()
        .single();

      if (error) {
        console.error('Error creating client:', error);
        return { data: null, error: error.message };
      }

      return { data: result, error: null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { data: null, error: error.errors[0].message };
      }
      console.error('Error in createClient:', error);
      return { data: null, error: 'Failed to create client' };
    }
  }

  async updateClient(id: string, data: UpdateClientData): Promise<{ data: Client | null; error: string | null }> {
    try {
      // Validate input data
      const validatedId = clientIdSchema.parse(id);
      const validatedData = updateClientSchema.parse(data);

      const { data: result, error } = await supabase
        .from('clients')
        .update(validatedData)
        .eq('id', validatedId)
        .select()
        .single();

      if (error) {
        console.error('Error updating client:', error);
        return { data: null, error: error.message };
      }

      return { data: result, error: null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { data: null, error: error.errors[0].message };
      }
      console.error('Error in updateClient:', error);
      return { data: null, error: 'Failed to update client' };
    }
  }

  async deleteClient(id: string): Promise<{ error: string | null }> {
    try {
      // Validate input data
      const validatedId = clientIdSchema.parse(id);

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', validatedId);

      if (error) {
        console.error('Error deleting client:', error);
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { error: error.errors[0].message };
      }
      console.error('Error in deleteClient:', error);
      return { error: 'Failed to delete client' };
    }
  }

  async getClientById(id: string): Promise<{ data: Client | null; error: string | null }> {
    try {
      // Validate input data
      const validatedId = clientIdSchema.parse(id);

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', validatedId)
        .single();

      if (error) {
        console.error('Error fetching client:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { data: null, error: error.errors[0].message };
      }
      console.error('Error in getClientById:', error);
      return { data: null, error: 'Failed to fetch client' };
    }
  }
}

// Export singleton instance
export const clientsService = new ClientsService();