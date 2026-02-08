/**
 * Trust Section Content
 * Honest capability-focused messaging for early-stage product
 */

import { Shield, Phone, CheckCircle, Rocket } from 'lucide-react';
import { TrustStat } from './types';

export const trustContent = {
  badge: 'Enterprise-Grade Platform',
  title: 'Built for Speed, Designed for Results',
  description: 'Our AI-powered platform delivers measurable outcomes with enterprise-grade infrastructure and seamless integrations.',
  footer: 'All Plans Include: Priority support, dedicated onboarding, and direct access to our product team',
  stats: [
    {
      icon: Phone,
      value: '< 3 min',
      label: 'Response Time',
      description: 'From application to callback'
    },
    {
      icon: CheckCircle,
      value: '95%',
      label: 'Call Completion',
      description: 'Reach rate for qualified leads'
    },
    {
      icon: Shield,
      value: 'Fraud Free',
      label: 'Secure by Design',
      description: 'Enterprise security standards'
    },
    {
      icon: Rocket,
      value: '48h',
      label: 'Go-Live',
      description: 'Average implementation time'
    }
  ] as TrustStat[]
};
