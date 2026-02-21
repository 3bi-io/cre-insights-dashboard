/**
 * Integrations Section Content
 */

import { Building2, Search, ShieldCheck, Calendar, MessageSquare, BarChart3 } from 'lucide-react';
import { IntegrationCategory } from './types';

export const integrationsContent = {
  badge: '100+ Integrations',
  title: 'Seamless Integrations with Your Existing Tools',
  description: 'Connect with 100+ platforms to create a unified recruitment ecosystem. No data silos, no manual exports.',
  ctaText: 'View All Integrations',
  footerText: 'Need a custom integration? Our API makes it easy to connect any tool.',
  categories: [
    {
      title: "ATS & HRIS Systems",
      icon: Building2,
      integrations: ["Tenstreet", "Workday", "BambooHR", "ADP", "SAP SuccessFactors"]
    },
    {
      title: "Job Boards & Sourcing",
      icon: Search,
      integrations: ["Indeed", "Glassdoor", "LinkedIn", "Adzuna", "Talroo", "Google Jobs"]
    },
    {
      title: "Background Checks & Verification",
      icon: ShieldCheck,
      integrations: ["Checkr", "Sterling", "HireRight", "GoodHire", "Accurate Background"]
    },
    {
      title: "Calendar & Scheduling",
      icon: Calendar,
      integrations: ["Google Calendar", "Outlook", "Calendly", "Microsoft Teams", "Zoom"]
    },
    {
      title: "Communication & Collaboration",
      icon: MessageSquare,
      integrations: ["Slack", "Microsoft Teams", "Gmail", "SendGrid", "Twilio"]
    },
    {
      title: "Analytics & Reporting",
      icon: BarChart3,
      integrations: ["Google Analytics", "Tableau", "Power BI", "Looker", "Custom API"]
    }
  ] as IntegrationCategory[]
};
