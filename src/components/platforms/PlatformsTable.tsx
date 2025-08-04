
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MoreHorizontal, Globe, Edit, Trash2, Settings, MessageCircle, Activity, ExternalLink } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PlatformSetupDialog from './PlatformSetupDialog';
import XPlatformActions from './XPlatformActions';
import MetaPlatformActions from './MetaPlatformActions';
import IndeedPlatformActions from './IndeedPlatformActions';

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

const PlatformsTable: React.FC<PlatformsTableProps> = ({
  platforms,
  onRefresh
}) => {
  const [setupPlatform, setSetupPlatform] = useState<Platform | null>(null);
  const { toast } = useToast();

  const handleDeletePlatform = async (platformId: string, platformName: string) => {
    try {
      const { error } = await supabase
        .from('platforms')
        .delete()
        .eq('id', platformId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${platformName} platform deleted successfully`
      });
      onRefresh();
    } catch (error) {
      console.error('Error deleting platform:', error);
      toast({
        title: "Error",
        description: "Failed to delete platform. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSetupSuccess = () => {
    setSetupPlatform(null);
    onRefresh();
  };

  if (!platforms || platforms.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12 px-4">
          <div className="text-gray-500 mb-4">
            <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No platforms found</h3>
            <p className="text-sm sm:text-base">Get started by adding your first advertising platform.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
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
              {platforms.map(platform => (
                <tr key={platform.id} className="border-b border-border hover:bg-muted/50 transition-colors">
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
                          {platform.name.toLowerCase().includes('x') || platform.name.toLowerCase().includes('twitter') ? (
                            <MessageCircle className="w-4 h-4 text-blue-500" />
                          ) : platform.name.toLowerCase().includes('meta') || platform.name.toLowerCase().includes('facebook') ? (
                            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-white font-bold text-xs">M</span>
                            </div>
                          ) : platform.name.toLowerCase().includes('indeed') ? (
                            <img 
                              src="/lovable-uploads/00cf88bc-aaab-4e8e-8908-3bfd7c363516.png" 
                              alt="Indeed" 
                              className="w-4 h-4"
                            />
                          ) : (
                            <Globe className="w-4 h-4 text-primary" />
                          )}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{platform.name}</span>
                        {(platform.name.toLowerCase().includes('x') || platform.name.toLowerCase().includes('twitter')) && (
                          <div className="flex items-center gap-1 mt-1">
                            <Activity className="w-3 h-3 text-blue-500" />
                            <span className="text-xs text-blue-600 dark:text-blue-400">Enhanced Integration</span>
                          </div>
                        )}
                        {(platform.name.toLowerCase().includes('meta') || platform.name.toLowerCase().includes('facebook')) && (
                          <div className="flex items-center gap-1 mt-1">
                            <Activity className="w-3 h-3 text-blue-500" />
                            <span className="text-xs text-blue-600 dark:text-blue-400">Meta Business API</span>
                          </div>
                        )}
                        {platform.name.toLowerCase().includes('indeed') && (
                          <div className="flex items-center gap-1 mt-1">
                            <Activity className="w-3 h-3 text-blue-600" />
                            <span className="text-xs text-blue-600 dark:text-blue-400">Indeed Reporting API</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1">
                      {(platform.name.toLowerCase().includes('x') || platform.name.toLowerCase().includes('twitter')) && platform.api_endpoint && (
                        <Badge variant="outline" className="text-xs">
                          API Ready
                        </Badge>
                      )}
                      {(platform.name.toLowerCase().includes('meta') || platform.name.toLowerCase().includes('facebook')) && (
                        <Badge variant="outline" className="text-xs">
                          Meta Ready
                        </Badge>
                      )}
                      {platform.name.toLowerCase().includes('indeed') && (
                        <Badge variant="outline" className="text-xs">
                          Indeed Ready
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
                        <DropdownMenuItem onClick={() => setSetupPlatform(platform)}>
                          <Settings className="w-4 h-4 mr-2" />
                          Setup Platform
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open(`https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/job-feed-xml?platform=${encodeURIComponent(platform.name.toLowerCase())}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          XML Feed URL
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Platform
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600" 
                          onClick={() => handleDeletePlatform(platform.id, platform.name)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Platform
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

      <PlatformSetupDialog 
        open={!!setupPlatform} 
        onOpenChange={(open) => !open && setSetupPlatform(null)} 
        platform={setupPlatform} 
        onSuccess={handleSetupSuccess} 
      />
      
      {platforms && platforms.some(p => (p.name.toLowerCase().includes('x') || p.name.toLowerCase().includes('twitter')) && p.api_endpoint) && (
        <XPlatformActions 
          platform={platforms.find(p => (p.name.toLowerCase().includes('x') || p.name.toLowerCase().includes('twitter')) && p.api_endpoint)!} 
          onRefresh={onRefresh} 
        />
      )}
      
      {platforms && platforms.some(p => p.name.toLowerCase().includes('meta') || p.name.toLowerCase().includes('facebook')) && (
        <MetaPlatformActions 
          platform={platforms.find(p => p.name.toLowerCase().includes('meta') || p.name.toLowerCase().includes('facebook'))!} 
          onRefresh={onRefresh} 
        />
      )}
      
      {platforms && platforms.some(p => p.name.toLowerCase().includes('indeed')) && (
        <IndeedPlatformActions />
      )}
    </>
  );
};

export default PlatformsTable;
