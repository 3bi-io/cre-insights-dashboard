/**
 * How It Works Section Content
 * Visual flow for automated voice callback process - Jobseeker & Employer views
 */

import { FileText, Bot, Phone, ClipboardCheck, Briefcase, Settings, Users, BarChart3, CheckCircle } from 'lucide-react';

export interface HowItWorksStep {
  icon: typeof FileText;
  title: string;
  description: string;
  highlight?: string;
}

export const howItWorksContent = {
  badge: 'How It Works',
  title: 'From Application to Callback in Minutes',
  description: 'Our AI-powered voice technology ensures every qualified jobseeker gets contacted instantly.',
  
  jobseekerTitle: 'For Jobseekers',
  jobseekerSteps: [
    {
      icon: FileText,
      title: 'Start',
      description: 'Consent and contact entry',
      highlight: 'Any channel'
    },
    {
      icon: Bot,
      title: 'AI Screens & Qualifies',
      description: 'Instant qualification against your criteria',
      highlight: 'Real-time'
    },
    {
      icon: Phone,
      title: 'Automated Voice Callback',
      description: 'AI calls the jobseeker within minutes',
      highlight: '< 3 min'
    },
    {
      icon: ClipboardCheck,
      title: 'Logged & Tracked',
      description: 'Full transcript and next steps captured',
      highlight: 'Complete record'
    }
  ] as HowItWorksStep[],
  
  employerTitle: 'For Employers',
  employerSteps: [
    {
      icon: Settings,
      title: 'Configure AI',
      description: 'Set screening criteria and questions',
      highlight: 'Customizable'
    },
    {
      icon: Briefcase,
      title: 'Post Job',
      description: 'Just add a phone #',
      highlight: 'Quick setup'
    },
    {
      icon: Users,
      title: 'Receive Candidates',
      description: 'Pre-qualified applicants delivered',
      highlight: '24/7'
    },
    {
      icon: BarChart3,
      title: 'Review & Hire',
      description: 'Transcripts, scores, and insights',
      highlight: 'Data-driven'
    },
    {
      icon: CheckCircle,
      title: 'Finalize',
      description: 'Make decisions',
      highlight: 'Complete'
    }
  ] as HowItWorksStep[],

  // Legacy support for standalone section
  steps: [
    {
      icon: FileText,
      title: 'Start',
      description: 'Consent and contact entry',
      highlight: 'Any channel'
    },
    {
      icon: Bot,
      title: 'AI Screens & Qualifies',
      description: 'Instant qualification against your criteria',
      highlight: 'Real-time'
    },
    {
      icon: Phone,
      title: 'Automated Voice Callback',
      description: 'AI calls the jobseeker within minutes',
      highlight: '< 3 min'
    },
    {
      icon: ClipboardCheck,
      title: 'Logged & Tracked',
      description: 'Full transcript and next steps captured',
      highlight: 'Complete record'
    }
  ] as HowItWorksStep[]
};
