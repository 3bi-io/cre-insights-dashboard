import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { exportToCSV, exportToPDF } from '@/utils/exportData';

interface ExportableData {
  [key: string]: string | number | boolean | null | undefined;
}

interface ExportDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ExportableData[];
  availableFields: string[];
  defaultFields?: string[];
  filename: string;
  title: string;
}

export function ExportDataDialog({
  open,
  onOpenChange,
  data,
  availableFields,
  defaultFields = [],
  filename,
  title
}: ExportDataDialogProps) {
  const { toast } = useToast();
  const [selectedFields, setSelectedFields] = useState<string[]>(
    defaultFields.length > 0 ? defaultFields : availableFields
  );
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

  const handleFieldToggle = (field: string) => {
    setSelectedFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const handleSelectAll = () => {
    setSelectedFields(availableFields);
  };

  const handleDeselectAll = () => {
    setSelectedFields([]);
  };

  const handleExport = () => {
    if (selectedFields.length === 0) {
      toast({
        title: 'No fields selected',
        description: 'Please select at least one field to export',
        variant: 'destructive'
      });
      return;
    }

    // Filter data to only include selected fields
    const filteredData = data.map(item => {
      const filtered: Record<string, unknown> = {};
      selectedFields.forEach(field => {
        filtered[field] = item[field];
      });
      return filtered;
    });

    try {
      if (exportFormat === 'csv') {
        exportToCSV(filteredData, {
          filename: `${filename}.csv`,
          headers: selectedFields
        });
      } else {
        exportToPDF(filteredData, {
          filename: `${filename}.pdf`,
          headers: selectedFields,
          title
        });
      }

      toast({
        title: 'Export successful',
        description: `Data exported as ${exportFormat.toUpperCase()}`
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'An error occurred while exporting data',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Select fields to include in the export and choose a format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Export Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <div className="flex gap-2">
              <Button
                variant={exportFormat === 'csv' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExportFormat('csv')}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                CSV
              </Button>
              <Button
                variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExportFormat('pdf')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>

          {/* Field Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Fields ({selectedFields.length} of {availableFields.length})</Label>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAll}
                >
                  Deselect All
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg max-h-60 overflow-y-auto">
              {availableFields.map(field => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox
                    id={field}
                    checked={selectedFields.includes(field)}
                    onCheckedChange={() => handleFieldToggle(field)}
                  />
                  <label
                    htmlFor={field}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="text-sm text-muted-foreground">
            Exporting {data.length} record{data.length !== 1 ? 's' : ''} with {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export {exportFormat.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
