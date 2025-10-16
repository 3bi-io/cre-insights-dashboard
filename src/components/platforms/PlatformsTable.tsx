import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ExternalLink } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LazyImage } from '@/components/optimized/LazyImage';

interface Platform {
  id: string;
  name: string;
  logo_url: string | null;
  api_endpoint: string | null;
  created_at: string;
}

interface PlatformsTableProps {
  platforms: Platform[] | undefined;
  onRefresh: () => void;
}

const PlatformsTable: React.FC<PlatformsTableProps> = ({ platforms, onRefresh }) => {
  // Define available platforms with their details
  const availablePlatforms = [
    {
      name: 'Google Jobs',
      logo: '/logos/google-jobs-logo.png',
      status: 'XML Feed Ready',
      description: 'Google Jobs XML Feed Integration',
      created: '7/29/2025'
    },
    {
      name: 'Indeed',
      logo: '/logos/indeed-logo.png',
      status: 'Indeed Ready',
      description: 'Indeed Reporting API',
      created: '6/12/2025'
    },
    {
      name: 'Meta',
      logo: '/lovable-uploads/9d2222a9-c812-4222-ba8e-20535dc278b6.png',
      status: 'Meta Ready',
      description: 'Meta Business API',
      created: '7/1/2025'
    },
    {
      name: 'X',
      logo: '/lovable-uploads/4eb0ffa4-7d5c-437d-bf75-d16a985e6189.png',
      status: 'Enhanced Integration',
      description: 'Enhanced Integration',
      created: '7/1/2025'
    },
    {
      name: 'ZipRecruiter',
      logo: '/lovable-uploads/7d10dee2-7442-4d14-8a26-bb7f417bd5e8.png',
      status: 'ZipRecruiter Ready',
      description: 'ZipRecruiter API Integration',
      created: '6/12/2025'
    },
    {
      name: 'Talroo',
      logo: '/lovable-uploads/2ba5a3f3-dba1-46c4-8caf-fe192c25c828.png',
      status: 'Talroo Ready',
      description: 'Talroo Platform Integration',
      created: '6/15/2025'
    },
    // Trucking-Specific Free Platforms
    {
      name: 'Truck Driver Jobs 411',
      logo: 'https://cdn-icons-png.flaticon.com/512/1149/1149168.png',
      status: 'CDL Ready',
      description: 'Free Trucking Job Board - CDL Focused',
      created: '1/13/2025'
    },
    {
      name: 'NewJobs4You',
      logo: 'https://cdn-icons-png.flaticon.com/512/2917/2917995.png',
      status: 'CDL Ready',
      description: 'Free Transportation Jobs Board',
      created: '1/13/2025'
    },
    // General Free Platforms
    {
      name: 'Craigslist',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Craigslist.svg/128px-Craigslist.svg.png',
      status: 'RSS Feed Ready',
      description: 'Free Job Board with Local Focus',
      created: '1/12/2025'
    },
    {
      name: 'SimplyHired',
      logo: 'https://www.simplyhired.com/favicon.ico',
      status: 'XML Feed Ready',
      description: 'Free Job Aggregator Network',
      created: '1/12/2025'
    },
    {
      name: 'Glassdoor',
      logo: 'https://www.glassdoor.com/static/img/api/glassdoor_logo_80.png',
      status: 'API Ready',
      description: 'Company Reviews & Jobs Platform',
      created: '1/12/2025'
    },
    {
      name: 'Dice',
      logo: 'https://www.dice.com/favicon.ico',
      status: 'Tech Jobs Ready',
      description: 'Technology Job Marketplace',
      created: '1/12/2025'
    },
    {
      name: 'FlexJobs',
      logo: 'https://www.flexjobs.com/favicon.ico',
      status: 'Remote Ready',
      description: 'Remote & Flexible Job Board',
      created: '1/12/2025'
    }
  ];

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Platform</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {availablePlatforms.map((platform, index) => (
              <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <LazyImage 
                      src={platform.logo} 
                      alt={`${platform.name} logo`}
                      className="w-8 h-8 rounded-full object-cover"
                      skeleton={false}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{platform.name}</span>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-blue-600 dark:text-blue-400">{platform.description}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <Badge variant="outline" className="text-xs">
                    {platform.status}
                  </Badge>
                </td>
                <td className="py-4 px-4">
                  <span className="text-muted-foreground text-sm">
                    {platform.created}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => window.open(`https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/job-feed-xml?platform=${encodeURIComponent(platform.name.toLowerCase())}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        XML Feed URL
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlatformsTable;