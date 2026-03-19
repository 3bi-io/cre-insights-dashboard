import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FieldConfig {
  enabled: boolean;
  required: boolean;
}

export type FieldConfigMap = Record<string, FieldConfig>;

/**
 * Default: all fields enabled, none required (backward compatible).
 * When config rows exist for a client, those override defaults.
 */
const DEFAULT_FIELD: FieldConfig = { enabled: true, required: false };

export const useClientFieldConfig = (clientId: string | null) => {
  const [configMap, setConfigMap] = useState<FieldConfigMap>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!clientId) {
      setConfigMap({});
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const fetchConfig = async () => {
      const { data, error } = await supabase.rpc('get_client_application_fields', {
        p_client_id: clientId,
      });

      if (cancelled) return;

      if (!error && data && Array.isArray(data)) {
        const map: FieldConfigMap = {};
        for (const row of data) {
          map[row.field_key] = { enabled: row.enabled, required: row.required };
        }
        setConfigMap(map);
      }
      setIsLoading(false);
    };

    fetchConfig();
    return () => { cancelled = true; };
  }, [clientId]);

  /** Returns field config — defaults to enabled if no config row exists */
  const getFieldConfig = useMemo(() => {
    return (fieldKey: string): FieldConfig => {
      return configMap[fieldKey] || DEFAULT_FIELD;
    };
  }, [configMap]);

  /** Shorthand: is the field visible? */
  const isFieldEnabled = useMemo(() => {
    return (fieldKey: string): boolean => {
      const config = configMap[fieldKey];
      return config ? config.enabled : true;
    };
  }, [configMap]);

  /** Shorthand: is the field required? (only if also enabled) */
  const isFieldRequired = useMemo(() => {
    return (fieldKey: string): boolean => {
      const config = configMap[fieldKey];
      return config ? (config.enabled && config.required) : false;
    };
  }, [configMap]);

  return { configMap, isLoading, getFieldConfig, isFieldEnabled, isFieldRequired };
};
