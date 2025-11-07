/**
 * Trust Section Content
 */

import { Shield, Users, Zap, Award } from 'lucide-react';
import { TrustStat } from './types';

export const trustContent = {
  badge: 'New to Market - Join Our Pilot Program',
  title: 'Built on Proven Technology, Designed for Modern Recruiting',
  description: 'While we are new to market, our platform is built on enterprise-grade infrastructure with real integrations to Tenstreet, major job boards, and leading HR systems.',
  footer: 'Early Adopter Benefits: Priority support, feature voting rights, and special pricing for pilot program participants',
  stats: [
    {
      icon: Users,
      value: '50+',
      label: 'Pilot Program Companies',
      description: 'Testing in production'
    },
    {
      icon: Zap,
      value: '75%',
      label: 'Avg. Time Savings',
      description: 'Reported by early adopters'
    },
    {
      icon: Shield,
      value: '100%',
      label: 'GDPR & EEO Compliant',
      description: 'Built-in from day one'
    },
    {
      icon: Award,
      value: '4.8/5',
      label: 'Beta User Rating',
      description: 'Based on pilot feedback'
    }
  ] as TrustStat[]
};
