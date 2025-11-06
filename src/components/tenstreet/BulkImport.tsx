import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useBulkOperations } from '@/hooks/useBulkOperations';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function BulkImport() {
  const { importData, isImporting } = useBulkOperations();
  const [file, setFile] = useState<File | null>(null);
  const [companyId, setCompanyId] = useState<string>('');
  const [mappings, setMappings] = useState<Record<string, string>>({
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    phone: 'phone'
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file || !companyId) return;
    importData({ file, mappings, companyId });
  };

  const fieldOptions = [
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'address', label: 'Address' },
    { value: 'city', label: 'City' },
    { value: 'state', label: 'State' },
    { value: 'zip', label: 'ZIP Code' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Applicants
        </CardTitle>
        <CardDescription>
          Upload a CSV or Excel file to import applicants into Tenstreet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Supported formats: CSV, XLSX. Maximum file size: 10MB
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
          <Label htmlFor="file">Select File</Label>
          <div className="flex gap-2">
            <Input
              id="file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="flex-1"
            />
            {file && (
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                <FileSpreadsheet className="h-4 w-4" />
                <span className="text-sm">{file.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Label>Field Mappings</Label>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(mappings).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                <Select
                  value={value}
                  onValueChange={(newValue) =>
                    setMappings({ ...mappings, [key]: newValue })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={handleImport}
          disabled={!file || !companyId || isImporting}
          className="w-full"
        >
          {isImporting ? 'Importing...' : 'Import Data'}
        </Button>
      </CardContent>
    </Card>
  );
}
