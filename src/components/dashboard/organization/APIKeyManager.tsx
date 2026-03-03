import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Key, Plus, Trash2, Eye, EyeOff, Globe, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const SUPABASE_URL = "https://auwhcdpppldjlcaxzsme.supabase.co";

export const APIKeyManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [newLabel, setNewLabel] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [editingOrigins, setEditingOrigins] = useState<string | null>(null);
  const [newOrigin, setNewOrigin] = useState('');

  const { data: keys, isLoading } = useQuery({
    queryKey: ['org-api-keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_api_keys')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createKey = useMutation({
    mutationFn: async (label: string) => {
      const { data: profile } = await supabase.from('profiles').select('organization_id').single();
      if (!profile?.organization_id) throw new Error('No organization found');

      const { data, error } = await supabase
        .from('org_api_keys')
        .insert({ organization_id: profile.organization_id, label: label || 'Default' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['org-api-keys'] });
      setNewLabel('');
      setVisibleKeys(prev => new Set(prev).add(data.id));
      toast.success('API key created! Copy it now — it won\'t be shown in full again.');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('org_api_keys').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-api-keys'] });
      toast.success('API key revoked');
    },
  });

  const updateOrigins = useMutation({
    mutationFn: async ({ id, origins }: { id: string; origins: string[] }) => {
      const { error } = await supabase
        .from('org_api_keys')
        .update({ allowed_origins: origins } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-api-keys'] });
      toast.success('Allowed origins updated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const maskKey = (key: string) => key.substring(0, 8) + '••••••••••••••••' + key.substring(key.length - 4);

  const addOrigin = (keyId: string, currentOrigins: string[]) => {
    const origin = newOrigin.trim();
    if (!origin) return;
    
    // Basic URL validation
    try {
      const url = new URL(origin);
      const normalized = `${url.protocol}//${url.host}`;
      if (currentOrigins.includes(normalized)) {
        toast.error('Origin already added');
        return;
      }
      updateOrigins.mutate({ id: keyId, origins: [...currentOrigins, normalized] });
      setNewOrigin('');
    } catch {
      toast.error('Invalid URL. Use format: https://example.com');
    }
  };

  const removeOrigin = (keyId: string, currentOrigins: string[], originToRemove: string) => {
    updateOrigins.mutate({ id: keyId, origins: currentOrigins.filter(o => o !== originToRemove) });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          External API Keys
        </CardTitle>
        <CardDescription>
          Generate API keys for external websites to fetch your organization's data. Configure allowed origins per key for secure cross-origin access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create new key */}
        <div className="flex gap-2">
          <Input
            placeholder="Key label (e.g. mycompany.com)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="max-w-xs"
          />
          <Button
            onClick={() => createKey.mutate(newLabel)}
            disabled={createKey.isPending}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Generate Key
          </Button>
        </div>

        {/* API endpoint reference */}
        <div className="rounded-md bg-muted p-4 text-sm space-y-1">
          <p className="font-medium">API Endpoints:</p>
          <code className="block text-xs text-muted-foreground">GET {SUPABASE_URL}/functions/v1/organization-api/clients</code>
          <code className="block text-xs text-muted-foreground">GET {SUPABASE_URL}/functions/v1/organization-api/jobs?client_id=...</code>
          <code className="block text-xs text-muted-foreground">GET {SUPABASE_URL}/functions/v1/organization-api/applications?client_id=...&status=...</code>
          <code className="block text-xs text-muted-foreground">GET {SUPABASE_URL}/functions/v1/organization-api/stats</code>
          <p className="text-xs text-muted-foreground mt-2">Include header: <code>x-api-key: your_key_here</code></p>
        </div>

        {/* Existing keys */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (keys || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No API keys yet. Generate one above.</p>
        ) : (
          <div className="space-y-4">
            {(keys || []).map((key: any) => {
              const origins: string[] = (key as any).allowed_origins || [];
              const isEditingThis = editingOrigins === key.id;

              return (
                <div key={key.id} className="rounded-md border p-4 space-y-3">
                  {/* Key info row */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{key.label}</span>
                        <Badge variant={key.is_active ? 'default' : 'secondary'}>
                          {key.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <code className="block text-xs font-mono text-muted-foreground truncate">
                        {visibleKeys.has(key.id) ? key.api_key : maskKey(key.api_key)}
                      </code>
                      <p className="text-xs text-muted-foreground">
                        Created {format(new Date(key.created_at), 'MMM d, yyyy')}
                        {key.last_used_at && ` • Last used ${format(new Date(key.last_used_at), 'MMM d, yyyy h:mm a')}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => toggleVisibility(key.id)} title="Toggle visibility">
                        {visibleKeys.has(key.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(key.api_key)} title="Copy key">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingOrigins(isEditingThis ? null : key.id)}
                        title="Manage allowed origins"
                      >
                        <Globe className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteKey.mutate(key.id)}
                        disabled={deleteKey.isPending}
                        title="Revoke key"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Allowed origins section */}
                  {isEditingThis && (
                    <div className="border-t pt-3 space-y-2">
                      <p className="text-xs font-medium flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Allowed Origins
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Add the domains that can use this API key. If no origins are configured, cross-origin requests will be denied.
                      </p>
                      
                      {/* Current origins */}
                      {origins.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {origins.map((o) => (
                            <Badge key={o} variant="outline" className="gap-1 text-xs">
                              {o}
                              <button
                                onClick={() => removeOrigin(key.id, origins, o)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Add origin */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://yoursite.com"
                          value={newOrigin}
                          onChange={(e) => setNewOrigin(e.target.value)}
                          className="max-w-xs text-xs h-8"
                          onKeyDown={(e) => e.key === 'Enter' && addOrigin(key.id, origins)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => addOrigin(key.id, origins)}
                          disabled={updateOrigins.isPending}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Show origin count when not editing */}
                  {!isEditingThis && origins.length > 0 && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {origins.length} allowed origin{origins.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
