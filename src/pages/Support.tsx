/**
 * Support Page
 * Comprehensive documentation for organizational members
 */

import React from 'react';
import { PageLayout } from '@/features/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Users, 
  Brain, 
  Wand2, 
  Mic, 
  Link2, 
  Route, 
  Globe, 
  Settings, 
  BarChart3,
  Shield,
  Megaphone,
  FolderKanban,
  Building2,
  Bot
} from 'lucide-react';

interface SupportSection {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: string;
  description: string;
  features: {
    title: string;
    content: string;
  }[];
}

const supportSections: SupportSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Your central hub for monitoring performance and managing recruiting operations.',
    features: [
      {
        title: 'Overview Metrics',
        content: 'View key performance indicators including total applications, active jobs, conversion rates, and time-to-hire metrics. Metrics update in real-time to reflect current status.'
      },
      {
        title: 'Quick Actions',
        content: 'Access frequently used features directly from the dashboard including creating new jobs, viewing recent applications, and managing campaigns.'
      },
      {
        title: 'Recent Activity',
        content: 'Monitor the latest activities across your organization including new applications, status changes, and system notifications.'
      }
    ]
  },
  {
    id: 'jobs',
    title: 'Jobs Management',
    icon: Briefcase,
    description: 'Create, edit, and manage job postings across multiple platforms.',
    features: [
      {
        title: 'Create Job Postings',
        content: 'Create detailed job postings with titles, descriptions, requirements, compensation details, and location information. Use the rich text editor for formatting job descriptions.'
      },
      {
        title: 'Multi-Platform Publishing',
        content: 'Publish jobs to multiple job boards and platforms simultaneously. Track which platforms each job is published to and manage platform-specific settings.'
      },
      {
        title: 'Job Status Management',
        content: 'Control job status (Active, Paused, Closed) to manage visibility and application flow. Archive old postings while maintaining historical data.'
      },
      {
        title: 'Job Analytics',
        content: 'View performance metrics for each job including views, applications, conversion rates, and cost per application. Use data to optimize job descriptions and targeting.'
      },
      {
        title: 'Bulk Actions',
        content: 'Perform batch operations on multiple jobs including status updates, platform publishing, and deletion. Save time with efficient bulk management tools.'
      }
    ]
  },
  {
    id: 'campaigns',
    title: 'Campaigns',
    icon: Megaphone,
    description: 'Organize and track recruiting campaigns with targeted strategies.',
    features: [
      {
        title: 'Campaign Creation',
        content: 'Group related jobs into campaigns for organized tracking. Set campaign goals, budgets, and timelines to measure success.'
      },
      {
        title: 'Performance Tracking',
        content: 'Monitor campaign-level metrics including total spend, applications received, cost per application, and ROI. Compare performance across campaigns.'
      },
      {
        title: 'Budget Management',
        content: 'Set and track budgets for each campaign. Receive alerts when approaching budget limits to control spending.'
      },
      {
        title: 'Campaign Analytics',
        content: 'Access detailed reports showing campaign effectiveness, platform performance, and conversion funnels. Export data for external analysis.'
      }
    ]
  },
  {
    id: 'job-groups',
    title: 'Job Groups',
    icon: FolderKanban,
    description: 'Organize jobs into logical groups for better management.',
    features: [
      {
        title: 'Group Organization',
        content: 'Create groups based on department, location, job type, or custom criteria. Assign multiple jobs to each group for organized management.'
      },
      {
        title: 'Group-Level Analytics',
        content: 'View aggregated metrics across all jobs in a group. Compare performance between different groups.'
      },
      {
        title: 'Bulk Group Operations',
        content: 'Apply settings or updates to all jobs within a group simultaneously. Streamline management of related positions.'
      }
    ]
  },
  {
    id: 'applications',
    title: 'Applications Management',
    icon: FileText,
    description: 'Track and manage candidate applications throughout the hiring process.',
    features: [
      {
        title: 'Application Dashboard',
        content: 'View all applications in a centralized dashboard with filtering options by status, job, date range, and custom criteria.'
      },
      {
        title: 'Candidate Profiles',
        content: 'Access detailed candidate information including resumes, contact details, application responses, and application history. Add notes and tags for organization.'
      },
      {
        title: 'Status Pipeline',
        content: 'Move candidates through customizable pipeline stages: New, Reviewing, Interviewed, Offer, Hired, or Rejected. Track progress and maintain organized workflow.'
      },
      {
        title: 'CSV Import',
        content: 'Bulk import applications via CSV file upload. Download the template with required fields, prepare your data, and import multiple applications at once. The system validates all data and provides detailed error reporting for any issues. Admin-only feature for organization administrators.'
      },
      {
        title: 'Communication Tools',
        content: 'Contact candidates directly from the platform via email. Use templates for consistent communication and track all interactions.'
      },
      {
        title: 'Bulk Actions',
        content: 'Update status, send emails, or perform other actions on multiple applications simultaneously. Save time with efficient batch processing.'
      },
      {
        title: 'Application Filtering',
        content: 'Use advanced filters to find specific candidates based on skills, experience, location, application date, and custom fields.'
      }
    ]
  },
  {
    id: 'ai-analytics',
    title: 'AI Analytics',
    icon: Brain,
    badge: 'AI-Powered',
    description: 'Leverage artificial intelligence for data-driven recruiting insights.',
    features: [
      {
        title: 'AI Analytics Assistant',
        content: 'Interactive AI chatbot available to organization administrators. Get instant insights, ask questions about your data, analyze trends, and receive AI-powered recommendations. The assistant understands your organization context and provides personalized analysis. Access via the chatbot icon in the bottom right corner.'
      },
      {
        title: 'Predictive Analytics',
        content: 'AI-powered predictions for candidate success, time-to-hire, and conversion likelihood. Use data to prioritize high-potential candidates.'
      },
      {
        title: 'Performance Insights',
        content: 'Automated analysis of recruiting metrics with recommendations for improvement. Identify trends and optimization opportunities.'
      },
      {
        title: 'Candidate Scoring',
        content: 'AI-driven candidate ranking based on qualifications, experience, and job fit. Prioritize review of top candidates.'
      },
      {
        title: 'Market Intelligence',
        content: 'Analyze market trends, competitive data, and industry benchmarks. Stay informed about talent market conditions.'
      },
      {
        title: 'Custom Reports',
        content: 'Generate detailed reports with AI-powered insights and recommendations. Schedule automated report delivery.'
      }
    ]
  },
  {
    id: 'ai-tools',
    title: 'AI Tools',
    icon: Wand2,
    badge: 'AI-Powered',
    description: 'Automated tools to streamline recruiting tasks.',
    features: [
      {
        title: 'Job Description Generator',
        content: 'Use AI to create compelling job descriptions based on title and basic requirements. Save time while maintaining quality and consistency.'
      },
      {
        title: 'Resume Screening',
        content: 'Automatically screen resumes against job requirements. AI highlights qualified candidates and identifies key skills and experience.'
      },
      {
        title: 'Email Assistant',
        content: 'Generate personalized candidate emails using AI. Create templates for common scenarios and customize with candidate-specific details.'
      },
      {
        title: 'Interview Questions',
        content: 'Get AI-generated interview questions tailored to specific positions and candidate backgrounds. Ensure comprehensive evaluation.'
      },
      {
        title: 'Sentiment Analysis',
        content: 'Analyze candidate communications to gauge interest level and engagement. Prioritize follow-up with highly engaged candidates.'
      }
    ]
  },
  {
    id: 'voice-agent',
    title: 'Voice Agent',
    icon: Mic,
    badge: 'AI-Powered',
    description: 'AI-powered voice interactions for candidate screening and engagement.',
    features: [
      {
        title: 'Voice Application System',
        content: 'Allow candidates to apply by phone using an AI voice agent. Collect application information through natural conversation.'
      },
      {
        title: 'Automated Screening',
        content: 'Voice agent conducts initial screening questions based on job requirements. Captures responses and converts to structured data.'
      },
      {
        title: 'Call Analytics',
        content: 'Track call metrics including duration, completion rate, and response quality. Analyze trends to optimize voice interactions.'
      },
      {
        title: 'Voice Agent Configuration',
        content: 'Customize voice agent behavior, questions, and responses. Configure different scripts for different job types.'
      },
      {
        title: 'Call Recordings',
        content: 'Access recordings of voice interactions for review and quality assurance. Ensure compliance with recording regulations.'
      }
    ]
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: Link2,
    description: 'Connect with external systems and platforms for seamless data flow.',
    features: [
      {
        title: 'Tenstreet Integration',
        content: 'Sync applications and candidate data with Tenstreet ATS. Configure field mapping and automated sync schedules. Monitor sync status and resolve conflicts.'
      },
      {
        title: 'ATS Explorer',
        content: 'Advanced Tenstreet integration tool for organization administrators. Discover available Tenstreet API endpoints, test API calls, retrieve specific data, and explore the full capabilities of the Tenstreet integration. Essential for configuring and troubleshooting Tenstreet connections.'
      },
      {
        title: 'Platform Connections',
        content: 'Connect with multiple job boards and recruiting platforms. Manage API credentials and connection settings for each platform.'
      },
      {
        title: 'Webhook Configuration',
        content: 'Set up webhooks to send data to external systems in real-time. Configure triggers for application events, status changes, and custom actions.'
      },
      {
        title: 'Data Sync Management',
        content: 'Monitor data synchronization status across all integrations. View sync logs, error reports, and resolution tools.'
      },
      {
        title: 'API Access',
        content: 'Use the platform API for custom integrations. Access comprehensive documentation and authentication management.'
      }
    ]
  },
  {
    id: 'routes',
    title: 'Routes',
    icon: Route,
    description: 'Manage transportation routes for driver recruitment.',
    features: [
      {
        title: 'Route Management',
        content: 'Create and manage transportation routes with origin/destination pairs. Associate routes with specific driver positions.'
      },
      {
        title: 'Route-Based Filtering',
        content: 'Filter jobs and candidates based on preferred routes and availability. Match drivers with appropriate route requirements.'
      },
      {
        title: 'Route Analytics',
        content: 'Track application rates and performance metrics by route. Identify high-demand routes and adjust recruiting strategies.'
      }
    ]
  },
  {
    id: 'platforms',
    title: 'Platforms & Publishers',
    icon: Globe,
    description: 'Manage job board integrations and publishing partnerships.',
    features: [
      {
        title: 'Platform Configuration',
        content: 'Set up integrations with job boards and recruiting platforms. Configure API credentials, posting requirements, and platform-specific settings.'
      },
      {
        title: 'Publishing Management',
        content: 'Control which jobs are published to which platforms. Set platform-specific job details and pricing.'
      },
      {
        title: 'Performance Tracking',
        content: 'Monitor applications and costs by platform. Analyze ROI for each publishing channel to optimize spending.'
      },
      {
        title: 'Platform Analytics',
        content: 'View detailed metrics for each platform including impressions, clicks, applications, and cost per application.'
      },
      {
        title: 'Budget Allocation',
        content: 'Set and manage budgets for each platform. Track spending and adjust allocations based on performance.'
      }
    ]
  },
  {
    id: 'clients',
    title: 'Clients',
    icon: Users,
    description: 'Manage clients and relationships.',
    features: [
      {
        title: 'Client Management',
        content: 'Create and manage clients with contact information, billing details, and account settings.'
      },
      {
        title: 'Client Portal Access',
        content: 'Provide clients with portal access to view their jobs, applications, and analytics. Control access levels and permissions.'
      },
      {
        title: 'Client Reporting',
        content: 'Generate client-specific reports showing recruiting performance, spending, and results. Schedule automated report delivery.'
      },
      {
        title: 'Multi-Client Management',
        content: 'Switch between client accounts easily. View consolidated metrics across all clients or drill down to individual client data.'
      }
    ]
  },
  {
    id: 'organizations',
    title: 'Organizations',
    icon: Building2,
    description: 'Manage organization settings and team members.',
    features: [
      {
        title: 'Organization Profile',
        content: 'Configure organization name, logo, contact information, and branding. Customize the platform appearance for your team.'
      },
      {
        title: 'Team Management',
        content: 'Add and manage team members with different roles and permissions. Control access to features and data based on user roles.'
      },
      {
        title: 'Organization Settings',
        content: 'Configure organization-wide settings including default values, workflows, and integrations.'
      },
      {
        title: 'Branding Customization',
        content: 'Upload organization logo and customize color schemes. Brand appears on job postings and candidate communications.'
      }
    ]
  },
  {
    id: 'analytics',
    title: 'Analytics & Reporting',
    icon: BarChart3,
    description: 'Comprehensive analytics and reporting tools.',
    features: [
      {
        title: 'Dashboard Reports',
        content: 'Access pre-built reports for common metrics including application volume, conversion rates, time-to-hire, and cost per hire.'
      },
      {
        title: 'Custom Reports',
        content: 'Build custom reports with your choice of metrics, dimensions, and filters. Save report templates for recurring analysis.'
      },
      {
        title: 'Data Export',
        content: 'Export data in multiple formats (CSV, Excel, PDF) for offline analysis or sharing with stakeholders.'
      },
      {
        title: 'Scheduled Reports',
        content: 'Schedule automatic report generation and delivery via email. Set up daily, weekly, or monthly report schedules.'
      },
      {
        title: 'Visual Analytics',
        content: 'Interactive charts and graphs for data visualization. Drill down into details with dynamic filtering and date range selection.'
      },
      {
        title: 'Comparative Analysis',
        content: 'Compare performance across time periods, campaigns, platforms, or other dimensions. Identify trends and changes.'
      }
    ]
  },
  {
    id: 'privacy',
    title: 'Privacy & Compliance',
    icon: Shield,
    description: 'Data privacy controls and compliance management.',
    features: [
      {
        title: 'Data Privacy Settings',
        content: 'Configure privacy settings for candidate data storage and access. Implement data retention policies and automatic deletion schedules.'
      },
      {
        title: 'GDPR Compliance',
        content: 'Tools for GDPR compliance including consent management, data access requests, and right-to-be-forgotten processing.'
      },
      {
        title: 'Access Controls',
        content: 'Manage who can view and edit candidate data. Implement role-based access control with granular permissions.'
      },
      {
        title: 'Audit Logs',
        content: 'Track all data access and modifications with detailed audit logs. Monitor compliance and investigate security events.'
      },
      {
        title: 'Consent Management',
        content: 'Track and manage candidate consent for data processing. Maintain records of consent for compliance requirements.'
      }
    ]
  },
  {
    id: 'settings',
    title: 'Settings & Configuration',
    icon: Settings,
    description: 'System settings and user preferences.',
    features: [
      {
        title: 'User Profile',
        content: 'Manage your profile information, email preferences, and notification settings. Configure your password and security settings.'
      },
      {
        title: 'Notification Preferences',
        content: 'Control which notifications you receive via email, SMS, or in-app alerts. Set up notification schedules and frequency.'
      },
      {
        title: 'Display Preferences',
        content: 'Customize interface settings including theme (light/dark), date formats, time zones, and language.'
      },
      {
        title: 'Email Templates',
        content: 'Create and manage email templates for candidate communications. Use variables for personalization.'
      },
      {
        title: 'Workflow Automation',
        content: 'Set up automated actions based on triggers like new applications, status changes, or custom events.'
      },
      {
        title: 'API Keys',
        content: 'Generate and manage API keys for integrations and custom development. Monitor API usage and rate limits.'
      }
    ]
  }
];

