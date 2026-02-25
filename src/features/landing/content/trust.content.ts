/**
 * Trust Section Content
 * Honest capability-focused messaging for early-stage product
 */

import { Shield, Phone, CheckCircle, Rocket } from 'lucide-react';
import { TrustStat } from './types';

export const trustContent = {
  badge: 'Enterprise Tested',
  title: 'Built for Speed, Designed for Results',
  description: 'Using AI voice for occupations where resumes are sparse or atypical offers insight on resident skills without paper',
  footer: 'All Plans Include: Priority support, dedicated onboarding, and direct access to our product team',
  stats: [
    {
      icon: Phone,
      value: '< 3 min',
      label: 'Response Time',
      description: 'From consent to callback'
    },
    {
      icon: CheckCircle,
      value: 'Transparent',
      label: 'Disclosure and Dialogue',
      description: 'Cover pay, process, and policy'
    },
    {
      icon: Shield,
      value: 'Fraud Free',
      label: 'Secure by Design',
      description: 'Enterprise security standards'
    },
    {
      icon: Rocket,
      value: '< 48 hours',
      label: 'Go-Live',
      description: 'Average implementation time'
    }
  ] as TrustStat[]
};
