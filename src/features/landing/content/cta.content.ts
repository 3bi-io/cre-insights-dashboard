/**
 * CTA Section Content
 */

import { CTAStat } from './types';

export const ctaContent = {
  badge: 'Founders Pass — Limited Time',
  title: 'Ready to Hire Faster?',
  description: '$0 to start. Pay only $1–$3 per apply. The best end-to-end recruitment solution available today.',
  cta: {
    primary: 'Claim Your Founders Pass',
    primaryPath: '/founders-pass',
    secondary: 'Talk to Us',
    secondaryPath: '/contact?subject=founders-pass'
  },
  stats: [
    { value: '$0', label: 'To get started' },
    { value: '$1–$3', label: 'Per apply' },
    { value: 'Priority', label: 'Onboarding support' }
  ] as CTAStat[],
  footer: 'No contracts • Cancel anytime • GDPR compliant'
};
