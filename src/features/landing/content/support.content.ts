/**
 * Support Section Content
 * Unified support for all users - no subscription tiers
 */

import { CheckCircle, Clock, MessageCircle, Phone, Mail, BookOpen } from 'lucide-react';

export const supportContent = {
  title: 'Dedicated Support',
  description: 'Our team is here to ensure your success with comprehensive support for all users',
  footer: 'All users have access to our comprehensive knowledge base with setup guides, best practices, and integration documentation',
  features: [
    { icon: MessageCircle, text: 'Priority support', detail: '24-hour response time' },
    { icon: Phone, text: 'Phone support', detail: 'Business hours' },
    { icon: CheckCircle, text: 'Onboarding assistance', detail: 'Kickoff call included' },
    { icon: BookOpen, text: 'Knowledge base', detail: 'Self-service resources' },
    { icon: CheckCircle, text: 'Training sessions', detail: 'Live and on-demand' }
  ]
};
