/**
 * Trust Section Content
 * Honest capability-focused messaging for early-stage product
 */

import { Shield, Phone, CheckCircle, Rocket } from 'lucide-react';
import { TrustStat } from './types';

export const trustContent = {
  badge: 'Now Accepting Beta Users',
  title: 'Built on Proven Technology, Designed for Modern Recruiting',
  description: 'Our platform is built on enterprise-grade infrastructure with integrations to Tenstreet, major job boards, and leading HR systems.',
  footer: 'Early Adopter Benefits: Priority support, feature voting rights, and exclusive access for pilot program participants',
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
