/**
 * Features Section Content
 * Tiered feature structure: Primary (high-impact AI) and Secondary (platform capabilities)
 */

import { 
  Phone, 
  Mic, 
  Bot, 
  Zap, 
  Shield, 
  ShieldCheck,
  BarChart3, 
  Users, 
  Globe, 
  Kanban, 
  History, 
  Database,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Smartphone
} from 'lucide-react';
import { Feature, DetailedFeature } from './types';

export const featuresContent = {
  title: 'Everything You Need to Hire Better',
  description: 'AI-powered voice technology, visual pipeline management, and automation that transforms how you connect with jobseekers.',
  
  // Primary features (AI-powered, high-impact) - shown with detailed view
  primaryFeatures: [
    {
      icon: Phone,
      title: "Instant AI Callbacks",
      description: "Applications trigger automated voice calls within minutes. Never let a hot lead go cold — our AI reaches out before competitors even see the resume.",
      features: [
        "< 3 minute callback time",
        "Automated qualification questions",
        "Real-time lead scoring",
        "Seamless handoff to recruiters"
      ]
    },
    {
      icon: Bot,
      title: "24/7 AI Voice Agents",
      description: "Inbound and outbound voice agents that never sleep. Screen jobseekers, answer questions, and schedule interviews around the clock.",
      features: [
        "Natural conversational AI",
        "Inbound call handling",
        "Outbound screening calls",
        "Multi-language support"
      ]
    },
    {
      icon: Kanban,
      title: "Visual Kanban Pipeline",
      description: "Drag-and-drop candidates through hiring stages. See your entire pipeline at a glance with visual status columns.",
      features: [
        "Drag-and-drop interface",
        "Real-time status updates",
        "Visual pipeline overview",
        "Quick status changes"
      ]
    },
    {
      icon: Database,
      title: "Talent Pool Management",
      description: "Build and nurture talent pools for future hiring. Search candidates by skills, location, and availability.",
      features: [
        "Searchable candidate database",
        "Smart filtering & search",
        "Pool organization tools",
        "Notes & tagging"
      ]
    },
    {
      icon: Mic,
      title: "Voice Apply Technology",
      description: "Revolutionary voice-powered application process. Jobseekers apply using natural speech, reducing application time by 80%.",
      features: [
        "80% faster applications",
        "Improved accessibility",
        "Higher completion rates",
        "Mobile-optimized experience"
      ]
    },
    {
      icon: BarChart3,
      title: "AI-Powered Analytics",
      description: "Track cost-per-hire by source, predict time-to-hire trends, identify jobseeker drop-off points, and compare publisher ROI.",
      features: [
        "Real-time hiring metrics",
        "Predictive analytics",
        "Source ROI tracking",
        "Custom report builder"
      ]
    }
  ] as DetailedFeature[],
  
  // Secondary features (platform capabilities) - shown in compact grid
  secondaryFeatures: [
    {
      icon: History,
      title: "Activity Timeline",
      description: "Complete history of all candidate interactions"
    },
    {
      icon: MessageSquare,
      title: "Communication Hub",
      description: "Email, SMS, and call history in one place"
    },
    {
      icon: Zap,
      title: "Automated Workflows",
      description: "Smart interview scheduling and status updates"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "SOC 2 compliant with role-based access controls"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Real-time collaboration with notes and @mentions"
    },
    {
      icon: Globe,
      title: "Multi-Platform Distribution",
      description: "One-click posting to 100+ job boards"
    },
    {
      icon: Sparkles,
      title: "AI Writing Assistant",
      description: "Generate compelling job descriptions instantly"
    },
    {
      icon: TrendingUp,
      title: "Performance Insights",
      description: "Track recruiter productivity and outcomes"
    },
    {
      icon: Smartphone,
      title: "Mobile-First Design",
      description: "Full functionality on any device, anywhere"
    }
  ] as Feature[],
  
  // Legacy flat features array for backward compatibility
  features: [
    {
      icon: Mic,
      title: "Voice Apply Technology",
      description: "Revolutionary voice-powered application process. Jobseekers apply using natural speech, reducing application time by 80% and improving accessibility."
    },
    {
      icon: ShieldCheck,
      title: "Fraud Free & Secure By Design",
      description: "Advanced security with multi-factor authentication, dynamic knowledge-based authentication, identity proofing, and more."
    },
    {
      icon: Bot,
      title: "24/7 AI Voice Agents",
      description: "Inbound and outbound voice agents that never sleep. Screen jobseekers, answer questions, and schedule interviews around the clock."
    },
    {
      icon: Shield,
      title: "Compliance & Security",
      description: "Enterprise-grade security with full GDPR and EEO compliance, automated audit trails, and role-based access controls for data protection."
    },
    {
      icon: Globe,
      title: "Multi-Channel Distribution",
      description: "Integrate with Tenstreet, Indeed, Glassdoor, Adzuna, Talroo, and 100+ job boards. Automatic posting and real-time application syncing."
    }
  ] as Feature[]
};
