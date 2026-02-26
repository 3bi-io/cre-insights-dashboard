import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Briefcase, Info, Bell, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const waitlistSchema = z.object({
  full_name: z.string().trim().max(100).optional(),
  email: z.string().trim().email('Please enter a valid email address').max(255),
  message: z.string().trim().max(500).optional(),
});

interface SimulationCompleteScreenProps {
  country?: string | null;
  countryCode?: string | null;
  jobListingId?: string | null;
  prefillEmail?: string;
  prefillName?: string;
  /** Called after a successful waitlist insert so the parent can log the analytics event */
  onWaitlistJoined?: () => void;
}

export const SimulationCompleteScreen = ({
  country,
  countryCode,
  jobListingId,
  prefillEmail = '',
  prefillName = '',
  onWaitlistJoined,
}: SimulationCompleteScreenProps) => {
  const countryLabel = country ? `from ${country}` : 'from your region';

  const [email, setEmail] = useState(prefillEmail);
  const [fullName, setFullName] = useState(prefillName);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = waitlistSchema.safeParse({ email, full_name: fullName, message });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? 'Please check your input');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('international_waitlist').insert({
        email: parsed.data.email,
        full_name: parsed.data.full_name || null,
        message: parsed.data.message || null,
        country: country ?? null,
        country_code: countryCode ?? null,
        job_listing_id: jobListingId ?? null,
      });

      if (error) throw error;
      setSubmitted(true);
      onWaitlistJoined?.(); // notify parent to log analytics event
      toast.success("You're on the waitlist! We'll reach out when international hiring opens.");
    } catch (err) {
      console.error('Waitlist insert error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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

        {/* ── Waitlist capture ── */}
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-muted/30 p-6 text-left">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">
                Get notified when international hiring opens
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Join the waitlist and we'll reach out as soon as Apply AI expands to your region.
            </p>

            {submitted ? (
              <div className="flex items-center gap-3 py-3 text-sm text-foreground">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                <span>
                  <strong>You're on the list!</strong> We'll email you at{' '}
                  <span className="font-mono">{email}</span> when we expand.
                </span>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="wl-name" className="text-xs">
                      Name <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="wl-name"
                      placeholder="Jane Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      maxLength={100}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="wl-email" className="text-xs">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="wl-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      maxLength={255}
                      required
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="wl-message" className="text-xs">
                    Anything to add? <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea
                    id="wl-message"
                    placeholder="Tell us your country, the type of driving role you're looking for, or anything else..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={500}
                    rows={2}
                    className="text-sm resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !email}
                  className="w-full h-9 gap-2 text-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Joining…
                    </>
                  ) : (
                    <>
                      <Bell className="h-3.5 w-3.5" />
                      Notify Me
                    </>
                  )}
                </Button>

                <p className="text-[10px] text-muted-foreground text-center">
                  No spam. One email when we launch internationally. Unsubscribe any time.
                </p>
              </form>
            )}
          </div>
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
            <Link to="/features">Learn More About Apply AI</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
