/**
 * Onboarding Section Content
 */

import { Rocket, Calendar, Settings, Users } from 'lucide-react';
import { OnboardingStep } from './types';

export const onboardingContent = {
  badge: 'Go Live in 48 Hours',
  title: 'Fast, Guided Implementation',
  description: 'Our streamlined onboarding process gets you up and running quickly, with expert guidance every step of the way',
  quickWinsTitle: 'What You Will Achieve Quickly',
  ctaTitle: 'Ready to Get Started?',
  ctaPrimary: 'Schedule Your Kickoff Call',
  ctaSecondary: 'View Implementation Guide',
  ctaFooter: 'No credit card required • 30-day free trial • Cancel anytime',
  steps: [
    {
      icon: Calendar,
      title: 'Day 1: Kickoff & Setup',
      time: '2 hours',
      tasks: [
        'Initial consultation call',
        'Account configuration',
        'User access setup',
        'Branding customization'
      ]
    },
    {
      icon: Settings,
      title: 'Day 2: Integration',
      time: '4-6 hours',
      tasks: [
        'Connect Tenstreet (if applicable)',
        'Job board integrations',
        'Email & calendar sync',
        'Data migration support'
      ]
    },
    {
      icon: Users,
      title: 'Day 3-5: Training',
      time: '3 hours',
      tasks: [
        'Admin training session',
        'Team member onboarding',
        'Best practices workshop',
        'Q&A and customization'
      ]
    },
    {
      icon: Rocket,
      title: 'Day 5+: Go Live',
      time: 'Ongoing',
      tasks: [
        'Launch your first jobs',
        'Monitor analytics',
        'Ongoing support',
        'Optimization recommendations'
      ]
    }
  ] as OnboardingStep[],
  quickWins: [
    'Post your first job in under 10 minutes',
    'Start receiving applications within 24 hours',
    'Full platform adoption in less than 1 week',
    'ROI visible within first month'
  ]
};
