import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Search, CheckCircle2, AlertTriangle, Truck } from 'lucide-react';
import { DynamicCredentialsForm } from '@/features/ats/components/DynamicCredentialsForm';
import { useATSSystems, useCreateATSConnection } from '@/hooks/useATSConnections';
import { useToast } from '@/hooks/use-toast';
import type { Client } from '../types/client.types';

interface BulkTenstreetAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  clients: Client[];
}

interface BulkProgress {
  current: number;
  total: number;
  percentage: number;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  successCount: number;
  failureCount: number;
}

export const BulkTenstreetAssignmentDialog: React.FC<BulkTenstreetAssignmentDialogProps> = ({
  open,
  onOpenChange,
  organizationId,
  clients,
}) => {
  const { toast } = useToast();
  const { data: atsSystems } = useATSSystems();
  const createConnection = useCreateATSConnection();

  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [connectionMode, setConnectionMode] = useState<'test' | 'production'>('test');
  const [progress, setProgress] = useState<BulkProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    status: 'idle',
    successCount: 0,
    failureCount: 0,
  });

  // Find Tenstreet system
  const tenstreetSystem = atsSystems?.find(s => s.slug === 'tenstreet');

  // Deduplicate clients by name and filter by search
  const uniqueClients = useMemo(() => {
    const seen = new Map<string, Client>();
    clients.forEach(client => {
      if (!seen.has(client.name)) {
        seen.set(client.name, client);
      }
    });
    return Array.from(seen.values())
      .filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, searchTerm]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(new Set(uniqueClients.map(c => c.id)));
    } else {
      setSelectedClients(new Set());
    }
  };

  const handleSelectClient = (clientId: string, checked: boolean) => {
    setSelectedClients(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(clientId);
      } else {
        newSet.delete(clientId);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (!tenstreetSystem || selectedClients.size === 0) return;

    const clientIds = Array.from(selectedClients);
    
    setProgress({
      current: 0,
      total: clientIds.length,
      percentage: 0,
      status: 'processing',
      successCount: 0,
      failureCount: 0,
    });

    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < clientIds.length; i++) {
      const clientId = clientIds[i];
      const client = clients.find(c => c.id === clientId);
      
      try {
        await createConnection.mutateAsync({
          organization_id: organizationId,
          client_id: clientId,
          ats_system_id: tenstreetSystem.id,
          name: `Tenstreet - ${client?.name || clientId.slice(0, 8)}`,
          credentials,
          mode: connectionMode,
          is_auto_post_enabled: false,
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to create connection for client ${clientId}:`, error);
        failureCount++;
      }

      setProgress({
        current: i + 1,
        total: clientIds.length,
        percentage: Math.round(((i + 1) / clientIds.length) * 100),
        status: 'processing',
        successCount,
        failureCount,
      });
    }

    setProgress(prev => ({
      ...prev,
      status: failureCount > 0 ? 'failed' : 'completed',
    }));

    if (failureCount === 0) {
      toast({
        title: 'Bulk Assignment Complete',
        description: `Successfully assigned Tenstreet credentials to ${successCount} client${successCount === 1 ? '' : 's'}`,
      });
      onOpenChange(false);
      resetForm();
    } else {
      toast({
        title: 'Bulk Assignment Partially Failed',
        description: `Assigned ${successCount}, failed ${failureCount}`,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setSelectedClients(new Set());
    setSearchTerm('');
    setCredentials({});
    setConnectionMode('test');
    setProgress({
      current: 0,
      total: 0,
      percentage: 0,
      status: 'idle',
      successCount: 0,
      failureCount: 0,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const isProcessing = progress.status === 'processing';
  const allSelected = uniqueClients.length > 0 && selectedClients.size === uniqueClients.length;
  const someSelected = selectedClients.size > 0 && selectedClients.size < uniqueClients.length;

  if (!tenstreetSystem) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Bulk Tenstreet Credential Assignment
          </DialogTitle>
          <DialogDescription>
            Assign the same Tenstreet credentials to multiple clients at once.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Credentials Form */}
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <Label className="text-sm font-medium">Tenstreet Credentials</Label>
            <DynamicCredentialsForm
              schema={tenstreetSystem.credential_schema}
              values={credentials}
              onChange={setCredentials}
            />
            
            {/* Mode Selection */}
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select
                value={connectionMode}
                onValueChange={(value) => setConnectionMode(value as 'test' | 'production')}
                disabled={isProcessing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Test Mode
                    </div>
                  </SelectItem>
                  <SelectItem value="production">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Production
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client Selection */}
          <div className="flex-1 overflow-hidden flex flex-col border rounded-lg">
            <div className="p-3 border-b bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Select Clients ({selectedClients.size} selected)
                </Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    disabled={isProcessing}
                    className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                  />
                  <label htmlFor="select-all" className="text-sm cursor-pointer">
                    Select All
                  </label>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  disabled={isProcessing}
                />
              </div>
            </div>
            
            <ScrollArea className="flex-1 max-h-[200px]">
              <div className="p-2 space-y-1">
                {uniqueClients.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No clients found
                  </p>
                ) : (
                  uniqueClients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                    >
                      <Checkbox
                        id={`client-${client.id}`}
                        checked={selectedClients.has(client.id)}
                        onCheckedChange={(checked) => 
                          handleSelectClient(client.id, checked as boolean)
                        }
                        disabled={isProcessing}
                      />
                      <label
                        htmlFor={`client-${client.id}`}
                        className="flex-1 text-sm cursor-pointer"
                      >
                        {client.name}
                      </label>
                      <Badge variant="outline" className="text-xs">
                        {client.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Progress */}
          {progress.status !== 'idle' && (
            <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {progress.status === 'processing' ? 'Assigning credentials...' : 
                   progress.status === 'completed' ? 'Complete!' : 'Completed with errors'}
                </span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <Progress value={progress.percentage} />
              {progress.status !== 'processing' && (
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="text-green-600">✓ {progress.successCount} succeeded</span>
                  {progress.failureCount > 0 && (
                    <span className="text-red-600">✗ {progress.failureCount} failed</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isProcessing}
          >
            {progress.status === 'completed' || progress.status === 'failed' ? 'Close' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || selectedClients.size === 0 || Object.keys(credentials).length === 0}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign to {selectedClients.size} Client{selectedClients.size === 1 ? '' : 's'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
