/**
 * Features Section Content
 * Voice capabilities prioritized first
 */

import { Phone, Mic, Bot, Brain, Zap, Shield, BarChart3, Users, Globe } from 'lucide-react';
import { Feature } from './types';

export const featuresContent = {
  title: 'Everything You Need to Hire Better',
  description: 'AI-powered voice technology and automation that transforms how you connect with candidates.',
  features: [
    {
      icon: Phone,
      title: "Instant AI Callbacks",
      description: "Applications trigger automated voice calls within minutes. Never let a hot lead go cold — our AI reaches out before competitors even see the resume."
    },
    {
      icon: Bot,
      title: "24/7 AI Voice Agents",
      description: "Inbound and outbound voice agents that never sleep. Screen candidates, answer questions, and schedule interviews around the clock."
    },
    {
      icon: Mic,
      title: "Voice Apply Technology",
      description: "Revolutionary voice-powered application process. Candidates apply using natural speech, reducing application time by 80% and improving accessibility."
    },
    {
      icon: Brain,
      title: "AI-Powered Analytics",
      description: "Track cost-per-hire by source, predict time-to-hire trends, identify candidate drop-off points, and compare publisher ROI with real-time ML predictions."
    },
    {
      icon: Globe,
      title: "Multi-Channel Distribution",
      description: "Integrate with Tenstreet, Indeed, Glassdoor, Adzuna, Talroo, and 100+ job boards. Automatic posting and real-time application syncing."
    },
    {
      icon: Zap,
      title: "Automated Screening & Workflows",
      description: "Intelligent screening requests, automated background checks, and interview scheduling that reduce manual work by 95% while maintaining quality."
    },
    {
      icon: Users,
      title: "Full Lifecycle Management",
      description: "Complete ATS covering job posting, applicant tracking, interview scheduling, offer management, and onboarding with seamless team collaboration."
    },
    {
      icon: Shield,
      title: "Compliance & Security",
      description: "Enterprise-grade security with full GDPR and EEO compliance, automated audit trails, and role-based access controls for data protection."
    }
  ] as Feature[]
};
