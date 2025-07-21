
import jsPDF from 'jspdf';

export const generateDashboardPDF = (metricsData?: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPosition = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Dashboard Report', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // Summary Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Dashboard Summary', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('This report provides an overview of key metrics and performance indicators.', 20, yPosition);
  yPosition += 15;

  // Key Metrics Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Metrics', 20, yPosition);
  yPosition += 10;

  const metrics = [
    'Total Applications: Data available in real-time dashboard',
    'Active Job Listings: Data available in real-time dashboard',
    'Platform Performance: Data available in real-time dashboard',
    'Recent Activity: Data available in real-time dashboard'
  ];

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  metrics.forEach(metric => {
    doc.text(`• ${metric}`, 25, yPosition);
    yPosition += 6;
  });

  yPosition += 15;

  // Instructions
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('For Detailed Reports:', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const instructions = [
    'Applications: Visit the Applications page and click "Export PDF" for detailed application reports',
    'Job Listings: Visit the Jobs page and click "Export PDF" for comprehensive job listings',
    'Analytics: Use the AI Analytics tab for advanced insights and analysis'
  ];

  instructions.forEach(instruction => {
    doc.text(`• ${instruction}`, 25, yPosition);
    yPosition += 8;
  });

  yPosition += 15;

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('This is a summary report. For real-time data and detailed analytics, please use the interactive dashboard.', 20, yPosition);

  doc.save('dashboard-report.pdf');
};
