import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Briefcase, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SimulationCompleteScreenProps {
  country?: string | null;
}

export const SimulationCompleteScreen = ({ country }: SimulationCompleteScreenProps) => {
  const countryLabel = country ? `from ${country}` : 'from your region';

  return (
    <Card className="shadow-lg border-0 bg-background/95 backdrop-blur">
      <CardContent className="p-8 sm:p-12 flex flex-col items-center text-center gap-6">
        {/* Icon */}
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary">
          <Globe className="h-10 w-10" />
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Simulation Complete
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            You've previewed the full CDL driver application process. Unfortunately,
            applications {countryLabel} cannot be submitted at this time — this platform
            currently serves employers and job seekers in the Americas.
          </p>
        </div>

        {/* Info callout */}
        <div className="flex items-start gap-3 rounded-xl bg-muted/50 border border-border p-4 text-left max-w-md w-full">
          <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            No data was submitted or stored. This was a demo of our streamlined
            driver application experience.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Button asChild className="flex-1 h-12 gap-2">
            <Link to="/jobs">
              <Briefcase className="h-4 w-4" />
              View Available Jobs
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 h-12">
            <Link to="/features">Learn More About ATS.me</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
