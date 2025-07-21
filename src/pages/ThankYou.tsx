
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const ThankYou = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="mb-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-foreground mb-2">Thank You!</h1>
                <p className="text-lg text-muted-foreground">Your application has been submitted successfully.</p>
              </div>
              
              <div className="space-y-4 mb-8">
                <p className="text-foreground">
                  We've received your driver application and our team will review it shortly.
                </p>
                <p className="text-muted-foreground">
                  You should receive a confirmation email within the next few minutes. 
                  If you don't see it, please check your spam folder.
                </p>
                <p className="text-muted-foreground">
                  Our recruiters will contact you within 24-48 hours to discuss next steps.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">What happens next?</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 text-left">
                    <li>• Application review (1-2 business days)</li>
                    <li>• Phone screening with our team</li>
                    <li>• Background and reference checks</li>
                    <li>• Final interview and job offer</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/">
                    <Button variant="outline">
                      Back to Home
                    </Button>
                  </Link>
                  <Link to="/apply">
                    <Button>
                      Submit Another Application
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
