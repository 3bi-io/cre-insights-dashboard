import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import AdminPageLayout from '@/features/shared/components/AdminPageLayout';
import { supabase } from '@/integrations/supabase/client';

const Media = () => {
  const [foundersPassCreatives, setFoundersPassCreatives] = useState<Array<{
    id: string;
    headline: string;
    media_url: string | null;
    created_at: string | null;
    status: string;
  }>>([]);

  useEffect(() => {
    const fetchCreatives = async () => {
      const { data } = await supabase
        .from('generated_ad_creatives')
        .select('id, headline, media_url, created_at, status')
        .eq('job_type', 'founders_pass')
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setFoundersPassCreatives(data);
    };
    fetchCreatives();
  }, []);

  return (
    <AdminPageLayout
      title="Media Assets"
      description="Marketing materials and recruitment campaign assets"
      requiredRole="super_admin"
    >
      <div className="grid gap-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Regional Driver Recruitment Campaign</CardTitle>
            <CardDescription>
              Square format image optimized for Facebook advertising
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="w-full max-w-[384px] aspect-square bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-lg flex flex-col items-center justify-center text-white relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-full h-full" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat'
                  }}></div>
                </div>
                
                {/* Content */}
                <div className="relative z-10 text-center px-6">
                  <div className="mb-4">
                    <img 
                      src="/lovable-uploads/8d8eed20-4fcb-4be0-adba-5d8a3a949c9e.png" 
                      alt="C.R. England" 
                      className="h-12 w-auto mx-auto mb-2 brightness-0 invert"
                    />
                  </div>
                  
                  <h2 className="text-2xl font-bold mb-2">
                    REGIONAL DRIVERS
                  </h2>
                  <h3 className="text-xl font-semibold mb-4">
                    WANTED
                  </h3>
                  
                  <div className="space-y-2 text-sm mb-4">
                    <p className="flex items-center justify-center gap-2">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                      Home Weekly
                    </p>
                    <p className="flex items-center justify-center gap-2">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                      Competitive Pay
                    </p>
                    <p className="flex items-center justify-center gap-2">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                      Great Benefits
                    </p>
                  </div>
                  
                  <div className="bg-yellow-400 text-blue-900 px-4 py-2 rounded-full font-bold text-sm">
                    APPLY NOW
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Dimensions: 1080x1080px (Square format for Facebook)
                </p>
                <p className="text-xs text-muted-foreground">
                  Right-click and "Save image as..." to download
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Founders Pass AI-Generated Creatives */}
        {foundersPassCreatives.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Founders Pass — AI-Generated Creatives</CardTitle>
              <CardDescription>
                Cinematic 16:9 images generated via Gemini Pro for Social Beacon distribution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {foundersPassCreatives.map((creative) => (
                <div key={creative.id} className="space-y-2">
                  {creative.media_url && (
                    <div className="relative rounded-lg overflow-hidden border border-border">
                      <img
                        src={creative.media_url}
                        alt={creative.headline}
                        className="w-full aspect-video object-cover"
                      />
                      <Badge className="absolute top-2 right-2" variant="secondary">
                        {creative.status}
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{creative.headline}</p>
                    {creative.media_url && (
                      <a
                        href={creative.media_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {creative.created_at ? new Date(creative.created_at).toLocaleDateString() : ''}
                    {' · '}16:9 Landscape · Gemini Pro
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminPageLayout>
  );
};

export default Media;
