import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download } from 'lucide-react';
import { useBulkOperations } from '@/hooks/useBulkOperations';

export default function BulkExport() {
  const { exportData, isExporting } = useBulkOperations();
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');
  const [companyId, setCompanyId] = useState<string>('');
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'firstName',
    'lastName',
    'email',
    'phone',
    'status'
  ]);

  const availableFields = [
    { id: 'firstName', label: 'First Name' },
    { id: 'lastName', label: 'Last Name' },
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'address', label: 'Address' },
    { id: 'city', label: 'City' },
    { id: 'state', label: 'State' },
    { id: 'zip', label: 'ZIP Code' },
    { id: 'status', label: 'Status' },
    { id: 'applicationDate', label: 'Application Date' }
  ];

  const toggleField = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleExport = () => {
    if (!companyId) return;
    exportData({
      format,
      companyId,
      filters: {
        fields: selectedFields
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Applicants
        </CardTitle>
        <CardDescription>
          Export applicant data from Tenstreet to CSV or Excel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Tenstreet Company ID</Label>
          <Input
            type="text"
            placeholder="Enter your Tenstreet Company ID"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Export Format</Label>
          <Select value={format} onValueChange={(value: any) => setFormat(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV (.csv)</SelectItem>
              <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Select Fields to Export</Label>
          <div className="grid grid-cols-2 gap-3">
            {availableFields.map((field) => (
              <div key={field.id} className="flex items-center space-x-2">
                <Checkbox
                  id={field.id}
                  checked={selectedFields.includes(field.id)}
                  onCheckedChange={() => toggleField(field.id)}
                />
                <Label
                  htmlFor={field.id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {field.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={handleExport}
          disabled={selectedFields.length === 0 || !companyId || isExporting}
          className="w-full"
        >
          {isExporting ? 'Exporting...' : 'Export Data'}
        </Button>
      </CardContent>
    </Card>
  );
}
