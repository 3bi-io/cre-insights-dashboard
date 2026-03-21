import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Globe, MapPin, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GeoExpandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobIds?: string[];
  clientId?: string;
  onSuccess?: () => void;
}

interface DryRunResult {
  total_new: number;
  jobs: Array<{
    parent_title: string;
    parent_id: string;
    coverage_set: string;
    new_count: number;
    states: string[];
  }>;
}

const COVERAGE_LABELS: Record<string, string> = {
  otr: 'OTR (35 states)',
  regional: 'Regional (20 states)',
  team_otr: 'Team OTR (18 states)',
  reefer: 'Reefer Corridor (20 states)',
};

export const GeoExpandDialog: React.FC<GeoExpandDialogProps> = ({
  open,
  onOpenChange,
  jobIds,
  clientId,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [preview, setPreview] = useState<DryRunResult | null>(null);
  const [coverageOverride, setCoverageOverride] = useState<string | undefined>();
  const [result, setResult] = useState<{ total_inserted: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setPreview(null);
      setResult(null);
      setCoverageOverride(undefined);
      fetchPreview();
    }
  }, [open, jobIds, clientId]);

  const fetchPreview = async (override?: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await supabase.functions.invoke('job-geo-expand', {
        body: {
          job_ids: jobIds,
          client_id: clientId,
          dry_run: true,
          coverage_override: override || coverageOverride,
        },
      });

      if (res.error) throw new Error(res.error.message);
      setPreview(res.data as DryRunResult);
    } catch (err: any) {
      toast({ title: 'Preview failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    try {
      const res = await supabase.functions.invoke('job-geo-expand', {
        body: {
          job_ids: jobIds,
          client_id: clientId,
          dry_run: false,
          coverage_override: coverageOverride,
        },
      });

      if (res.error) throw new Error(res.error.message);
      const data = res.data as { total_inserted: number };
      setResult(data);
      toast({
        title: 'Geo Expansion Complete',
        description: `${data.total_inserted} new state-level listings created`,
      });
      onSuccess?.();
    } catch (err: any) {
      toast({ title: 'Expansion failed', description: err.message, variant: 'destructive' });
    } finally {
      setExecuting(false);
    }
  };

  const handleCoverageChange = (value: string) => {
    setCoverageOverride(value === 'auto' ? undefined : value);
    fetchPreview(value === 'auto' ? undefined : value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" aria-describedby="geo-expand-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Geo Expand Job Listings
          </DialogTitle>
          <DialogDescription id="geo-expand-desc">
            Clone jobs into state-specific variants for maximum search visibility.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
            <p className="text-lg font-semibold">{result.total_inserted} listings created</p>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Analyzing jobs...</span>
          </div>
        ) : preview ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Coverage Set</span>
              <Select
                value={coverageOverride || 'auto'}
                onValueChange={handleCoverageChange}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  <SelectItem value="otr">OTR (35 states)</SelectItem>
                  <SelectItem value="regional">Regional (20 states)</SelectItem>
                  <SelectItem value="team_otr">Team OTR (18 states)</SelectItem>
                  <SelectItem value="reefer">Reefer (20 states)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 max-h-[300px] overflow-y-auto">
              {preview.jobs.map((job) => (
                <div key={job.parent_id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate flex-1">{job.parent_title}</p>
                    <Badge variant="secondary" className="ml-2 shrink-0">
                      +{job.new_count}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {COVERAGE_LABELS[job.coverage_set] || job.coverage_set}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-center">
              <p className="text-2xl font-bold text-primary">{preview.total_new}</p>
              <p className="text-sm text-muted-foreground">new listings will be created</p>
            </div>

            {preview.total_new === 0 && (
              <p className="text-sm text-muted-foreground text-center">
                All state variants already exist. Nothing to expand.
              </p>
            )}
          </div>
        ) : null}

        {preview && !result && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExecute}
              disabled={executing || preview.total_new === 0}
            >
              {executing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Expand Now
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GeoExpandDialog;
