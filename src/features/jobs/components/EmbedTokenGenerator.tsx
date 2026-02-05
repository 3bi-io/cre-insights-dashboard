/**
 * Embed Token Generator Component
 * 
 * Allows admins to create and manage embed tokens for job listings,
 * providing widget code snippets for external website integration.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Code, Plus, Trash2, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useEmbedTokensForJob,
  useCreateEmbedToken,
  useDeleteEmbedToken,
  useToggleEmbedTokenActive,
  generateWidgetCode,
  type EmbedToken,
} from '@/hooks/useEmbedTokens';
import { EmbedCodeSnippet } from './EmbedCodeSnippet';

interface EmbedTokenGeneratorProps {
  jobListingId: string;
  organizationId: string;
  jobTitle?: string;
}

export function EmbedTokenGenerator({
  jobListingId,
  organizationId,
  jobTitle,
}: EmbedTokenGeneratorProps) {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<EmbedToken | null>(null);

  // Form state for new token
  const [utmSource, setUtmSource] = useState('widget');
  const [utmMedium, setUtmMedium] = useState('embed');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [allowedDomains, setAllowedDomains] = useState('');

  const { data: tokens, isLoading } = useEmbedTokensForJob(jobListingId);
  const createToken = useCreateEmbedToken();
  const deleteToken = useDeleteEmbedToken();
  const toggleActive = useToggleEmbedTokenActive();

  const handleCreateToken = () => {
    const domains = allowedDomains
      .split(',')
      .map(d => d.trim())
      .filter(d => d.length > 0);

    createToken.mutate(
      {
        job_listing_id: jobListingId,
        organization_id: organizationId,
        utm_source: utmSource || 'widget',
        utm_medium: utmMedium || 'embed',
        utm_campaign: utmCampaign || undefined,
        allowed_domains: domains.length > 0 ? domains : undefined,
      },
      {
        onSuccess: (newToken) => {
          setIsCreateDialogOpen(false);
          setSelectedToken(newToken);
          // Reset form
          setUtmSource('widget');
          setUtmMedium('embed');
          setUtmCampaign('');
          setAllowedDomains('');
        },
      }
    );
  };

  const handleCopyCode = (token: string) => {
    const code = generateWidgetCode(token);
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied!',
      description: 'Widget code copied to clipboard.',
    });
  };

  const handleDeleteToken = (tokenId: string) => {
    if (confirm('Are you sure you want to delete this embed token? Any websites using this token will no longer work.')) {
      deleteToken.mutate(tokenId);
      if (selectedToken?.id === tokenId) {
        setSelectedToken(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Embed Widgets</h3>
          <p className="text-sm text-muted-foreground">
            Create embeddable application forms for external websites
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Widget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Embed Widget</DialogTitle>
              <DialogDescription>
                Generate a widget code snippet that can be embedded on external websites.
                The application form URL will be hidden from visitors.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="utm_source">UTM Source</Label>
                  <Input
                    id="utm_source"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    placeholder="widget"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utm_medium">UTM Medium</Label>
                  <Input
                    id="utm_medium"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    placeholder="embed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="utm_campaign">UTM Campaign (optional)</Label>
                <Input
                  id="utm_campaign"
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                  placeholder="summer_2025"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowed_domains">
                  Allowed Domains (optional)
                </Label>
                <Input
                  id="allowed_domains"
                  value={allowedDomains}
                  onChange={(e) => setAllowedDomains(e.target.value)}
                  placeholder="example.com, *.company.com"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list. Use *.domain.com for subdomains. Leave empty to allow any domain.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateToken} disabled={createToken.isPending}>
                {createToken.isPending ? 'Creating...' : 'Create Widget'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading tokens...</div>
      ) : tokens && tokens.length > 0 ? (
        <div className="space-y-3">
          {tokens.map((token) => (
            <Card key={token.id} className={!token.is_active ? 'opacity-60' : ''}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                        {token.token}
                      </code>
                      {!token.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-x-3">
                      <span>Source: {token.utm_source}</span>
                      <span>•</span>
                      <span>Medium: {token.utm_medium}</span>
                      {token.utm_campaign && (
                        <>
                          <span>•</span>
                          <span>Campaign: {token.utm_campaign}</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {token.impression_count} impressions
                      {token.allowed_domains && token.allowed_domains.length > 0 && (
                        <span className="ml-2">
                          • Restricted to: {token.allowed_domains.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActive.mutate(token)}
                      title={token.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {token.is_active ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedToken(token)}
                      title="View code"
                    >
                      <Code className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyCode(token.token)}
                      title="Copy code"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteToken(token.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Code className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="font-medium mb-1">No embed widgets yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Create a widget to embed application forms on external websites.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Widget
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Code snippet dialog */}
      <Dialog open={!!selectedToken} onOpenChange={() => setSelectedToken(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Embed Code</DialogTitle>
            <DialogDescription>
              Copy this code and paste it into your website where you want the application form to appear.
            </DialogDescription>
          </DialogHeader>
          
          {selectedToken && (
            <EmbedCodeSnippet token={selectedToken.token} jobTitle={jobTitle} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
