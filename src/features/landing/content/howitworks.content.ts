/**
 * How It Works Section Content
 * Visual flow for automated voice callback process - Jobseeker & Employer views
 */

import { FileText, Bot, Phone, ClipboardCheck, Settings, Users, Power, CheckCircle, Smartphone, Clock } from 'lucide-react';

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
      description: 'Consent, enter contact info, and await call',
      highlight: 'Any channel'
    },
    {
      icon: Phone,
      title: 'Security Check',
      description: 'Multi-step process to protect you and employer',
      highlight: '< 3 min'
    },
    {
      icon: Bot,
      title: 'Have a Chat',
      description: 'Present experience and credentials with confidence',
      highlight: 'Real-time'
    },
    {
      icon: ClipboardCheck,
      title: 'Transcripts & Logs',
      description: '100% transparency with copy of results',
      highlight: 'Complete record'
    },
    {
      icon: Clock,
      title: 'Await Next Steps',
      description: 'Candidate waits for employer review',
      highlight: 'Human decision'
    }
  ] as HowItWorksStep[],
  
  employerTitle: 'For Employers',
  employerSteps: [
    {
      icon: Settings,
      title: 'Configure AI',
      description: 'Set criteria and experiences for 3 Critical Roles',
      highlight: 'Customizable'
    },
    {
      icon: Smartphone,
      title: 'Add Phone #',
      description: 'Post Critical Roles as normal',
      highlight: 'Quick setup'
    },
    {
      icon: Users,
      title: 'Await Interest',
      description: 'Candidates dialogue with AI about a Critical Role',
      highlight: '24/7'
    },
    {
      icon: Power,
      title: 'Auto-Shutoff',
      description: 'With high interest, the AI is kind and stops dialoguing',
      highlight: 'Data-driven'
    },
    {
      icon: CheckCircle,
      title: 'Finalize',
      description: 'Get results and place humans in decision loops',
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
