/**
 * Static content data for demo page tabs
 */

import {
  Mic,
  Phone,
  BarChart3,
  Link as LinkIcon,
  Smartphone,
  CheckCircle2,
  Users,
} from 'lucide-react';

export const demoFeatureCards = [
  {
    icon: Mic,
    title: 'Voice Apply',
    description: 'Candidates apply via voice in under 2 minutes',
    color: 'text-primary',
  },
  {
    icon: Phone,
    title: 'Instant Callbacks',
    description: 'AI contacts applicants within 3 minutes',
    color: 'text-green-500',
  },
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    description: 'Track cost-per-hire and source ROI',
    color: 'text-blue-500',
  },
  {
    icon: LinkIcon,
    title: '100+ Integrations',
    description: 'Tenstreet, Indeed, ZipRecruiter & more',
    color: 'text-purple-500',
  },
];

export const demoPlatformFeatures = [
  { label: 'Job Listings Management', included: true },
  { label: 'Application Tracking', included: true },
  { label: 'Visual Kanban Pipeline', included: true },
  { label: 'Talent Pool Management', included: true },
  { label: 'Activity Timeline & Tracking', included: true },
  { label: 'Communication History', included: true },
  { label: 'AI-Powered Screening', included: true },
  { label: 'Voice Agent Callbacks', included: true },
  { label: 'Analytics Dashboard', included: true },
  { label: 'ATS Integrations', included: true },
  { label: 'Custom Application Forms', included: true },
  { label: 'Team Collaboration', included: true },
];

export const demoApplicationSteps = [
  { icon: Smartphone, title: 'Apply', description: 'Candidate submits quick application' },
  { icon: Phone, title: 'AI Callback', description: 'Voice agent calls within 3 minutes' },
  { icon: CheckCircle2, title: 'Verify', description: 'Qualification questions answered' },
  { icon: Users, title: 'Connect', description: 'Qualified leads sent to your team' },
];
