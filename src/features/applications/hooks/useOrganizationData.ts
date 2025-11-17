import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Organization } from '@/types/common.types';

export const useOrganizationData = (isSuperAdmin: boolean) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) return;

    const fetchOrganizations = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, slug, created_at, updated_at')
          .order('name');
        
        if (!error && data) {
          setOrganizations(data as Organization[]);
        }
      } catch (err) {
        console.error('Error fetching organizations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [isSuperAdmin]);

  return { organizations, loading };
};
