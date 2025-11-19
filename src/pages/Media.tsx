
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Media = () => {
  const { userRole } = useAuth();

  if (userRole !== 'super_admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground">You need super admin permissions to access media assets.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Media Assets</h1>
          <p className="text-muted-foreground">
            Marketing materials and recruitment campaign assets
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Regional Driver Recruitment Campaign</CardTitle>
              <CardDescription>
                Square format image optimized for Facebook advertising
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="w-96 h-96 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-lg flex flex-col items-center justify-center text-white relative overflow-hidden">
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
        </div>
      </div>
    </div>
  );
};

export default Media;
