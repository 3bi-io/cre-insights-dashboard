/**
 * PDF generators for downloadable resources
 */
import jsPDF from 'jspdf';

/**
 * Generate Feature Guide PDF
 */
export const generateFeatureGuidePDF = (): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Apply AI Feature Guide', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprehensive overview of platform capabilities', pageWidth / 2, yPos, { align: 'center' });
  yPos += 20;

  // Core Features Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Core Features', 20, yPos);
  yPos += 10;

  const coreFeatures = [
    {
      title: 'AI-Powered Candidate Matching',
      description: 'Advanced algorithms analyze resumes and job requirements to identify best-fit candidates.'
    },
    {
      title: 'Voice Apply Technology',
      description: 'Candidates can apply via voice, reducing application time by up to 80%.'
    },
    {
      title: 'Automated Workflow Management',
      description: 'Streamline hiring with customizable automation templates.'
    },
    {
      title: 'Advanced Analytics Dashboard',
      description: 'Real-time insights into your recruitment performance.'
    },
    {
      title: 'Team Collaboration Tools',
      description: 'Shared candidate pools, feedback systems, and role-based access.'
    }
  ];

  doc.setFontSize(11);
  coreFeatures.forEach((feature) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`• ${feature.title}`, 25, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(feature.description, pageWidth - 50);
    doc.text(lines, 30, yPos);
    yPos += lines.length * 5 + 8;

    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
  });

  yPos += 5;

  // Additional Features Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Additional Features', 20, yPos);
  yPos += 10;

  const additionalFeatures = [
    'Multi-Platform Job Distribution',
    'Integrated Communication Hub',
    'Document Management System',
    'Advanced Candidate Search',
    'Custom Pipeline Builder',
    'Goal Setting & Tracking',
    'Time-to-Hire Optimization',
    'Compliance Management (GDPR, EEO)',
    'Mobile-First Design'
  ];

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  additionalFeatures.forEach((feature) => {
    doc.text(`• ${feature}`, 25, yPos);
    yPos += 7;

    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
  });

  yPos += 10;

  // Integrations Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Integrations', 20, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const integrations = 'Slack, Microsoft Teams, Google Workspace, LinkedIn, Indeed, Glassdoor, ZipRecruiter, Tenstreet, and more.';
  const integrationLines = doc.splitTextToSize(integrations, pageWidth - 50);
  doc.text(integrationLines, 25, yPos);

  // Footer
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 285, { align: 'center' });

  doc.save('apply-ai-feature-guide.pdf');
};

/**
 * Generate Implementation Checklist PDF
 */
export const generateImplementationChecklistPDF = (): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Implementation Checklist', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Step-by-step guide to get started with Apply AI', pageWidth / 2, yPos, { align: 'center' });
  yPos += 20;

  const phases = [
    {
      title: 'Phase 1: Account Setup (Day 1)',
      items: [
        'Create your organization account',
        'Invite team members and assign roles',
        'Configure organization settings',
        'Set up branding and company profile',
        'Review and configure notification preferences'
      ]
    },
    {
      title: 'Phase 2: Integrations (Days 2-3)',
      items: [
        'Connect job board accounts (Indeed, LinkedIn, etc.)',
        'Set up Tenstreet integration (if applicable)',
        'Configure email integration',
        'Connect calendar for interview scheduling',
        'Test webhook integrations'
      ]
    },
    {
      title: 'Phase 3: Workflow Configuration (Days 4-5)',
      items: [
        'Create hiring pipeline stages',
        'Set up automated email templates',
        'Configure screening questions',
        'Define approval workflows',
        'Set up Voice Apply settings'
      ]
    },
    {
      title: 'Phase 4: Job Postings (Week 2)',
      items: [
        'Create job listing templates',
        'Post your first job',
        'Test application flow',
        'Configure job distribution settings',
        'Review and optimize job descriptions'
      ]
    },
    {
      title: 'Phase 5: Team Training (Week 2-3)',
      items: [
        'Complete admin training session',
        'Train recruiters on candidate management',
        'Review analytics and reporting features',
        'Set up team communication channels',
        'Establish best practices documentation'
      ]
    },
    {
      title: 'Phase 6: Go Live (Week 3+)',
      items: [
        'Launch first active job campaign',
        'Monitor incoming applications',
        'Review AI screening recommendations',
        'Gather team feedback',
        'Optimize based on initial results'
      ]
    }
  ];

  phases.forEach((phase) => {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(phase.title, 20, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    phase.items.forEach((item) => {
      doc.rect(25, yPos - 3, 4, 4);
      doc.text(item, 32, yPos);
      yPos += 7;
    });

    yPos += 8;
  });

  // Footer
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 285, { align: 'center' });

  doc.save('apply-ai-implementation-checklist.pdf');
};

/**
 * Generate Best Practices Guide PDF
 */
export const generateBestPracticesPDF = (): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Recruitment Best Practices', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Proven strategies for effective hiring', pageWidth / 2, yPos, { align: 'center' });
  yPos += 20;

  const sections = [
    {
      title: 'Writing Effective Job Descriptions',
      tips: [
        'Use clear, specific job titles that candidates search for',
        'Lead with compelling benefits and company culture',
        'List requirements vs. nice-to-haves separately',
        'Include salary range for better qualified applicants',
        'Keep descriptions concise (300-700 words optimal)'
      ]
    },
    {
      title: 'Optimizing Application Experience',
      tips: [
        'Minimize required fields to reduce drop-off',
        'Enable Voice Apply for mobile-first candidates',
        'Provide clear status updates throughout process',
        'Offer multiple application methods (web, mobile, voice)',
        'Test your application flow regularly'
      ]
    },
    {
      title: 'Effective Candidate Screening',
      tips: [
        'Use AI-powered screening to reduce bias',
        'Define clear scoring criteria before reviewing',
        'Focus on skills and potential, not just experience',
        'Maintain consistent evaluation across all candidates',
        'Document all decisions for compliance'
      ]
    },
    {
      title: 'Interview Best Practices',
      tips: [
        'Use structured interview formats',
        'Prepare standardized questions in advance',
        'Include multiple team members for diverse perspectives',
        'Allow time for candidate questions',
        'Provide timely feedback after interviews'
      ]
    },
    {
      title: 'Improving Time-to-Hire',
      tips: [
        'Set and track hiring timeline goals',
        'Automate scheduling and communications',
        'Pre-screen candidates before interviews',
        'Make faster decisions with collaborative tools',
        'Analyze bottlenecks in your hiring pipeline'
      ]
    },
    {
      title: 'Building Employer Brand',
      tips: [
        'Showcase company culture in job postings',
        'Respond to all candidates promptly',
        'Gather and display employee testimonials',
        'Maintain consistent messaging across channels',
        'Track and improve candidate experience scores'
      ]
    }
  ];

  sections.forEach((section) => {
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, 20, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    section.tips.forEach((tip) => {
      const lines = doc.splitTextToSize(`• ${tip}`, pageWidth - 50);
      doc.text(lines, 25, yPos);
      yPos += lines.length * 5 + 3;
    });

    yPos += 10;
  });

  // Footer
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 285, { align: 'center' });

  doc.save('apply-ai-best-practices-guide.pdf');
};
