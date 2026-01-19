import React, { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Send } from 'lucide-react';
import { DynamicCredentialsForm } from './DynamicCredentialsForm';
import { TestAutoPostDialog } from './TestAutoPostDialog';
import { 
  useATSSystems, 
  useCreateATSConnection, 
  useUpdateATSConnection,
  useTestATSConnection 
} from '@/hooks/useATSConnections';
import type { ATSConnection } from '@/services/atsConnectionsService';

interface ATSConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  clientId?: string | null;
  clientName?: string;
  connection?: ATSConnection | null;
  mode: 'create' | 'edit';
}

const AUTO_POST_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'interview', label: 'Interview Scheduled' },
  { value: 'hired', label: 'Hired' },
];

export const ATSConnectionDialog: React.FC<ATSConnectionDialogProps> = ({
  open,
  onOpenChange,
  organizationId,
  clientId,
  clientName,
  connection,
  mode,
}) => {
  const { data: atsSystems, isLoading: systemsLoading } = useATSSystems();
  const createConnection = useCreateATSConnection();
  const updateConnection = useUpdateATSConnection(organizationId);
  const testConnection = useTestATSConnection();

  const [selectedSystemId, setSelectedSystemId] = useState<string>('');
  const [name, setName] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [connectionMode, setConnectionMode] = useState<'test' | 'production'>('test');
  const [isAutoPostEnabled, setIsAutoPostEnabled] = useState(false);
  const [autoPostStatuses, setAutoPostStatuses] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showTestAutoPost, setShowTestAutoPost] = useState(false);

  const selectedSystem = atsSystems?.find(s => s.id === selectedSystemId);
  const isLoading = createConnection.isPending || updateConnection.isPending;
  const isTesting = testConnection.isPending;

  // Reset form when dialog opens/closes or connection changes
  useEffect(() => {
    if (open) {
      if (connection && mode === 'edit') {
        setSelectedSystemId(connection.ats_system_id);
        setName(connection.name);
        setCredentials(connection.credentials || {});
        setConnectionMode(connection.mode);
        setIsAutoPostEnabled(connection.is_auto_post_enabled || false);
        setAutoPostStatuses(connection.auto_post_on_status || []);
      } else {
        setSelectedSystemId('');
        setName('');
        setCredentials({});
        setConnectionMode('test');
        setIsAutoPostEnabled(false);
        setAutoPostStatuses([]);
      }
      setTestResult(null);
    }
  }, [open, connection, mode]);

  // Update name when system changes (for new connections)
  useEffect(() => {
    if (mode === 'create' && selectedSystem && !name) {
      const suffix = clientName ? ` - ${clientName}` : ' - Default';
      setName(`${selectedSystem.name}${suffix}`);
    }
  }, [selectedSystem, mode, clientName, name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSystemId || !name) return;

    try {
      if (mode === 'create') {
        await createConnection.mutateAsync({
          organization_id: organizationId,
          client_id: clientId || null,
          ats_system_id: selectedSystemId,
          name,
          credentials,
          mode: connectionMode,
          is_auto_post_enabled: isAutoPostEnabled,
          auto_post_on_status: autoPostStatuses.length > 0 ? autoPostStatuses : undefined,
        });
      } else if (connection) {
        await updateConnection.mutateAsync({
          connectionId: connection.id,
          data: {
            name,
            credentials,
            mode: connectionMode,
            is_auto_post_enabled: isAutoPostEnabled,
            auto_post_on_status: autoPostStatuses.length > 0 ? autoPostStatuses : undefined,
          },
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleTestConnection = async () => {
    if (!connection) return;
    
    setTestResult(null);
    const result = await testConnection.mutateAsync(connection.id);
    setTestResult(result);
  };

  const handleStatusToggle = (status: string, checked: boolean) => {
    if (checked) {
      setAutoPostStatuses(prev => [...prev, status]);
    } else {
      setAutoPostStatuses(prev => prev.filter(s => s !== status));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add ATS Connection' : 'Edit ATS Connection'}
          </DialogTitle>
          <DialogDescription>
            {clientId ? (
              <>Configure ATS credentials for <strong>{clientName}</strong></>
            ) : (
              'Configure organization-level ATS credentials (used as default for all clients)'
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ATS System Selection */}
          <div className="space-y-2">
            <Label htmlFor="ats-system">ATS System *</Label>
            <Select
              value={selectedSystemId}
              onValueChange={setSelectedSystemId}
              disabled={mode === 'edit' || systemsLoading}
            >
              <SelectTrigger id="ats-system">
                <SelectValue placeholder="Select ATS system" />
              </SelectTrigger>
              <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                {atsSystems?.map((system) => (
                  <SelectItem key={system.id} value={system.id}>
                    <div className="flex items-center gap-2">
                      {system.name}
                      {system.category && (
                        <Badge variant="secondary" className="text-xs">
                          {system.category}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Connection Name */}
          <div className="space-y-2">
            <Label htmlFor="connection-name">Connection Name *</Label>
            <Input
              id="connection-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for this connection"
            />
          </div>

          {/* Dynamic Credentials Form */}
          {selectedSystem && (
            <div className="space-y-2">
              <Label>Credentials</Label>
              <div className="border rounded-lg p-4 bg-muted/30">
                <DynamicCredentialsForm
                  schema={selectedSystem.credential_schema}
                  values={credentials}
                  onChange={setCredentials}
                />
              </div>
            </div>
          )}

          {/* Mode Selection */}
          <div className="space-y-2">
            <Label htmlFor="mode">Mode</Label>
            <Select
              value={connectionMode}
              onValueChange={(value) => setConnectionMode(value as 'test' | 'production')}
            >
              <SelectTrigger id="mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
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
            <p className="text-xs text-muted-foreground">
              {connectionMode === 'test' 
                ? 'Test mode - data won\'t be sent to the actual ATS' 
                : 'Production mode - data will be sent to the ATS'}
            </p>
          </div>

          {/* Auto-Post Settings */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-post">Auto-Post Applications</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically send applications to this ATS
                </p>
              </div>
              <Switch
                id="auto-post"
                checked={isAutoPostEnabled}
                onCheckedChange={setIsAutoPostEnabled}
              />
            </div>

            {isAutoPostEnabled && (
              <div className="space-y-2 pl-4 border-l-2 border-muted">
                <Label>Post when status changes to:</Label>
                <div className="grid grid-cols-2 gap-2">
                  {AUTO_POST_STATUSES.map((status) => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status.value}`}
                        checked={autoPostStatuses.includes(status.value)}
                        onCheckedChange={(checked) => 
                          handleStatusToggle(status.value, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`status-${status.value}`}
                        className="text-sm cursor-pointer"
                      >
                        {status.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Test Connection & Auto-Post Buttons (edit mode only) */}
          {mode === 'edit' && connection && (
            <div className="border-t pt-4 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                >
                  {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Test Connection
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTestAutoPost(true)}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Test Auto-Post
                </Button>
              </div>
              
              {testResult && (
                <div className={`flex items-center gap-2 text-sm ${
                  testResult.success ? 'text-green-600' : 'text-red-600'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {testResult.message}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedSystemId || !name}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Create Connection' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>

        {/* Test Auto-Post Dialog */}
        {connection && (
          <TestAutoPostDialog
            open={showTestAutoPost}
            onOpenChange={setShowTestAutoPost}
            connection={connection}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
