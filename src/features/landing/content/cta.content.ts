/**
 * CTA Section Content
 */

import { CTAStat } from './types';

export const ctaContent = {
  badge: 'Limited Time: Early Adopter Program',
  title: 'Ready to Transform Your Hiring Process?',
  description: 'Join 50+ companies in our pilot program. Get 50% off for 6 months, lifetime grandfathered pricing, and direct access to our product team.',
  cta: {
    primary: 'Start Free Trial',
    secondary: 'Contact Sales'
  },
  stats: [
    { value: '30 Days', label: 'Free trial, no credit card' },
    { value: '48 Hours', label: 'Average go-live time' },
    { value: '50% Off', label: 'First 6 months for early adopters' }
  ] as CTAStat[],
  footer: 'No long-term contracts • Cancel anytime • GDPR compliant • SOC 2 certified'
};
