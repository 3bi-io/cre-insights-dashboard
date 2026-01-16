/**
 * Data Export Utilities
 * Handles CSV and PDF export functionality
 */

import jsPDF from 'jspdf';
import { logger } from '@/lib/logger';

interface ExportOptions {
  filename?: string;
  headers?: string[];
  title?: string;
}

/**
 * Export data to CSV format
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
): void {
  if (!data || data.length === 0) {
    logger.warn('No data to export', { context: 'ExportData' });
    return;
  }

  const { filename = 'export.csv', headers } = options;

  // Get headers from data if not provided
  const csvHeaders = headers || Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    // Header row
    csvHeaders.join(','),
    // Data rows
    ...data.map(row =>
      csvHeaders.map(header => {
        const value = row[header];
        // Handle values with commas, quotes, or newlines
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data to PDF format
 */
export function exportToPDF<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
): void {
  if (!data || data.length === 0) {
    logger.warn('No data to export', { context: 'ExportData' });
    return;
  }

  const { 
    filename = 'export.pdf', 
    headers,
    title = 'Data Export Report'
  } = options;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Add title
  doc.setFontSize(18);
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Add timestamp
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Get headers
  const pdfHeaders = headers || Object.keys(data[0]);
  
  // Calculate column widths
  const columnWidth = (pageWidth - 20) / pdfHeaders.length;

  // Add table headers
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  pdfHeaders.forEach((header, index) => {
    doc.text(
      String(header),
      10 + (index * columnWidth),
      yPosition,
      { maxWidth: columnWidth - 2 }
    );
  });
  yPosition += 8;

  // Add horizontal line
  doc.line(10, yPosition, pageWidth - 10, yPosition);
  yPosition += 5;

  // Add data rows
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);

  data.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;

      // Re-add headers on new page
      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      pdfHeaders.forEach((header, index) => {
        doc.text(
          String(header),
          10 + (index * columnWidth),
          yPosition,
          { maxWidth: columnWidth - 2 }
        );
      });
      yPosition += 8;
      doc.line(10, yPosition, pageWidth - 10, yPosition);
      yPosition += 5;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
    }

    // Add row data
    pdfHeaders.forEach((header, index) => {
      const value = row[header];
      const displayValue = value !== null && value !== undefined ? String(value) : '';
      doc.text(
        displayValue,
        10 + (index * columnWidth),
        yPosition,
        { maxWidth: columnWidth - 2 }
      );
    });
    yPosition += 6;
  });

  // Add footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  doc.save(filename);
}

/**
 * Export screening report to PDF
 */
export function exportScreeningReportToPDF(
  screeningData: {
    applicantName: string;
    applicantEmail: string;
    requestType: string;
    status: string;
    requestDate: string;
    completionDate?: string;
    cost: number;
    provider?: string;
    results?: any;
  }
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.text('Background Screening Report', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Applicant Information
  doc.setFontSize(14);
  doc.text('Applicant Information', 15, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.text(`Name: ${screeningData.applicantName}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Email: ${screeningData.applicantEmail}`, 20, yPosition);
  yPosition += 15;

  // Screening Details
  doc.setFontSize(14);
  doc.text('Screening Details', 15, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.text(`Type: ${screeningData.requestType}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Status: ${screeningData.status.toUpperCase()}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Requested: ${new Date(screeningData.requestDate).toLocaleDateString()}`, 20, yPosition);
  yPosition += 7;

  if (screeningData.completionDate) {
    doc.text(`Completed: ${new Date(screeningData.completionDate).toLocaleDateString()}`, 20, yPosition);
    yPosition += 7;
  }

  if (screeningData.provider) {
    doc.text(`Provider: ${screeningData.provider}`, 20, yPosition);
    yPosition += 7;
  }

  doc.text(`Cost: $${(screeningData.cost / 100).toFixed(2)}`, 20, yPosition);
  yPosition += 15;

  // Results (if available)
  if (screeningData.results) {
    doc.setFontSize(14);
    doc.text('Results', 15, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    const resultsText = JSON.stringify(screeningData.results, null, 2);
    const lines = doc.splitTextToSize(resultsText, pageWidth - 40);
    lines.forEach((line: string) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 20, yPosition);
      yPosition += 5;
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    pageWidth / 2,
    285,
    { align: 'center' }
  );

  // Save
  doc.save(`screening-report-${screeningData.applicantName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}

/**
 * Format data for export by flattening nested objects
 */
export function flattenForExport<T extends Record<string, any>>(
  data: T[],
  fieldsToInclude?: string[]
): Record<string, any>[] {
  return data.map(item => {
    const flatItem: Record<string, any> = {};

    Object.entries(item).forEach(([key, value]) => {
      // Skip if fieldsToInclude is provided and key is not in it
      if (fieldsToInclude && !fieldsToInclude.includes(key)) {
        return;
      }

      // Flatten nested objects
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
          flatItem[`${key}_${nestedKey}`] = nestedValue;
        });
      } else if (Array.isArray(value)) {
        flatItem[key] = value.join(', ');
      } else {
        flatItem[key] = value;
      }
    });

    return flatItem;
  });
}
