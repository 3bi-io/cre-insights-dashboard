
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PlatformSetupDialog from './PlatformSetupDialog';
import XPlatformActions from './XPlatformActions';
import MetaPlatformActions from './MetaPlatformActions';
import EmptyPlatformsState from './EmptyPlatformsState';
import PlatformsTableHeader from './PlatformsTableHeader';
import PlatformCard from './PlatformCard';

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
        description: `${platformName} platform deleted successfully`,
      });
      
      onRefresh();
    } catch (error) {
      console.error('Error deleting platform:', error);
      toast({
        title: "Error",
        description: "Failed to delete platform. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSetupSuccess = () => {
    setSetupPlatform(null);
    onRefresh();
  };

  if (!platforms || platforms.length === 0) {
    return <EmptyPlatformsState />;
  }

  return (
    <>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <PlatformsTableHeader />
            <tbody>
              {platforms.map((platform) => (
                <PlatformCard
                  key={platform.id}
                  platform={platform}
                  onSetup={setSetupPlatform}
                  onDelete={handleDeletePlatform}
                />
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
      
      {platforms && platforms.some(p => 
        (p.name.toLowerCase().includes('x') || p.name.toLowerCase().includes('twitter')) && p.api_endpoint
      ) && (
        <XPlatformActions 
          platform={platforms.find(p => 
            (p.name.toLowerCase().includes('x') || p.name.toLowerCase().includes('twitter')) && p.api_endpoint
          )!}
          onRefresh={onRefresh}
        />
      )}
      
      {platforms && platforms.some(p => 
        p.name.toLowerCase().includes('meta') || p.name.toLowerCase().includes('facebook')
      ) && (
        <MetaPlatformActions 
          platform={platforms.find(p => 
            p.name.toLowerCase().includes('meta') || p.name.toLowerCase().includes('facebook')
          )!}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
};

export default PlatformsTable;
