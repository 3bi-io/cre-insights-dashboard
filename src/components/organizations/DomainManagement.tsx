import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Globe, CheckCircle, XCircle, Clock, AlertTriangle, Copy, RefreshCw, Settings, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DomainManagementProps {
  organization: any;
  onUpdate: (orgId: string, updateData: any) => void;
}

const DomainManagement: React.FC<DomainManagementProps> = ({ organization, onUpdate }) => {
  const { toast } = useToast();
  const [newDomain, setNewDomain] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showDNSInstructions, setShowDNSInstructions] = useState(false);

  const getDomainStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'not_configured': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDomainStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getSSLStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'provisioning': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleConfigureDomain = async () => {
    if (!newDomain.trim()) {
      toast({
        title: "Error",
        description: "Please enter a domain name.",
        variant: "destructive",
      });
      return;
    }

    setIsConfiguring(true);
    try {
      const { data, error } = await supabase.functions.invoke('domain-configuration', {
        body: {
          organizationId: organization.id,
          domain: newDomain.toLowerCase().trim(),
          action: 'configure'
        }
      });

      if (error) throw error;

      onUpdate(organization.id, {
        domain: newDomain.toLowerCase().trim(),
        domain_status: 'pending',
        domain_verification_token: data.verificationToken,
        domain_dns_records: data.dnsRecords
      });

      setShowDNSInstructions(true);
      toast({
        title: "Domain configured",
        description: "Domain has been configured. Please set up DNS records to verify.",
      });
    } catch (error) {
      console.error('Error configuring domain:', error);
      toast({
        title: "Configuration failed",
        description: "Failed to configure domain. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleVerifyDomain = async () => {
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('domain-configuration', {
        body: {
          organizationId: organization.id,
          domain: organization.domain,
          action: 'verify'
        }
      });

      if (error) throw error;

      onUpdate(organization.id, {
        domain_status: data.verified ? 'active' : 'failed'
      });

      toast({
        title: data.verified ? "Domain verified" : "Verification failed",
        description: data.verified 
          ? "Domain has been successfully verified!" 
          : "Domain verification failed. Please check your DNS records.",
        variant: data.verified ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Error verifying domain:', error);
      toast({
        title: "Verification failed",
        description: "Failed to verify domain. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeployDomain = async () => {
    setIsDeploying(true);
    try {
      const { data, error } = await supabase.functions.invoke('domain-configuration', {
        body: {
          organizationId: organization.id,
          domain: organization.domain,
          action: 'deploy'
        }
      });

      if (error) throw error;

      onUpdate(organization.id, {
        domain_deployed_at: new Date().toISOString(),
        domain_ssl_status: 'provisioning'
      });

      toast({
        title: "Deployment initiated",
        description: "Domain deployment has been started. SSL certificate will be provisioned.",
      });
    } catch (error) {
      console.error('Error deploying domain:', error);
      toast({
        title: "Deployment failed",
        description: "Failed to deploy domain. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!confirm('Are you sure you want to remove this domain configuration? This action cannot be undone.')) {
      return;
    }

    try {
      await supabase.functions.invoke('domain-configuration', {
        body: {
          organizationId: organization.id,
          domain: organization.domain,
          action: 'remove'
        }
      });

      onUpdate(organization.id, {
        domain: null,
        domain_status: 'not_configured',
        domain_verification_token: null,
        domain_ssl_status: 'not_provisioned',
        domain_deployed_at: null,
        domain_dns_records: {}
      });

      toast({
        title: "Domain removed",
        description: "Domain configuration has been removed.",
      });
    } catch (error) {
      console.error('Error removing domain:', error);
      toast({
        title: "Removal failed",
        description: "Failed to remove domain configuration.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "DNS record value copied to clipboard.",
    });
  };

  const dnsRecords = organization.domain_dns_records || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Custom Domain Management
        </CardTitle>
        <CardDescription>
          Configure and deploy custom domains for this organization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!organization.domain ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain Name</Label>
              <div className="flex gap-2">
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                />
                <Button onClick={handleConfigureDomain} disabled={isConfiguring}>
                  {isConfiguring ? 'Configuring...' : 'Configure'}
                </Button>
              </div>
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Enter a domain name you own to configure custom domain access for this organization.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium flex items-center gap-2">
                  {organization.domain}
                  <Badge className={getDomainStatusColor(organization.domain_status)}>
                    {getDomainStatusIcon(organization.domain_status)}
                    {organization.domain_status}
                  </Badge>
                </h4>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {getSSLStatusIcon(organization.domain_ssl_status)}
                    SSL: {organization.domain_ssl_status}
                  </span>
                  {organization.domain_deployed_at && (
                    <span>
                      Deployed: {new Date(organization.domain_deployed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {organization.domain_status === 'pending' && (
                  <Button variant="outline" size="sm" onClick={handleVerifyDomain} disabled={isVerifying}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    {isVerifying ? 'Verifying...' : 'Verify'}
                  </Button>
                )}
                {organization.domain_status === 'active' && !organization.domain_deployed_at && (
                  <Button onClick={handleDeployDomain} disabled={isDeploying}>
                    {isDeploying ? 'Deploying...' : 'Deploy'}
                  </Button>
                )}
                <Dialog open={showDNSInstructions} onOpenChange={setShowDNSInstructions}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-1" />
                      DNS Setup
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>DNS Configuration</DialogTitle>
                      <DialogDescription>
                        Add these DNS records to your domain registrar to complete setup
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {Object.entries(dnsRecords).map(([type, records]: [string, any]) => (
                        <div key={type} className="space-y-2">
                          <h4 className="font-medium">{type.toUpperCase()} Records</h4>
                          {Array.isArray(records) ? records.map((record: any, index: number) => (
                            <div key={index} className="bg-muted p-3 rounded-lg">
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Name:</span>
                                  <p className="font-mono">{record.name}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Value:</span>
                                  <div className="flex items-center gap-2">
                                    <p className="font-mono text-xs">{record.value}</p>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(record.value)}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">TTL:</span>
                                  <p className="font-mono">{record.ttl || '3600'}</p>
                                </div>
                              </div>
                            </div>
                          )) : (
                            <div className="bg-muted p-3 rounded-lg">
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Name:</span>
                                  <p className="font-mono">{records.name}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Value:</span>
                                  <div className="flex items-center gap-2">
                                    <p className="font-mono text-xs">{records.value}</p>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(records.value)}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">TTL:</span>
                                  <p className="font-mono">{records.ttl || '3600'}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      <Separator />
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          DNS changes can take up to 48 hours to propagate. Once configured, use the Verify button to check if your domain is ready.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" onClick={handleRemoveDomain} className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {organization.domain_status === 'active' && organization.domain_deployed_at && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Domain is active and deployed! Your organization is accessible at{' '}
                  <a 
                    href={`https://${organization.domain}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium underline"
                  >
                    https://{organization.domain}
                  </a>
                </AlertDescription>
              </Alert>
            )}

            {organization.domain_status === 'failed' && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Domain verification failed. Please check your DNS records and try verifying again.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DomainManagement;