/**
 * Consolidated Application Export Hook
 * Handles PDF, CSV, and XLSX exports (using exceljs)
 */

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { generateApplicationsPDF } from '@/utils/pdfGenerator';
import { writeExcelFile } from '@/lib/excelHelper';
import type { Application } from '@/types/common.types';
import type { ExportFormat } from '@/types/api.types';
import { logger } from '@/lib/logger';

export const useApplicationsExport = () => {
  const { toast } = useToast();

  const exportToPDF = useCallback(async (applications: Application[]) => {
    try {
      await generateApplicationsPDF(applications);
      toast({
        title: 'Export Successful',
        description: `Exported ${applications.length} applications to PDF`,
      });
    } catch (error) {
      logger.error('PDF export error', error, { context: 'applications-export' });
      toast({
        title: 'Export Failed',
        description: 'Failed to export applications to PDF',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const exportToCSV = useCallback((applications: Application[]) => {
    try {
      const headers = [
        'Name', 'Email', 'Phone', 'Status', 'Source',
        'Applied Date', 'Job Title', 'Location', 'City', 'State',
      ];
      
      const rows = applications.map(app => [
        `${app.first_name || ''} ${app.last_name || ''}`.trim(),
        app.applicant_email || '',
        app.phone || '',
        app.status || '',
        app.source || '',
        app.applied_at ? new Date(app.applied_at).toLocaleDateString() : '',
        app.job_listings?.title || app.job_listings?.job_title || '',
        '',
        app.city || '',
        app.state || '',
      ]);
      
      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `applications-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: `Exported ${applications.length} applications to CSV`,
      });
    } catch (error) {
      logger.error('CSV export error', error, { context: 'applications-export' });
      toast({
        title: 'Export Failed',
        description: 'Failed to export applications to CSV',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const exportToExcel = useCallback(async (applications: Application[]) => {
    try {
      const data = applications.map(app => ({
        'Full Name': `${app.first_name || ''} ${app.last_name || ''}`.trim(),
        'Email': app.applicant_email || '',
        'Phone': app.phone || '',
        'Status': app.status || '',
        'Source': app.source || '',
        'Applied Date': app.applied_at ? new Date(app.applied_at).toLocaleDateString() : '',
        'Job Title': app.job_listings?.title || app.job_listings?.job_title || '',
        'Location': '',
        'City': app.city || '',
        'State': app.state || '',
        'ZIP': app.zip || '',
        'Experience': app.exp || '',
        'CDL': app.cdl || '',
        'Education': app.education_level || '',
        'Work Authorization': app.work_authorization || '',
        'Notes': app.notes || '',
      }));

      await writeExcelFile(
        [{ name: 'Applications', data }],
        `applications-${new Date().toISOString().split('T')[0]}.xlsx`,
      );

      toast({
        title: 'Export Successful',
        description: `Exported ${applications.length} applications to Excel`,
      });
    } catch (error) {
      logger.error('Excel export error', error, { context: 'applications-export' });
      toast({
        title: 'Export Failed',
        description: 'Failed to export applications to Excel',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const exportApplications = useCallback(
    (applications: Application[], format: ExportFormat) => {
      if (!applications || applications.length === 0) {
        toast({
          title: 'No Data',
          description: 'No applications to export',
          variant: 'destructive',
        });
        return;
      }

      switch (format) {
        case 'pdf':
          return exportToPDF(applications);
        case 'csv':
          return exportToCSV(applications);
        case 'xlsx':
          return exportToExcel(applications);
        default:
          toast({
            title: 'Invalid Format',
            description: `Export format '${format}' is not supported`,
            variant: 'destructive',
          });
      }
    },
    [exportToPDF, exportToCSV, exportToExcel, toast]
  );

  return {
    exportToPDF,
    exportToCSV,
    exportToExcel,
    exportApplications,
  };
};
