import React, { useEffect } from 'react';
import { CheckCircle, Phone, Mail, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LogoAvatar, LogoAvatarImage } from '@/components/ui/logo-avatar';
import { useEmbedMode } from '@/hooks/useEmbedMode';

interface EmbedThankYouProps {
  applicationId?: string;
  clientName?: string;
  clientLogoUrl?: string;
  hasVoiceAgent?: boolean;
}

export const EmbedThankYou: React.FC<EmbedThankYouProps> = ({
  applicationId,
  clientName,
  clientLogoUrl,
  hasVoiceAgent = false,
}) => {
  const { notifyParent, hideBranding } = useEmbedMode();

  // Notify parent window of successful submission
  // Note: Using organizationName in postMessage for backward compatibility with embedders
  useEffect(() => {
    notifyParent({
      type: 'application_submitted',
      applicationId,
      organizationName: clientName,
    });
  }, [applicationId, clientName, notifyParent]);

  return (
    <div className="py-8 px-4">
      <Card className="max-w-lg mx-auto shadow-lg border-0 bg-background">
        <CardContent className="pt-8 pb-6 text-center">
          {/* Hero Logo */}
          {clientLogoUrl && (
            <div className="flex justify-center mb-4">
              <LogoAvatar size="xl" className="shadow-md">
                <LogoAvatarImage src={clientLogoUrl} alt={`${clientName || 'Company'} logo`} />
              </LogoAvatar>
            </div>
          )}

          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
          </div>

          {/* Main Message */}
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Application Submitted!
          </h1>
          
          <p className="text-muted-foreground mb-6">
            Thank you for applying
            {clientName && (
              <> to <span className="font-semibold text-foreground">{clientName}</span></>
            )}
            . We've received your application.
          </p>

          {/* What's Next Section */}
          <div className="bg-muted/50 rounded-lg p-4 text-left space-y-3">
            <h2 className="font-semibold text-foreground text-sm">What happens next?</h2>
            
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Check your email for a confirmation message
              </p>
            </div>

            {hasVoiceAgent && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  You may receive a call from our AI assistant for a brief phone screening
                </p>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                A recruiter will review your application and be in touch soon
              </p>
            </div>
          </div>

          {/* Application ID Reference */}
          {applicationId && (
            <p className="text-xs text-muted-foreground mt-6">
              Reference: {applicationId.slice(0, 8).toUpperCase()}
            </p>
          )}

          {/* Powered by branding */}
          {!hideBranding && (
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Powered by{' '}
                <a 
                  href="https://ats.me" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  ATS.me
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
