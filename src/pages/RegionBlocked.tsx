/**
 * Region Blocked Page
 * Firm alert page for visitors from restricted geographic regions
 * No navigation options provided to prevent circumvention attempts
 */

import React from 'react';
import { GlobeIcon, ShieldAlert, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useGeoBlocking } from '@/contexts/GeoBlockingContext';
import { SEO } from '@/components/SEO';

const RegionBlocked: React.FC = () => {
  const { country, countryCode, allowedRegions, message } = useGeoBlocking();

  return (
    <>
      <SEO 
        title="Access Restricted"
        description="This platform is not available in your region."
        noindex={true}
      />
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/5 via-background to-destructive/10 p-4">
        <Card className="max-w-lg w-full border-destructive/30 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 relative">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <GlobeIcon className="w-10 h-10 text-destructive" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-destructive flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-destructive-foreground" />
              </div>
            </div>
            
            <CardTitle className="text-2xl font-bold text-destructive">
              Access Restricted
            </CardTitle>
            
            <CardDescription className="text-base mt-2">
              This platform is not available in{' '}
              <span className="font-semibold text-foreground">
                {country || countryCode || 'your region'}
              </span>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Alert variant="destructive" className="border-destructive/50">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Geographic Restriction</AlertTitle>
              <AlertDescription>
                {message || 'For data protection and regulatory compliance, access to this platform is restricted based on geographic location.'}
              </AlertDescription>
            </Alert>

            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Due to strict data protection requirements and regulatory compliance 
                for handling personally identifiable information (PII), this platform 
                is only available to users in:
              </p>
              
              <div className="bg-muted/50 rounded-lg p-3 border">
                <p className="font-medium text-foreground">
                  {allowedRegions || 'North America and South America'}
                </p>
                <p className="text-xs mt-1">
                  Including Greenland, Canada, the United States, Mexico, Central America, 
                  the Caribbean, and all South American countries.
                </p>
              </div>
            </div>

            <Separator />

            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                If you believe this is an error or have a legitimate business inquiry, 
                please contact our compliance team:
              </p>
              
              <a 
                href="mailto:compliance@ats.me?subject=Geographic%20Access%20Request"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Mail className="w-4 h-4" />
                compliance@ats.me
              </a>
              
              {countryCode && (
                <p className="text-xs text-muted-foreground/60 mt-4">
                  Detected location: {countryCode}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default RegionBlocked;
