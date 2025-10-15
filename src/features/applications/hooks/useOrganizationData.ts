import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Organization {
  id: string;
  name: string;
}

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
          .select('id, name')
          .order('name');
        
        if (!error && data) {
          setOrganizations(data);
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
