import jsPDF from 'jspdf';
import { getApplicantName, getApplicantEmail, getClientName, getApplicantCategory } from './applicationHelpers';
import { logger } from '@/lib/logger';

export const generateApplicationsPDF = (applications: any[]) => {
  if (!applications || applications.length === 0) {
    throw new Error('No applications data provided');
  }
  
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Applications Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Applications: ${applications?.length || 0}`, 20, yPosition);
    yPosition += 6;

    const statusCounts = applications?.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (statusCounts) {
      Object.entries(statusCounts).forEach(([status, count]) => {
        doc.text(`${status.charAt(0).toUpperCase() + status.slice(1)}: ${count}`, 20, yPosition);
        yPosition += 6;
      });
    }

    yPosition += 10;

    // Applications List
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Applications', 20, yPosition);
    yPosition += 10;

    applications?.forEach((app, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      const applicantName = getApplicantName(app);
      const email = getApplicantEmail(app);
      const jobTitle = app.job_listings?.title || app.job_listings?.job_title || 'Unknown Position';
      const category = getApplicantCategory(app);
      const clientName = getClientName(app);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${applicantName}`, 20, yPosition);
      yPosition += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Email: ${email}`, 25, yPosition);
      yPosition += 5;
      doc.text(`Position: ${jobTitle}`, 25, yPosition);
      yPosition += 5;
      if (clientName) {
        doc.text(`Client: ${clientName}`, 25, yPosition);
        yPosition += 5;
      }
      doc.text(`Category: ${category.code} - ${category.label}`, 25, yPosition);
      yPosition += 5;
      doc.text(`Status: ${app.status}`, 25, yPosition);
      yPosition += 5;
      if (app.phone) {
        doc.text(`Phone: ${app.phone}`, 25, yPosition);
        yPosition += 5;
      }
      doc.text(`Applied: ${new Date(app.applied_at).toLocaleDateString()}`, 25, yPosition);
      yPosition += 10;
    });

    doc.save('applications-report.pdf');
  } catch (error) {
    logger.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF report');
  }
};