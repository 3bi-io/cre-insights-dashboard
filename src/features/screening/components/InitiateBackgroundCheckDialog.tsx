import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  useBackgroundCheckConnections,
  useInitiateBackgroundCheck
} from '../hooks/useBackgroundChecks';
import type { BGCConnection } from '../services/BackgroundCheckService';

interface InitiateBackgroundCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  applicantName: string;
  organizationId: string;
}

const CHECK_TYPE_LABELS: Record<string, string> = {
  criminal: 'Criminal Background',
  mvr: 'Motor Vehicle Record',
  drug: 'Drug Screening',
  employment: 'Employment Verification',
  education: 'Education Verification',
  credit: 'Credit Check',
  identity: 'Identity Verification'
};

export function InitiateBackgroundCheckDialog({
  open,
  onOpenChange,
  applicationId,
  applicantName,
  organizationId
}: InitiateBackgroundCheckDialogProps) {
  const { data: connections, isLoading } = useBackgroundCheckConnections(organizationId);
  const initiateCheck = useInitiateBackgroundCheck();

  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('');
  const [selectedCheckTypes, setSelectedCheckTypes] = useState<string[]>([]);

  const enabledConnections = connections?.filter(c => c.is_enabled) || [];
  const selectedConnection = enabledConnections.find(c => c.id === selectedConnectionId);
  const availableCheckTypes = selectedConnection?.provider?.supported_checks || [];

  const handleCheckTypeToggle = (checkType: string) => {
    setSelectedCheckTypes(prev =>
      prev.includes(checkType)
        ? prev.filter(t => t !== checkType)
        : [...prev, checkType]
    );
  };

  const handleInitiate = async () => {
    if (!selectedConnectionId) {
      toast.error('Please select a provider');
      return;
    }
    if (selectedCheckTypes.length === 0) {
      toast.error('Please select at least one check type');
      return;
    }

    try {
      const result = await initiateCheck.mutateAsync({
        applicationId,
        checkType: selectedCheckTypes.join(','),
        providerId: selectedConnection?.provider_id
      });

      toast.success('Background check initiated', {
        description: result.candidatePortalUrl
          ? 'Candidate will receive an email with next steps'
          : `Check ID: ${result.externalId}`
      });

      onOpenChange(false);
      setSelectedConnectionId('');
      setSelectedCheckTypes([]);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedConnectionId('');
      setSelectedCheckTypes([]);
    }
    onOpenChange(open);
  };

  // Auto-select default connection
  if (!selectedConnectionId && enabledConnections.length > 0) {
    const defaultConn = enabledConnections.find(c => c.is_default) || enabledConnections[0];
    if (defaultConn) {
      setSelectedConnectionId(defaultConn.id);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Initiate Background Check
          </DialogTitle>
          <DialogDescription>
            Request a background check for {applicantName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : enabledConnections.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No background check providers are connected. Please connect a provider in settings first.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={selectedConnectionId}
                onValueChange={(v) => {
                  setSelectedConnectionId(v);
                  setSelectedCheckTypes([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {enabledConnections.map(conn => (
                    <SelectItem key={conn.id} value={conn.id}>
                      <div className="flex items-center gap-2">
                        {conn.provider?.name}
                        {conn.is_default && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedConnection && (
              <div className="space-y-2">
                <Label>Check Types</Label>
                <div className="grid grid-cols-2 gap-2">
                  {availableCheckTypes.map(checkType => (
                    <div
                      key={checkType}
                      className="flex items-center space-x-2 p-2 border rounded hover:bg-accent cursor-pointer"
                      onClick={() => handleCheckTypeToggle(checkType)}
                    >
                      <Checkbox
                        id={`check-${checkType}`}
                        checked={selectedCheckTypes.includes(checkType)}
                        onCheckedChange={() => handleCheckTypeToggle(checkType)}
                      />
                      <label
                        htmlFor={`check-${checkType}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {CHECK_TYPE_LABELS[checkType] || checkType}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCheckTypes.length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedCheckTypes.map(t => CHECK_TYPE_LABELS[t] || t).join(', ')}
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleInitiate}
            disabled={
              initiateCheck.isPending ||
              !selectedConnectionId ||
              selectedCheckTypes.length === 0
            }
          >
            {initiateCheck.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Initiate Check
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default InitiateBackgroundCheckDialog;
