import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Bell, Mail, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const MessagesPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">
          Communicate with employers
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="border-dashed">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Messaging Coming Soon</CardTitle>
            <CardDescription className="text-base">
              We're building a seamless way for you to communicate directly with employers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Email Notifications</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Get notified when employers respond to your applications
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Bell className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Stay Updated</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enable notifications to never miss important updates
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button asChild variant="default">
                <Link to="/my-jobs/notifications">
                  <Bell className="h-4 w-4 mr-2" />
                  Set Up Notifications
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/contact">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Contact Support
                </Link>
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground pt-4 border-t">
              In the meantime, employers may contact you via the email address in your profile.
              Make sure your contact information is up to date.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MessagesPage;
