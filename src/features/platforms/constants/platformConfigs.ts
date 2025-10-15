import { PlatformConfig } from '../types';
import googleJobsLogo from '@/assets/google-jobs-logo.png';
import indeedLogo from '@/assets/indeed-logo.png';

export const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    name: 'Google Jobs',
    logo: googleJobsLogo,
    status: 'XML Feed Ready',
    description: 'Google Jobs XML Feed Integration',
    created: '7/29/2025',
    category: 'paid'
  },
  {
    name: 'Indeed',
    logo: indeedLogo,
    status: 'Indeed Ready',
    description: 'Indeed Reporting API',
    created: '6/12/2025',
    category: 'paid'
  },
  {
    name: 'Meta',
    logo: '/lovable-uploads/9d2222a9-c812-4222-ba8e-20535dc278b6.png',
    status: 'Meta Ready',
    description: 'Meta Business API',
    created: '7/1/2025',
    category: 'paid'
  },
  {
    name: 'X',
    logo: '/lovable-uploads/4eb0ffa4-7d5c-437d-bf75-d16a985e6189.png',
    status: 'Enhanced Integration',
    description: 'Enhanced Integration',
    created: '7/1/2025',
    category: 'paid'
  },
  {
    name: 'ZipRecruiter',
    logo: '/lovable-uploads/7d10dee2-7442-4d14-8a26-bb7f417bd5e8.png',
    status: 'ZipRecruiter Ready',
    description: 'ZipRecruiter API Integration',
    created: '6/12/2025',
    category: 'paid'
  },
  {
    name: 'Talroo',
    logo: '/lovable-uploads/2ba5a3f3-dba1-46c4-8caf-fe192c25c828.png',
    status: 'Talroo Ready',
    description: 'Talroo Platform Integration',
    created: '6/15/2025',
    category: 'paid'
  },
  // Trucking-Specific Free Platforms
  {
    name: 'Truck Driver Jobs 411',
    logo: 'https://cdn-icons-png.flaticon.com/512/1149/1149168.png',
    status: 'CDL Ready',
    description: 'Free Trucking Job Board - CDL Focused',
    created: '1/13/2025',
    category: 'trucking'
  },
  {
    name: 'NewJobs4You',
    logo: 'https://cdn-icons-png.flaticon.com/512/2917/2917995.png',
    status: 'CDL Ready',
    description: 'Free Transportation Jobs Board',
    created: '1/13/2025',
    category: 'trucking'
  },
  // General Free Platforms
  {
    name: 'Craigslist',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Craigslist.svg/128px-Craigslist.svg.png',
    status: 'RSS Feed Ready',
    description: 'Free Job Board with Local Focus',
    created: '1/12/2025',
    category: 'free'
  },
  {
    name: 'SimplyHired',
    logo: 'https://www.simplyhired.com/favicon.ico',
    status: 'XML Feed Ready',
    description: 'Free Job Aggregator Network',
    created: '1/12/2025',
    category: 'free'
  },
  {
    name: 'Glassdoor',
    logo: 'https://www.glassdoor.com/static/img/api/glassdoor_logo_80.png',
    status: 'API Ready',
    description: 'Company Reviews & Jobs Platform',
    created: '1/12/2025',
    category: 'free'
  },
  {
    name: 'Dice',
    logo: 'https://www.dice.com/favicon.ico',
    status: 'Tech Jobs Ready',
    description: 'Technology Job Marketplace',
    created: '1/12/2025',
    category: 'free'
  },
  {
    name: 'FlexJobs',
    logo: 'https://www.flexjobs.com/favicon.ico',
    status: 'Remote Ready',
    description: 'Remote & Flexible Job Board',
    created: '1/12/2025',
    category: 'free'
  }
];

export const DATE_RANGE_OPTIONS = [
  { value: 'last_7d', label: 'Last 7 Days' },
  { value: 'last_14d', label: 'Last 14 Days' },
  { value: 'last_30d', label: 'Last 30 Days' },
  { value: 'last_60d', label: 'Last 60 Days' },
  { value: 'last_90d', label: 'Last 90 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
] as const;
