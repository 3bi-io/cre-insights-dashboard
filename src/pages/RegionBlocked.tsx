/**
 * Region Blocked Page
 * Shown to visitors from OFAC-sanctioned countries OR outside the DFW service area.
 * Conditionally renders different messaging based on the block reason.
 */

import React from 'react';
import { GlobeIcon, ShieldAlert, Mail, ExternalLink, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useGeoBlocking } from '@/contexts/GeoBlockingContext';
import { SEO } from '@/components/SEO';

const RegionBlocked: React.FC = () => {
  const { country, countryCode, message, reason, distanceMiles, serviceAreaRadiusMiles } = useGeoBlocking();

  const isServiceArea = reason === 'outside_service_area';

  if (isServiceArea) {
    return (
      <>
        <SEO
          title="Outside Service Area"
          description="This platform is currently serving the Dallas-Fort Worth area."
          noindex={true}
        />

        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
          <Card className="max-w-lg w-full border-primary/30 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 relative">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-10 h-10 text-primary" />
                </div>
              </div>

              <CardTitle className="text-2xl font-bold text-foreground">
                We're Not in Your Area Yet
              </CardTitle>

              <CardDescription className="text-base mt-2">
                Apply AI is currently serving the{' '}
                <span className="font-semibold text-foreground">Dallas-Fort Worth</span>{' '}
                area within a {serviceAreaRadiusMiles ?? 200}-mile radius.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <Alert className="border-primary/30 bg-primary/5">
                <MapPin className="h-4 w-4 text-primary" />
                <AlertTitle className="text-foreground">Service Area Restriction</AlertTitle>
                <AlertDescription>
                  {distanceMiles
                    ? `Your location is approximately ${distanceMiles} miles from Dallas-Fort Worth, which is outside our current ${serviceAreaRadiusMiles ?? 200}-mile service area.`
                    : `Your location appears to be outside our current ${serviceAreaRadiusMiles ?? 200}-mile service area around Dallas-Fort Worth.`}
                </AlertDescription>
              </Alert>

              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  We're focused on delivering the best experience for the DFW metroplex
                  right now, but we're expanding soon. Stay tuned!
                </p>

                <div className="bg-muted/50 rounded-lg p-3 border">
                  <p className="font-medium text-foreground text-xs uppercase tracking-wide mb-1">
                    Current Coverage
                  </p>
                  <p className="text-sm">
                    Dallas-Fort Worth metroplex and surrounding areas within {serviceAreaRadiusMiles ?? 200} miles
                  </p>
                </div>
              </div>

              <Separator />

              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Interested in bringing Apply AI to your area? Let us know:
                </p>

                <a
                  href="mailto:hello@applyai.jobs?subject=Service%20Area%20Expansion%20Interest"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <Mail className="w-4 h-4" />
                  hello@applyai.jobs
                </a>

                {countryCode && (
                  <p className="text-xs text-muted-foreground/60 mt-4">
                    Detected location: {country || countryCode}
                    {distanceMiles ? ` (~${distanceMiles} mi from DFW)` : ''}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Default: OFAC sanctions block
  return (
    <>
      <SEO 
        title="Access Restricted"
        description="This platform is not available in your region due to US sanctions compliance."
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
              <AlertTitle>US Sanctions Compliance</AlertTitle>
              <AlertDescription>
                {message || 'Access to this platform is restricted in your country due to US Office of Foreign Assets Control (OFAC) sanctions regulations.'}
              </AlertDescription>
            </Alert>

            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                In compliance with US federal law and OFAC regulations, this platform 
                is unavailable in countries subject to comprehensive US sanctions programs.
              </p>
              
              <div className="bg-muted/50 rounded-lg p-3 border">
                <p className="font-medium text-foreground text-xs uppercase tracking-wide mb-1">
                  Sanctioned Countries
                </p>
                <p className="text-sm">
                  Russia, Iran, Cuba, North Korea, Syria, and Belarus
                </p>
              </div>

              <a
                href="https://ofac.treasury.gov/sanctions-programs-and-country-information"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                OFAC Sanctions Programs & Country Information
              </a>
            </div>

            <Separator />

            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                If you believe this restriction has been applied in error or have a 
                legitimate compliance inquiry, please contact our team:
              </p>
              
              <a 
                href="mailto:compliance@applyai.jobs?subject=OFAC%20Sanctions%20Access%20Inquiry"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Mail className="w-4 h-4" />
                compliance@applyai.jobs
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
