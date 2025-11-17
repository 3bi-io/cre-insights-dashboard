import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { generateCsvFromExcelData, ExcelRow } from '@/utils/csvApplicationImporter';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

const BulkApplicationImporter: React.FC = () => {
  const [processing, setProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { organization } = useAuth();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!organization) {
      toast.error('No organization found');
      return;
    }

    setProcessing(true);
    setImportResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const excelData = XLSX.utils.sheet_to_json<ExcelRow>(firstSheet);

      // Generate clean CSV
      const csvContent = generateCsvFromExcelData(excelData);
      
      // Import via edge function
      const { data: result, error } = await supabase.functions.invoke('import-applications', {
        body: {
          csv: csvContent,
          organizationId: organization.id,
        }
      });

      if (error) throw error;

      setImportResult(result);

      if (result.success && result.imported > 0) {
        toast.success(`Successfully imported ${result.imported} application(s)`);
      } else if (result.failed > 0) {
        toast.error(`Imported ${result.imported} application(s), ${result.failed} failed`);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process and import applications');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Import Facebook Leads to Database
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-2">
          <p>Upload CR England Facebook Lead Gen Excel file to import applications directly to the database.</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Automatically maps Facebook lead columns to application fields</li>
            <li>Assigns job listings by state (IL, MO, OR)</li>
            <li>Sets source to "Facebook Lead Gen"</li>
            <li>Imports directly to applications table</li>
          </ul>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            disabled={processing}
            className="text-sm"
            id="excel-import-input"
          />
          <label htmlFor="excel-import-input">
            <Button
              type="button"
              variant="outline"
              disabled={processing}
              asChild
            >
              <span>
                <Upload className="w-4 h-4 mr-2" />
                {processing ? 'Importing...' : 'Select Excel File'}
              </span>
            </Button>
          </label>
        </div>

        {processing && (
          <div className="space-y-2">
            <Progress value={undefined} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              Processing and importing applications...
            </p>
          </div>
        )}

        {importResult && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-destructive" />
              )}
              <h4 className="font-medium">Import Results</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Successfully Imported</p>
                <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-destructive">{importResult.failed}</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Errors:</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {importResult.errors.slice(0, 5).map((error, index) => (
                    <Alert key={index} variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Row {error.row}: {error.error}
                      </AlertDescription>
                    </Alert>
                  ))}
                  {importResult.errors.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      And {importResult.errors.length - 5} more errors...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkApplicationImporter;
