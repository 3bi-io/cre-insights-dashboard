import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, FileSpreadsheet, Image, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface ExportSection {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const exportSections: ExportSection[] = [
  {
    id: 'performance',
    label: 'AI Performance Metrics',
    description: 'Model accuracy, processing speed, and system statistics',
    enabled: true,
  },
  {
    id: 'predictions',
    label: 'Predictive Analytics',
    description: 'Hiring forecasts, trends, and cost predictions',
    enabled: true,
  },
  {
    id: 'comparison',
    label: 'Comparative Analysis',
    description: 'AI vs traditional recruiting metrics',
    enabled: true,
  },
  {
    id: 'bias',
    label: 'Bias & Fairness Analysis',
    description: 'Fairness metrics and diversity tracking',
    enabled: false,
  },
  {
    id: 'insights',
    label: 'Model Insights',
    description: 'Feature importance and model explanations',
    enabled: false,
  },
  {
    id: 'candidate_data',
    label: 'Candidate Scores',
    description: 'Individual candidate rankings and analysis',
    enabled: false,
  },
];

export const ExportAnalytics: React.FC = () => {
  const [sections, setSections] = useState<ExportSection[]>(exportSections);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [isExporting, setIsExporting] = useState(false);

  const toggleSection = (id: string) => {
    setSections(sections.map(section => 
      section.id === id ? { ...section, enabled: !section.enabled } : section
    ));
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));

    const enabledSections = sections.filter(s => s.enabled);
    const formatLabels = {
      pdf: 'PDF Report',
      csv: 'CSV Data',
      excel: 'Excel Workbook'
    };

    toast.success(`Export Complete`, {
      description: `${formatLabels[exportFormat]} with ${enabledSections.length} sections has been downloaded successfully.`
    });

    setIsExporting(false);
  };

  const enabledCount = sections.filter(s => s.enabled).length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Analytics
        </h3>
        <p className="text-sm text-muted-foreground">
          Download comprehensive AI analytics reports and data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Select Report Sections</CardTitle>
            <CardDescription>
              Choose which analytics to include in your export
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sections.map((section) => (
                <div key={section.id} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id={section.id}
                    checked={section.enabled}
                    onCheckedChange={() => toggleSection(section.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={section.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {section.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {section.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        PDF Report
                      </div>
                    </SelectItem>
                    <SelectItem value="excel">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4" />
                        Excel Workbook
                      </div>
                    </SelectItem>
                    <SelectItem value="csv">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4" />
                        CSV Data
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last Quarter</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sections selected</span>
                  <Badge variant="outline">{enabledCount}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated size</span>
                  <span className="font-medium">
                    {exportFormat === 'pdf' ? '2.4 MB' : exportFormat === 'excel' ? '1.8 MB' : '450 KB'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleExport}
            disabled={isExporting || enabledCount === 0}
            className="w-full"
            size="lg"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Export Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Exports</CardTitle>
          <CardDescription>
            Pre-configured reports for common use cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col items-start"
              onClick={() => {
                toast.success('Downloading Executive Summary');
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                <span className="font-semibold">Executive Summary</span>
              </div>
              <p className="text-xs text-muted-foreground text-left">
                High-level overview with key metrics and ROI
              </p>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex-col items-start"
              onClick={() => {
                toast.success('Downloading Technical Report');
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet className="w-4 h-4" />
                <span className="font-semibold">Technical Report</span>
              </div>
              <p className="text-xs text-muted-foreground text-left">
                Detailed model performance and bias analysis
              </p>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex-col items-start"
              onClick={() => {
                toast.success('Downloading Monthly Report');
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="font-semibold">Monthly Report</span>
              </div>
              <p className="text-xs text-muted-foreground text-left">
                Complete monthly analytics package
              </p>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Reports</CardTitle>
          <CardDescription>
            Set up automated report delivery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium mb-2">Schedule Automatic Reports</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Get analytics reports delivered to your inbox on a recurring schedule
            </p>
            <Button variant="outline">
              Set Up Scheduled Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportAnalytics;
