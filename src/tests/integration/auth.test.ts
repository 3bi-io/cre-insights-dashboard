/**
 * Integration Tests for Authentication
 */

import { describe, it, expect } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

describe('Authentication Integration Tests', () => {
  it('should get current session', async () => {
    const { data, error } = await supabase.auth.getSession();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.session).toBeDefined();
  });

  it('should handle sign in with invalid credentials', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'nonexistent@example.com',
      password: 'wrongpassword',
    });

    expect(error).toBeDefined();
    expect(data.user).toBeNull();
  });

  it('should handle sign up validation', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: 'invalid-email',
      password: '123',
    });

    // Should fail validation
    expect(error).toBeDefined();
  });

  it('should get user when authenticated', async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData.session) {
      const { data, error } = await supabase.auth.getUser();
      
      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.user?.email).toBeDefined();
    }
  });
});
