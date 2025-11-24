import { useCallback } from 'react';
import { generateApplicationsPDF } from '@/utils/pdfGenerator';
import * as XLSX from 'xlsx';
import type { Application } from '@/types/common.types';

export function useApplicationsExport() {
  const handleExportPDF = useCallback(async (applications: Application[]) => {
    await generateApplicationsPDF(applications);
  }, []);

  const handleExportCSV = useCallback((applications: Application[]) => {
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Source', 'Applied Date', 'Job Title'];
    const rows = applications.map(app => [
      `${app.first_name || ''} ${app.last_name || ''}`,
      app.applicant_email || '',
      app.phone || '',
      app.status || '',
      app.source || '',
      app.applied_at ? new Date(app.applied_at).toLocaleDateString() : '',
      app.job_listings?.title || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, []);

  const handleExportExcel = useCallback((applications: Application[]) => {
    const data = applications.map(app => ({
      'Name': `${app.first_name || ''} ${app.last_name || ''}`,
      'Email': app.applicant_email || '',
      'Phone': app.phone || '',
      'Status': app.status || '',
      'Source': app.source || '',
      'Applied Date': app.applied_at ? new Date(app.applied_at).toLocaleDateString() : '',
      'Job Title': app.job_listings?.title || '',
      'City': app.city || '',
      'State': app.state || '',
      'CDL': app.cdl || '',
      'Experience': app.exp || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');
    
    // Auto-size columns
    const maxWidth = 50;
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.min(maxWidth, Math.max(key.length, ...data.map(row => String(row[key as keyof typeof row]).length)))
    }));
    worksheet['!cols'] = colWidths;
    
    XLSX.writeFile(workbook, `applications-${new Date().toISOString().split('T')[0]}.xlsx`);
  }, []);

  return {
    handleExportPDF,
    handleExportCSV,
    handleExportExcel,
  };
}
