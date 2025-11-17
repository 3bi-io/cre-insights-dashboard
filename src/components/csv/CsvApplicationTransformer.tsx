import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { generateCsvFromExcelData, ExcelRow } from '@/utils/csvApplicationImporter';

const CsvApplicationTransformer: React.FC = () => {
  const [processing, setProcessing] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const excelData = XLSX.utils.sheet_to_json<ExcelRow>(firstSheet);

      // Generate clean CSV
      const csvContent = generateCsvFromExcelData(excelData);
      
      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cr-england-applications-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Transformed ${excelData.length} applications to clean CSV`);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process Excel file');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Transform Facebook Leads to CSV
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-2">
          <p>Upload CR England Facebook Lead Gen Excel file to transform it into a clean CSV for import.</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Automatically maps Facebook lead columns to application fields</li>
            <li>Assigns job listings by state (IL, MO, OR)</li>
            <li>Sets source to "Facebook Lead Gen"</li>
            <li>Preserves campaign tracking data</li>
          </ul>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            disabled={processing}
            className="text-sm"
            id="excel-file-input"
          />
          <label htmlFor="excel-file-input">
            <Button
              type="button"
              variant="outline"
              disabled={processing}
              asChild
            >
              <span>
                <Download className="w-4 h-4 mr-2" />
                {processing ? 'Processing...' : 'Select Excel File'}
              </span>
            </Button>
          </label>
        </div>

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
          <strong>Note:</strong> After generating the CSV, use the "Upload Job Listings (CSV)" 
          component to import the applications into the CR England organization.
        </div>
      </CardContent>
    </Card>
  );
};

export default CsvApplicationTransformer;
