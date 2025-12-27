import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ExternalLink, Truck, Briefcase } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PLATFORM_CONFIGS } from '@/features/platforms/constants/platformConfigs';

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

// Simple image component for priority loading without flickering
const PlatformLogo = React.memo<{ 
  src: string; 
  alt: string; 
  category?: string;
}>(({ src, alt, category }) => {
  const [hasError, setHasError] = React.useState(false);
  
  // Use fallback icon based on category if image fails
  if (hasError) {
    const IconComponent = category === 'trucking' ? Truck : Briefcase;
    return (
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        <IconComponent className="w-4 h-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-8 h-8 rounded-full object-cover"
      width={32}
      height={32}
      loading="eager"
      decoding="sync"
      onError={() => setHasError(true)}
    />
  );
});

PlatformLogo.displayName = 'PlatformLogo';

const PlatformsTable: React.FC<PlatformsTableProps> = ({ platforms, onRefresh }) => {
  // Use centralized platform configs as single source of truth

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
            {PLATFORM_CONFIGS.map((platform) => (
              <tr key={platform.name} className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <PlatformLogo 
                      src={platform.logo} 
                      alt={`${platform.name} logo`}
                      category={platform.category}
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