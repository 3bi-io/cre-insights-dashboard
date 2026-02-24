import React, { useState, useEffect } from 'react';
import AdminPageLayout from '@/features/shared/components/AdminPageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { firecrawlApi } from '@/lib/api/firecrawl';
import { supabase } from '@/integrations/supabase/client';
import { Briefcase, Palette, Map, Loader2, Copy, ExternalLink, Download, CheckCircle2 } from 'lucide-react';

const JOB_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    jobs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          company: { type: 'string' },
          location: { type: 'string' },
          pay_range: { type: 'string' },
          job_type: { type: 'string' },
          requirements: { type: 'array', items: { type: 'string' } },
          apply_url: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
  },
};

// ── Job Extractor Tab ──
const JobExtractorTab: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await firecrawlApi.scrape(url, {
        formats: [{ type: 'json', schema: JOB_EXTRACTION_SCHEMA, prompt: 'Extract all job listings from this page with title, company, location, pay range, job type, requirements, apply URL, and a brief description.' }],
      });
      if (res.success) {
        const jobs = res.data?.json || res.data?.data?.json;
        setResult(jobs);
        toast({ title: 'Extraction complete', description: `Found ${jobs?.jobs?.length ?? 0} job(s)` });
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to extract', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleExtract} className="flex gap-3">
        <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://carrier-site.com/careers" className="flex-1" required />
        <Button type="submit" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Extracting...</> : 'Extract Jobs'}
        </Button>
      </form>

      {result?.jobs && result.jobs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">{result.jobs.length} Job(s) Found</h3>
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}>
              <Copy className="mr-2 h-3 w-3" />Copy JSON
            </Button>
          </div>
          {result.jobs.map((job: any, i: number) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{job.title || 'Untitled'}</CardTitle>
                    <CardDescription>{job.company} · {job.location}</CardDescription>
                  </div>
                  {job.pay_range && <Badge variant="secondary">{job.pay_range}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {job.job_type && <p className="text-sm text-muted-foreground">Type: {job.job_type}</p>}
                {job.description && <p className="text-sm text-foreground">{job.description}</p>}
                {job.requirements?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {job.requirements.map((r: string, j: number) => (
                      <Badge key={j} variant="outline" className="text-xs">{r}</Badge>
                    ))}
                  </div>
                )}
                {job.apply_url && (
                  <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-primary hover:underline">
                    Apply <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {result && (!result.jobs || result.jobs.length === 0) && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No jobs found on this page. Try a different URL.</CardContent></Card>
      )}
    </div>
  );
};

// ── Job Import Tab ──
const JobImportTab: React.FC = () => {
  const [url, setUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState<Array<{ id: string; company: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<{ count: number } | null>(null);
  const { toast } = useToast();
  const { user, organization } = useAuth();

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase.from('clients').select('id, company').order('company');
      if (data) setClients(data);
    };
    fetchClients();
  }, []);

  const selectedClient = clients.find(c => c.id === clientId);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setPreview([]);
    setImportResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-job-import', {
        body: {
          url,
          client_id: clientId || null,
          client_name: selectedClient?.company || null,
          organization_id: organization?.id,
          user_id: user?.id,
          dry_run: true,
        },
      });
      if (error) throw error;
      if (data?.success) {
        setPreview(data.jobs || []);
        toast({ title: 'Preview ready', description: `Found ${data.jobs?.length || 0} job(s) with auto-categorization` });
      } else {
        toast({ title: 'Error', description: data?.error || 'Failed to scrape', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!organization?.id || !user?.id) {
      toast({ title: 'Error', description: 'Organization context required', variant: 'destructive' });
      return;
    }
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-job-import', {
        body: {
          url,
          client_id: clientId || null,
          client_name: selectedClient?.company || null,
          organization_id: organization.id,
          user_id: user.id,
          dry_run: false,
        },
      });
      if (error) throw error;
      if (data?.success) {
        setImportResult({ count: data.imported });
        toast({ title: 'Import complete!', description: `${data.imported} job(s) imported successfully` });
      } else {
        toast({ title: 'Error', description: data?.error || 'Import failed', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scrape & Import Jobs</CardTitle>
          <CardDescription>Paste a careers page URL, preview the extracted jobs with AI-powered categorization, then import them into your job listings.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePreview} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Careers Page URL</label>
                <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://hubgroup.com/careers" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Assign to Client</label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.company}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Scraping & Categorizing...</> : 'Preview Jobs'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {importResult && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-6 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold text-foreground">{importResult.count} job(s) imported successfully!</p>
              <p className="text-sm text-muted-foreground">Jobs are now active in your listings{selectedClient ? ` under ${selectedClient.company}` : ''}.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {preview.length > 0 && !importResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">{preview.length} Job(s) Ready to Import</h3>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing...</> : <><Download className="mr-2 h-4 w-4" />Import All Jobs</>}
            </Button>
          </div>
          {preview.map((job: any, i: number) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base">{job.title || 'Untitled'}</CardTitle>
                    <CardDescription>{[job.company, job.location].filter(Boolean).join(' · ')}</CardDescription>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {job.category_name && <Badge>{job.category_name}</Badge>}
                    {job.pay_range && <Badge variant="secondary">{job.pay_range}</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {job.job_type && <p className="text-sm text-muted-foreground">Type: {job.job_type}</p>}
                {job.description && <p className="text-sm text-foreground line-clamp-2">{job.description}</p>}
                {job.requirements?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {job.requirements.slice(0, 5).map((r: string, j: number) => (
                      <Badge key={j} variant="outline" className="text-xs">{r}</Badge>
                    ))}
                    {job.requirements.length > 5 && <Badge variant="outline" className="text-xs">+{job.requirements.length - 5} more</Badge>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Company Info Tab ──
const CompanyInfoTab: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await firecrawlApi.scrape(url, { formats: ['branding'] });
      if (res.success) {
        const branding = res.data?.branding || res.data?.data?.branding;
        setResult(branding);
        toast({ title: 'Branding extracted' });
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to extract', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleExtract} className="flex gap-3">
        <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://company.com" className="flex-1" required />
        <Button type="submit" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Extracting...</> : 'Extract Branding'}
        </Button>
      </form>

      {result && (
        <div className="grid gap-4 md:grid-cols-2">
          {result.logo && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Logo</CardTitle></CardHeader>
              <CardContent><img src={result.logo} alt="Logo" className="max-h-16 object-contain" /></CardContent>
            </Card>
          )}
          {result.colors && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Colors</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.colors).map(([name, hex]) => (
                    <div key={name} className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded border border-border" style={{ backgroundColor: hex as string }} />
                      <span className="text-xs text-muted-foreground">{name}: {hex as string}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {result.fonts && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Fonts</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.fonts.map((f: any, i: number) => (
                    <Badge key={i} variant="outline">{f.family || f}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          <Card className="md:col-span-2">
            <CardHeader><CardTitle className="text-sm">Raw Data</CardTitle></CardHeader>
            <CardContent>
              <pre className="bg-muted rounded p-3 text-xs overflow-auto max-h-60">{JSON.stringify(result, null, 2)}</pre>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}>
                <Copy className="mr-2 h-3 w-3" />Copy JSON
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// ── URL Explorer Tab ──
const UrlExplorerTab: React.FC = () => {
  const [url, setUrl] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const { toast } = useToast();

  const handleMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setLinks([]);
    try {
      const res = await firecrawlApi.map(url, { search: search || undefined, limit: 200 });
      if (res.success) {
        const foundLinks = res.data?.links || (res as any).links || [];
        setLinks(foundLinks);
        toast({ title: 'Mapping complete', description: `Found ${foundLinks.length} URL(s)` });
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to map', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleMap} className="flex gap-3">
        <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://company.com" className="flex-1" required />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter: careers, jobs..." className="w-48" />
        <Button type="submit" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mapping...</> : 'Map Site'}
        </Button>
      </form>

      {links.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm">{links.length} URLs Found</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(links.join('\n'))}>
              <Copy className="mr-2 h-3 w-3" />Copy All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto space-y-1">
              {links.map((link, i) => (
                <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline truncate py-0.5">
                  <ExternalLink className="h-3 w-3 shrink-0" />{link}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ── Main Page ──
const WebScraperPage: React.FC = () => {
  return (
    <AdminPageLayout
      title="Web Scraper"
      description="Extract job listings, company branding, and discover site URLs using Firecrawl"
      requiredRole={['admin', 'super_admin']}
    >
      <Tabs defaultValue="import" className="space-y-6">
        <TabsList>
          <TabsTrigger value="import" className="gap-2"><Download className="h-4 w-4" />Job Import</TabsTrigger>
          <TabsTrigger value="jobs" className="gap-2"><Briefcase className="h-4 w-4" />Job Extractor</TabsTrigger>
          <TabsTrigger value="branding" className="gap-2"><Palette className="h-4 w-4" />Company Info</TabsTrigger>
          <TabsTrigger value="map" className="gap-2"><Map className="h-4 w-4" />URL Explorer</TabsTrigger>
        </TabsList>
        <TabsContent value="import"><JobImportTab /></TabsContent>
        <TabsContent value="jobs"><JobExtractorTab /></TabsContent>
        <TabsContent value="branding"><CompanyInfoTab /></TabsContent>
        <TabsContent value="map"><UrlExplorerTab /></TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
};

export default WebScraperPage;
