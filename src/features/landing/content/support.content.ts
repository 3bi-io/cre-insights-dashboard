/**
 * Support Section Content
 */

import { CheckCircle, Clock, MessageCircle, Phone, Mail, BookOpen } from 'lucide-react';
import { SupportTier } from './types';

export const supportContent = {
  title: 'Support When You Need It',
  description: 'From self-service resources to dedicated account managers, we are here to ensure your success',
  footer: 'All plans include access to our comprehensive knowledge base with setup guides, best practices, and integration documentation',
  tiers: [
    {
      name: 'Starter',
      badge: 'Up to 5 users',
      features: [
        { icon: Mail, text: 'Email support', detail: '48-hour response time' },
        { icon: BookOpen, text: 'Knowledge base access', detail: 'Self-service guides' },
        { icon: Clock, text: 'Business hours', detail: 'Mon-Fri, 9am-5pm EST' }
      ]
    },
    {
      name: 'Professional',
      badge: 'Up to 25 users',
      popular: true,
      features: [
        { icon: MessageCircle, text: 'Priority email & chat', detail: '24-hour response time' },
        { icon: Phone, text: 'Phone support', detail: 'Business hours' },
        { icon: CheckCircle, text: 'Onboarding assistance', detail: '2-hour kickoff call' },
        { icon: BookOpen, text: 'Advanced resources', detail: 'Live training sessions' }
      ]
    },
    {
      name: 'Enterprise',
      badge: 'Unlimited users',
      features: [
        { icon: MessageCircle, text: 'Dedicated support', detail: '4-hour response SLA' },
        { icon: Phone, text: '24/7 phone support', detail: 'Round-the-clock coverage' },
        { icon: CheckCircle, text: 'White-glove onboarding', detail: 'Full implementation support' },
        { icon: CheckCircle, text: 'Custom training', detail: 'Tailored to your team' },
        { icon: CheckCircle, text: 'Dedicated account manager', detail: 'Strategic partner' }
      ]
    }
  ] as SupportTier[]
};
