
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Globe, Edit, Trash2, Settings, MessageCircle, Activity } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Platform {
  id: string;
  name: string;
  logo_url: string | null;
  api_endpoint: string | null;
  created_at: string;
}

interface PlatformCardProps {
  platform: Platform;
  onSetup: (platform: Platform) => void;
  onDelete: (platformId: string, platformName: string) => void;
}

const PlatformCard: React.FC<PlatformCardProps> = ({ platform, onSetup, onDelete }) => {
  const isXPlatform = platform.name.toLowerCase().includes('x') || platform.name.toLowerCase().includes('twitter');
  const isMetaPlatform = platform.name.toLowerCase().includes('meta') || platform.name.toLowerCase().includes('facebook');

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          {platform.logo_url ? (
            <img 
              src={platform.logo_url} 
              alt={platform.name}
              className="w-8 h-8 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              {isXPlatform ? (
                <MessageCircle className="w-4 h-4 text-blue-500" />
              ) : isMetaPlatform ? (
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">M</span>
                </div>
              ) : (
                <Globe className="w-4 h-4 text-primary" />
              )}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{platform.name}</span>
            {isXPlatform && (
              <div className="flex items-center gap-1 mt-1">
                <Activity className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-blue-600 dark:text-blue-400">Enhanced Integration</span>
              </div>
            )}
            {isMetaPlatform && (
              <div className="flex items-center gap-1 mt-1">
                <Activity className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-blue-600 dark:text-blue-400">Meta Business API</span>
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <span className="text-muted-foreground font-mono text-sm">
          {platform.api_endpoint || 'Not configured'}
        </span>
      </td>
      <td className="py-4 px-4">
        <div className="flex flex-col gap-1">
          <Badge variant={platform.api_endpoint ? 'default' : 'secondary'}>
            {platform.api_endpoint ? 'Configured' : 'Setup Required'}
          </Badge>
          {isXPlatform && platform.api_endpoint && (
            <Badge variant="outline" className="text-xs">
              API Ready
            </Badge>
          )}
          {isMetaPlatform && (
            <Badge variant="outline" className="text-xs">
              Meta Ready
            </Badge>
          )}
        </div>
      </td>
      <td className="py-4 px-4">
        <span className="text-muted-foreground text-sm">
          {new Date(platform.created_at).toLocaleDateString()}
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
            <DropdownMenuItem onClick={() => onSetup(platform)}>
              <Settings className="w-4 h-4 mr-2" />
              Setup Platform
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="w-4 h-4 mr-2" />
              Edit Platform
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => onDelete(platform.id, platform.name)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Platform
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
};

export default PlatformCard;
