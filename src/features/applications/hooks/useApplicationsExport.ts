import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { generateApplicationsPDF } from '@/utils/pdfGenerator';
import { getApplicantName, getApplicantEmail } from '@/utils/applicationHelpers';
import type { Application } from '@/types/common.types';

/**
 * Hook for handling application exports (PDF, CSV, Excel)
 * Extracted from ApplicationsPage for better maintainability
 */
export const useApplicationsExport = () => {
  const { toast } = useToast();

  const exportToPDF = useCallback((applications: Application[]) => {
    try {
      const applicationsData = applications.map(app => ({
        applicant: getApplicantName(app),
        email: getApplicantEmail(app),
        phone: app.phone || '',
        job: app.job_listings?.title || app.job_listings?.job_title || '',
        status: app.status,
        location: `${app.city || ''} ${app.state || ''}`.trim(),
        appliedAt: new Date(app.applied_at).toLocaleDateString(),
        recruiter: app.recruiters ? `${app.recruiters.first_name} ${app.recruiters.last_name}` : 'Unassigned'
      }));
      
      generateApplicationsPDF(applicationsData);
      
      toast({
        title: "PDF Generated",
        description: `Successfully exported ${applications.length} application(s)`,
      });
    } catch (error) {
      logger.error('PDF export error', error, 'Applications');
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    }
  }, [toast]);

  const exportToCSV = useCallback((applications: Application[]) => {
    try {
      const exportData = applications.map(app => ({
        'Applicant Name': getApplicantName(app),
        'Email': getApplicantEmail(app),
        'Phone': app.phone || '',
        'Job': app.job_listings?.title || app.job_listings?.job_title || '',
        'Status': app.status,
        'Location': `${app.city || ''} ${app.state || ''}`.trim(),
        'Date Applied': new Date(app.applied_at).toLocaleDateString(),
        'Recruiter': app.recruiters ? `${app.recruiters.first_name} ${app.recruiters.last_name}` : 'Unassigned',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Applications');
      XLSX.writeFile(wb, `applications-export-${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: "Export Complete",
        description: `${applications.length} application(s) exported successfully`,
      });
    } catch (error) {
      logger.error('CSV export error', error, 'Applications');
      toast({
        title: "Export Failed",
        description: "Failed to export applications",
        variant: "destructive",
      });
    }
  }, [toast]);

  const exportSelectedToExcel = useCallback((applications: Application[], selectedIds: Set<string>) => {
    try {
      const selectedApps = applications.filter(app => selectedIds.has(app.id));
      const exportData = selectedApps.map(app => ({
        'Applicant Name': getApplicantName(app),
        'Email': getApplicantEmail(app),
        'Phone': app.phone || '',
        'Job': app.job_listings?.title || app.job_listings?.job_title || '',
        'Status': app.status,
        'Location': `${app.city || ''} ${app.state || ''}`.trim(),
        'Date Applied': new Date(app.applied_at).toLocaleDateString(),
        'Recruiter': app.recruiters ? `${app.recruiters.first_name} ${app.recruiters.last_name}` : 'Unassigned',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Selected Applications');
      XLSX.writeFile(wb, `selected-applications-${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: "Export Complete",
        description: `${selectedApps.length} application(s) exported successfully`,
      });
    } catch (error) {
      logger.error('Bulk export error', error, 'Applications');
      toast({
        title: "Export Failed",
        description: "Failed to export selected applications",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    exportToPDF,
    exportToCSV,
    exportSelectedToExcel,
  };
};
