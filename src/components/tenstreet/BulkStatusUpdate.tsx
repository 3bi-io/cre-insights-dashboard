import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Database, AlertCircle } from 'lucide-react';
import { useBulkOperations } from '@/hooks/useBulkOperations';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function BulkStatusUpdate() {
  const { updateStatus, isUpdating } = useBulkOperations();
  const [applicantIds, setApplicantIds] = useState<string>('');
  const [companyId, setCompanyId] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'reviewing', label: 'Reviewing' },
    { value: 'interviewing', label: 'Interviewing' },
    { value: 'offer_extended', label: 'Offer Extended' },
    { value: 'hired', label: 'Hired' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'withdrawn', label: 'Withdrawn' }
  ];

  const handleUpdate = () => {
    const ids = applicantIds
      .split('\n')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (ids.length === 0 || !status || !companyId) return;

    updateStatus({ applicantIds: ids, status, companyId });
  };

  const idCount = applicantIds
    .split('\n')
    .filter((id) => id.trim().length > 0).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Bulk Status Update
        </CardTitle>
        <CardDescription>
          Update the status of multiple applicants at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Enter one applicant ID per line. This will update all matching applicants.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="company-id">Tenstreet Company ID</Label>
          <Input
            id="company-id"
            type="text"
            placeholder="Enter your Tenstreet Company ID"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="applicant-ids">
            Applicant IDs {idCount > 0 && `(${idCount} entered)`}
          </Label>
          <Textarea
            id="applicant-ids"
            placeholder="Enter applicant IDs, one per line&#10;Example:&#10;12345&#10;67890&#10;54321"
            value={applicantIds}
            onChange={(e) => setApplicantIds(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label>New Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleUpdate}
          disabled={idCount === 0 || !status || !companyId || isUpdating}
          className="w-full"
        >
          {isUpdating ? 'Updating...' : `Update ${idCount} Applicant${idCount !== 1 ? 's' : ''}`}
        </Button>
      </CardContent>
    </Card>
  );
}
