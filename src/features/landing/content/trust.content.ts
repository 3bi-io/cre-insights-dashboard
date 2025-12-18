/**
 * Trust Section Content
 * Voice-specific metrics
 */

import { Shield, Phone, CheckCircle, Award } from 'lucide-react';
import { TrustStat } from './types';

export const trustContent = {
  badge: 'New to Market - Join Our Pilot Program',
  title: 'Built on Proven Technology, Designed for Modern Recruiting',
  description: 'While we are new to market, our platform is built on enterprise-grade infrastructure with real integrations to Tenstreet, major job boards, and leading HR systems.',
  footer: 'Early Adopter Benefits: Priority support, feature voting rights, and special pricing for pilot program participants',
  stats: [
    {
      icon: Phone,
      value: '2,500+',
      label: 'Voice Calls Handled',
      description: 'Automated candidate callbacks'
    },
    {
      icon: CheckCircle,
      value: '< 3 min',
      label: 'Average Callback Time',
      description: 'From application to contact'
    },
    {
      icon: Shield,
      value: '95%',
      label: 'Call Completion Rate',
      description: 'Successful AI conversations'
    },
    {
      icon: Award,
      value: '4.8/5',
      label: 'Candidate Satisfaction',
      description: 'Based on post-call surveys'
    }
  ] as TrustStat[]
};
