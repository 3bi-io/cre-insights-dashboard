import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Phone, Clock, ArrowLeft } from "lucide-react";
import { SEO } from '@/components/SEO';
interface ThankYouState {
  organizationName?: string;
  hasVoiceAgent?: boolean;
}

const ThankYou = () => {
  const location = useLocation();
  const state = location.state as ThankYouState | null;
  
  const organizationName = state?.organizationName || 'our team';
  const hasVoiceAgent = state?.hasVoiceAgent ?? false;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <SEO
        title="Application Submitted Successfully"
        description="Thank you for your application. We've received your information and will be in touch shortly."
        noindex={true}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="mb-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-foreground mb-2">Thank You!</h1>
                <p className="text-lg text-muted-foreground">Your application has been submitted successfully.</p>
              </div>
              
              <div className="space-y-4 mb-8 text-left bg-muted/50 rounded-lg p-6">
                <h2 className="font-semibold text-foreground text-center mb-4">What happens next?</h2>
                
                {hasVoiceAgent ? (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-foreground font-medium">Expect a call shortly</p>
                      <p className="text-sm text-muted-foreground">
                        You'll receive a phone call from {organizationName} within the next few minutes to discuss your application.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-foreground font-medium">We'll be in touch soon</p>
                      <p className="text-sm text-muted-foreground">
                        A recruiter from {organizationName} will contact you within 24-48 hours to discuss next steps.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="pt-2 border-t border-border mt-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Please keep your phone nearby and check for calls from unknown numbers.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Link to="/">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
