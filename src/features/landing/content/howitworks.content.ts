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
      description: 'Set criteria and experiences for 3 critical roles',
      highlight: 'Customizable'
    },
    {
      icon: Briefcase,
      title: 'Add Phone #',
      description: 'Post critical roles as normal',
      highlight: 'Quick setup'
    },
    {
      icon: Users,
      title: 'Await Interest',
      description: 'Candidates dialogue with AI about a Critical Role',
      highlight: '24/7'
    },
    {
      icon: BarChart3,
      title: 'Auto-Shutoff',
      description: 'Be kind when interest is high',
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
