/**
 * Trust Section Content
 * Honest capability-focused messaging for early-stage product
 */

import { Shield, Phone, CheckCircle, Rocket } from 'lucide-react';
import { TrustStat } from './types';

export const trustContent = {
  badge: 'Trusted by Growing Companies',
  title: 'Built on Proven Technology, Designed for Modern Recruiting',
  description: 'Our platform is built on enterprise-grade infrastructure with integrations to Tenstreet, major job boards, and leading HR systems.',
  footer: 'All Plans Include: Priority support, dedicated onboarding, and direct access to our product team',
  stats: [
    {
      icon: Phone,
      value: 'AI Voice',
      label: 'Technology',
      description: 'Automated jobseeker callbacks'
    },
    {
      icon: CheckCircle,
      value: 'Fast',
      label: 'Response Times',
      description: 'Quick application-to-contact'
    },
    {
      icon: Shield,
      value: 'Built-in',
      label: 'Compliance',
      description: 'GDPR and EEO ready'
    },
    {
      icon: Rocket,
      value: 'Active',
      label: 'Development',
      description: 'New features shipping weekly'
    }
  ] as TrustStat[]
};