const Support = () => {
  return (
    <PageLayout 
      title="Support & Documentation" 
      description="Comprehensive guide to using the Apply AI platform"
      className="bg-background"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Welcome Section */}
        <Card className="mb-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">Welcome to Apply AI Support</CardTitle>
                <CardDescription className="text-base">
                  This comprehensive guide covers all features and capabilities of the Apply AI platform.
                  Use the sections below to learn about each feature in detail.
                </CardDescription>
                <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium mb-1 flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    Need Quick Help?
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Organization administrators can use the AI Analytics Assistant (chatbot icon in bottom right) 
                    to ask questions and get instant insights about your data.
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Feature Sections */}
        <div className="space-y-6">
          {supportSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{section.title}</CardTitle>
                        {section.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {section.badge}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-base">
                        {section.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <Accordion type="single" collapsible className="w-full">
                    {section.features.map((feature, index) => (
                      <AccordionItem key={index} value={`${section.id}-${index}`}>
                        <AccordionTrigger className="text-left hover:text-primary">
                          <span className="font-medium">{feature.title}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed">
                          {feature.content}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Resources */}
        <Card className="mt-8 bg-muted/30">
          <CardHeader>
            <CardTitle>Need More Help?</CardTitle>
            <CardDescription>
              If you have questions not covered in this documentation, please contact our support team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <p>
                <strong>Email Support:</strong>{' '}
                <a href="mailto:support@applyai.jobs" className="text-primary hover:underline">
                  support@applyai.jobs
                </a>
              </p>
              <p>
                <strong>Live Chat:</strong> Available during business hours (Mon-Fri, 9am-5pm EST)
              </p>
              <p>
                <strong>Phone Support:</strong> Available for immediate assistance
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Support;
