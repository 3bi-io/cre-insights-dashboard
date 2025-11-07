/**
 * Features Section Content
 */

import { Brain, Zap, Shield, BarChart3, Users, Globe, Mic } from 'lucide-react';
import { Feature } from './types';

export const featuresContent = {
  title: 'Everything You Need to Hire Better',
  description: 'Powerful features designed to streamline your recruitment process and help you make data-driven hiring decisions.',
  features: [
    {
      icon: Mic,
      title: "Voice Apply Technology",
      description: "Revolutionary voice-powered application process that allows candidates to apply using natural speech, reducing application time by 80% and improving accessibility."
    },
    {
      icon: Brain,
      title: "AI-Powered Analytics",
      description: "Track cost-per-hire by source, predict time-to-hire trends, identify candidate drop-off points, and compare publisher ROI with real-time ML predictions."
    },
    {
      icon: Zap,
      title: "Automated Screening & Workflows",
      description: "Intelligent screening requests, automated background checks, and interview scheduling that reduce manual work by 95% while maintaining quality."
    },
    {
      icon: Shield,
      title: "Compliance & Security",
      description: "Enterprise-grade security with full GDPR and EEO compliance, automated audit trails, and role-based access controls for data protection."
    },
    {
      icon: BarChart3,
      title: "Advanced Reporting & Insights",
      description: "Real-time dashboards showing spend trends, platform performance, category breakdowns, and predictive analytics for hiring success rates."
    },
    {
      icon: Users,
      title: "Full Lifecycle Management",
      description: "Complete ATS covering job posting, applicant tracking, interview scheduling, offer management, and onboarding with seamless team collaboration."
    },
    {
      icon: Globe,
      title: "Multi-Channel Distribution",
      description: "Integrate with Tenstreet, Indeed, Glassdoor, Adzuna, Talroo, and 100+ job boards. Automatic posting and real-time application syncing."
    }
  ] as Feature[]
};
