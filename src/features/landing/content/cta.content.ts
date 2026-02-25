/**
 * CTA Section Content
 */

import { CTAStat } from './types';

export const ctaContent = {
  badge: 'Get Started Today',
  title: 'Ready to Hire Faster?',
  description: 'The best end-to-end recruitment solution available today. AI-powered screening, voice agents, and ATS integration — all in one platform.',
  cta: {
    primary: 'Get Started',
    primaryPath: '/auth?signup=true',
    secondary: 'Talk to Us',
    secondaryPath: '/contact'
  },
  stats: [
    { value: '3 min', label: 'Avg. response time' },
    { value: '80%', label: 'Cost reduction' },
    { value: '24/7', label: 'AI coverage' }
  ] as CTAStat[],
  footer: 'No contracts • Cancel anytime • GDPR compliant'
};
