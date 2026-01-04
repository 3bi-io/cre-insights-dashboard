import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MoreHorizontal, ExternalLink, Truck, Briefcase } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PLATFORM_CONFIGS } from '@/features/platforms/constants/platformConfigs';
import { ResponsiveTableWrapper, ResponsiveCardWrapper } from '@/components/ui/responsive-data-display';

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
  // Mobile card for each platform
  const PlatformCard = ({ platform }: { platform: typeof PLATFORM_CONFIGS[0] }) => (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <PlatformLogo 
              src={platform.logo} 
              alt={`${platform.name} logo`}
              category={platform.category}
            />
            <div>
              <h4 className="font-medium text-foreground">{platform.name}</h4>
              <p className="text-xs text-blue-600 dark:text-blue-400">{platform.description}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {platform.status}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">Created: {platform.created}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2"
            onClick={() => window.open(`https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/job-feed-xml?platform=${encodeURIComponent(platform.name.toLowerCase())}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
            XML Feed
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Mobile Card View */}
      <ResponsiveCardWrapper className="p-4 space-y-3">
        {PLATFORM_CONFIGS.map((platform) => (
          <PlatformCard key={platform.name} platform={platform} />
        ))}
      </ResponsiveCardWrapper>

      {/* Desktop Table View */}
      <ResponsiveTableWrapper>
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
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
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
      </ResponsiveTableWrapper>
    </div>
  );
};

export default PlatformsTable;