/**
 * How It Works Section Content
 * Visual flow for automated voice callback process
 */

import { FileText, Bot, Phone, ClipboardCheck } from 'lucide-react';

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
