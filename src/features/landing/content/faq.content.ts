/**
 * FAQ Section Content
 */

import { FAQ } from './types';

export const faqContent = {
  title: 'Frequently Asked Questions',
  description: 'Everything you need to know about our platform',
  footer: {
    text: 'Still have questions?',
    linkText: 'Contact our team →',
    linkUrl: '/contact'
  },
  faqs: [
    {
      question: 'What is the implementation timeline?',
      answer: 'Most customers are fully operational within 48 hours. Our guided onboarding process includes data migration, team training, and configuration. Enterprise customers may require 1-2 weeks for custom integrations.',
    },
    {
      question: 'Do I need to sign a long-term contract?',
      answer: 'No. All our plans are month-to-month with no long-term commitment. You can cancel anytime.',
    },
    {
      question: 'How does the AI screening work?',
      answer: 'Our AI analyzes resumes, cover letters, and responses to pre-screening questions. It scores jobseekers based on job requirements, experience, skills, and cultural fit indicators. The AI learns from your hiring decisions to improve recommendations over time.',
    },
    {
      question: 'What integrations are available?',
      answer: 'We integrate with 100+ job boards (Indeed, LinkedIn, Glassdoor, Tenstreet, etc.), major HRIS systems, calendar tools (Google Calendar, Outlook), background check providers, and communication platforms. Custom API integrations are available for enterprise needs.',
    },
    {
      question: 'Is my data secure and compliant?',
      answer: 'Yes. We are GDPR and EEO compliant with SOC 2 Type II certification in progress. All data is encrypted at rest and in transit. We maintain detailed audit trails and offer role-based access controls. Data residency options are available for enterprise customers.',
    },
    {
      question: 'What is Voice Apply technology?',
      answer: 'Voice Apply allows jobseekers to complete applications using voice commands via phone or mobile app. This reduces application time by 80% and significantly improves mobile conversion rates, especially for hourly and driver positions.',
    },
    {
      question: 'Can I try it before committing?',
      answer: 'Yes! Contact our team for a personalized demo to see the platform in action and discuss your specific needs.',
    },
    {
      question: 'What kind of support do you provide?',
      answer: 'All customers receive email and chat support. Enterprise customers receive a dedicated account manager, phone support, and custom SLAs.',
    },
    {
      question: 'How does pricing work?',
      answer: 'Our pricing is based on your organization size and needs. Contact our sales team for a custom quote tailored to your requirements.',
    },
    {
      question: 'What happens to my data if I cancel?',
      answer: 'You maintain full access during your notice period. We provide data export tools in standard formats (CSV, JSON) so you can take all your jobseeker data, job postings, and analytics with you. Data is retained for 90 days after cancellation for potential reactivation.',
    },
  ] as FAQ[]
};
