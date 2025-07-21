
import jsPDF from 'jspdf';

export const generateJobsPDF = (jobs: any[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPosition = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Job Listings Report', pageWidth / 2, yPosition, { align: 'center' });
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
  doc.text(`Total Job Listings: ${jobs?.length || 0}`, 20, yPosition);
  yPosition += 6;

  const statusCounts = jobs?.reduce((acc, job) => {
    const status = job.status || 'active';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (statusCounts) {
    Object.entries(statusCounts).forEach(([status, count]) => {
      doc.text(`${status.charAt(0).toUpperCase() + status.slice(1)}: ${count}`, 20, yPosition);
      yPosition += 6;
    });
  }

  yPosition += 10;

  // Jobs List
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Job Listings', 20, yPosition);
  yPosition += 10;

  jobs?.forEach((job, index) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }

    const jobTitle = job.title || job.job_title || 'Untitled Job';
    const location = job.location || (job.city && job.state ? `${job.city}, ${job.state}` : 'Location not specified');
    const clientName = job.clients?.name || job.client || 'No client specified';
    const platforms = job.job_platform_associations?.map(assoc => assoc.platforms?.name).join(', ') || 'No platforms';

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${jobTitle}`, 20, yPosition);
    yPosition += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Client: ${clientName}`, 25, yPosition);
    yPosition += 5;
    doc.text(`Location: ${location}`, 25, yPosition);
    yPosition += 5;
    doc.text(`Platforms: ${platforms}`, 25, yPosition);
    yPosition += 5;
    doc.text(`Status: ${job.status || 'active'}`, 25, yPosition);
    yPosition += 5;
    if (job.salary_min || job.salary_max) {
      const salaryRange = job.salary_min && job.salary_max 
        ? `$${job.salary_min} - $${job.salary_max}`
        : `$${job.salary_min || job.salary_max}`;
      doc.text(`Salary: ${salaryRange}`, 25, yPosition);
      yPosition += 5;
    }
    doc.text(`Created: ${new Date(job.created_at).toLocaleDateString()}`, 25, yPosition);
    yPosition += 10;
  });

  doc.save('job-listings-report.pdf');
};
