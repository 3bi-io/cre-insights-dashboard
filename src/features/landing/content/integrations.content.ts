/**
 * Integrations Section Content
 */

import { IntegrationCategory } from './types';

export const integrationsContent = {
  title: 'Seamless Integrations with Your Existing Tools',
  description: 'Connect with 100+ platforms to create a unified recruitment ecosystem. No data silos, no manual exports.',
  ctaText: 'View All Integrations',
  footerText: 'Need a custom integration? Our API makes it easy to connect any tool.',
  categories: [
    {
      title: "ATS & HRIS Systems",
      integrations: ["Tenstreet", "Workday", "BambooHR", "ADP", "SAP SuccessFactors"]
    },
    {
      title: "Job Boards & Sourcing",
      integrations: ["Indeed", "Glassdoor", "LinkedIn", "Adzuna", "Talroo", "Google Jobs"]
    },
    {
      title: "Background Checks & Verification",
      integrations: ["Checkr", "Sterling", "HireRight", "GoodHire", "Accurate Background"]
    },
    {
      title: "Calendar & Scheduling",
      integrations: ["Google Calendar", "Outlook", "Calendly", "Microsoft Teams", "Zoom"]
    },
    {
      title: "Communication & Collaboration",
      integrations: ["Slack", "Microsoft Teams", "Gmail", "SendGrid", "Twilio"]
    },
    {
      title: "Analytics & Reporting",
      integrations: ["Google Analytics", "Tableau", "Power BI", "Looker", "Custom API"]
    }
  ] as IntegrationCategory[]
};
