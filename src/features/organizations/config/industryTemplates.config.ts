/**
 * Industry Template Configuration
 * Pre-built configurations for each industry vertical
 */

import { IndustryTemplateConfig, IndustryVerticalOption } from '../types/industryTemplates.types';

export const INDUSTRY_TEMPLATES: Record<string, IndustryTemplateConfig> = {
  transportation: {
    vertical: 'transportation',
    displayName: 'Transportation',
    description: 'Trucking, logistics, and CDL driver recruitment',
    icon: 'Truck',
    defaultPlatforms: [
      'google_jobs',
      'indeed',
      'truck_driver_jobs_411',
      'newjobs4you',
      'road_warriors',
    ],
    defaultFeatures: [
      { name: 'voice_agent', enabled: true },
      { name: 'tenstreet', enabled: true },
      { name: 'elevenlabs', enabled: true },
    ],
    aiPromptHints: {
      industryContext: 'CDL commercial driving and trucking industry',
      terminology: ['CDL', 'DOT', 'hazmat', 'tanker', 'OTR', 'regional', 'local'],
      screeningFocus: [
        'CDL class and endorsements',
        'DOT compliance history',
        'Driving experience years',
        'Accident and violation history',
      ],
    },
    valueProposition: 'Screen CDL drivers in minutes, not days',
  },
  healthcare: {
    vertical: 'healthcare',
    displayName: 'Healthcare',
    description: 'Medical, nursing, and healthcare professional recruitment',
    icon: 'HeartPulse',
    defaultPlatforms: ['google_jobs', 'indeed', 'glassdoor'],
    defaultFeatures: [
      { name: 'voice_agent', enabled: true },
      { name: 'background_check', enabled: true },
      { name: 'advanced_analytics', enabled: true },
    ],
    aiPromptHints: {
      industryContext: 'Healthcare and medical professional recruitment',
      terminology: ['RN', 'LPN', 'CNA', 'NP', 'PA', 'licensure', 'certification', 'HIPAA'],
      screeningFocus: [
        'Professional licensure verification',
        'Certification status',
        'Shift flexibility',
        'HIPAA compliance awareness',
      ],
    },
    valueProposition: 'Verify licenses and certifications instantly',
  },
  cyber: {
    vertical: 'cyber',
    displayName: 'Cybersecurity',
    description: 'IT security, compliance, and cyber professional recruitment',
    icon: 'Shield',
    defaultPlatforms: ['google_jobs', 'indeed'],
    defaultFeatures: [
      { name: 'openai', enabled: true },
      { name: 'anthropic', enabled: true },
      { name: 'advanced_analytics', enabled: true },
    ],
    aiPromptHints: {
      industryContext: 'Cybersecurity and IT security professional recruitment',
      terminology: ['CISSP', 'CISM', 'CEH', 'SOC', 'SIEM', 'penetration testing', 'compliance', 'clearance'],
      screeningFocus: [
        'Security certifications',
        'Clearance level',
        'Technical skills assessment',
        'Remote work capability',
      ],
    },
    valueProposition: 'Match cleared talent to classified roles faster',
  },
  trades: {
    vertical: 'trades',
    displayName: 'Skilled Trades',
    description: 'Construction, electrical, plumbing, and skilled trades recruitment',
    icon: 'Wrench',
    defaultPlatforms: ['google_jobs', 'indeed', 'craigslist'],
    defaultFeatures: [
      { name: 'voice_agent', enabled: true },
      { name: 'background_check', enabled: true },
    ],
    aiPromptHints: {
      industryContext: 'Skilled trades and construction industry recruitment',
      terminology: ['journeyman', 'apprentice', 'master', 'OSHA', 'union', 'non-union', 'license'],
      screeningFocus: [
        'Trade certifications',
        'Apprenticeship completion',
        'Tool ownership',
        'Union membership status',
      ],
    },
    valueProposition: 'Find certified tradespeople ready to work',
  },
  general: {
    vertical: 'general',
    displayName: 'General',
    description: 'General purpose recruitment across industries',
    icon: 'Building',
    defaultPlatforms: ['google_jobs', 'indeed'],
    defaultFeatures: [{ name: 'voice_agent', enabled: true }],
    aiPromptHints: {
      industryContext: 'General professional recruitment',
      terminology: [],
      screeningFocus: ['Work authorization', 'Experience level', 'Availability'],
    },
    valueProposition: 'Streamline hiring across any industry',
  },
};

export const INDUSTRY_VERTICAL_OPTIONS: IndustryVerticalOption[] = [
  {
    value: 'transportation',
    label: 'Transportation',
    description: 'Trucking, logistics, and CDL driver recruitment',
    icon: 'Truck',
    features: ['Tenstreet Integration', 'Voice Agent', 'CDL-focused Job Boards'],
  },
  {
    value: 'healthcare',
    label: 'Healthcare',
    description: 'Medical, nursing, and healthcare professionals',
    icon: 'HeartPulse',
    features: ['Background Checks', 'Licensure Verification', 'Advanced Analytics'],
  },
  {
    value: 'cyber',
    label: 'Cybersecurity',
    description: 'IT security and compliance professionals',
    icon: 'Shield',
    features: ['AI Screening', 'Certification Focus', 'Clearance Tracking'],
  },
  {
    value: 'trades',
    label: 'Skilled Trades',
    description: 'Construction, electrical, and skilled trades',
    icon: 'Wrench',
    features: ['Voice Agent', 'Background Checks', 'Apprenticeship Tracking'],
  },
  {
    value: 'general',
    label: 'General',
    description: 'General purpose recruitment',
    icon: 'Building',
    features: ['Basic Features', 'Standard Job Boards'],
  },
];

export const getIndustryTemplate = (vertical: string): IndustryTemplateConfig => {
  return INDUSTRY_TEMPLATES[vertical] || INDUSTRY_TEMPLATES.general;
};

export const getIndustryVerticalOption = (vertical: string): IndustryVerticalOption | undefined => {
  return INDUSTRY_VERTICAL_OPTIONS.find((opt) => opt.value === vertical);
};
