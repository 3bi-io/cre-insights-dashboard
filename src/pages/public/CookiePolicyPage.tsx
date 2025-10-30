import React from 'react';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Cookie } from 'lucide-react';

const CookiePolicyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Cookie Policy | How We Use Cookies"
        description="Learn how ATS.me uses cookies to enhance your experience. Cookie types, purposes, and how to manage cookie preferences."
        keywords="cookie policy, cookies, website tracking, privacy preferences"
        canonical="https://ats.me/cookie-policy"
        noindex={true}
      />
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-primary/5 bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Cookie className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6">
            Cookie Policy
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Last updated: December 2024
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            
            <Alert>
              <Cookie className="h-4 w-4" />
              <AlertDescription>
                This Cookie Policy explains how ATS Intel uses cookies and similar technologies 
                to recognize you when you visit our platform.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>What Are Cookies?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Cookies are small data files that are placed on your computer or mobile device 
                  when you visit a website. Cookies are widely used by website owners to make 
                  their websites work more efficiently, as well as to provide reporting information 
                  and enhance user experience.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How We Use Cookies</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  We use cookies for several reasons. Some cookies are required for technical 
                  reasons for our platform to operate, and we refer to these as "essential" 
                  or "strictly necessary" cookies. Other cookies enable us to track and target 
                  the interests of our users to enhance the experience on our platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Types of Cookies We Use</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge variant="default">Essential Cookies</Badge>
                  </div>
                  <p className="text-muted-foreground">
                    These cookies are strictly necessary to provide you with services available 
                    through our platform and to use some of its features, such as access to 
                    secure areas.
                  </p>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Examples:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Authentication cookies (keep you logged in)</li>
                      <li>• Security cookies (prevent fraud)</li>
                      <li>• Session cookies (maintain your session)</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge variant="secondary">Performance Cookies</Badge>
                  </div>
                  <p className="text-muted-foreground">
                    These cookies allow us to count visits and traffic sources so we can measure 
                    and improve the performance of our platform. They help us to know which pages 
                    are the most and least popular and see how visitors move around the platform.
                  </p>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Examples:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Google Analytics cookies</li>
                      <li>• Page load time tracking</li>
                      <li>• Error monitoring cookies</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge variant="outline">Functional Cookies</Badge>
                  </div>
                  <p className="text-muted-foreground">
                    These cookies enable the platform to provide enhanced functionality and 
                    personalization. They may be set by us or by third-party providers whose 
                    services we have added to our pages.
                  </p>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Examples:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Language preference cookies</li>
                      <li>• Theme preference cookies</li>
                      <li>• Dashboard layout preferences</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge variant="destructive">Targeting Cookies</Badge>
                  </div>
                  <p className="text-muted-foreground">
                    These cookies may be set through our platform by our advertising partners. 
                    They may be used by those companies to build a profile of your interests 
                    and show you relevant adverts on other sites.
                  </p>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Examples:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Marketing campaign tracking</li>
                      <li>• Social media integration cookies</li>
                      <li>• Advertising optimization cookies</li>
                    </ul>
                  </div>
                </div>

              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Third-Party Cookies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  In addition to our own cookies, we may also use various third-party cookies 
                  to report usage statistics of the Service, deliver advertisements on and 
                  through the Service, and so on.
                </p>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Google Analytics</h4>
                    <p className="text-sm text-muted-foreground">
                      We use Google Analytics to analyze how users interact with our platform. 
                      This helps us improve our services and user experience.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Supabase</h4>
                    <p className="text-sm text-muted-foreground">
                      Our backend infrastructure provider may set cookies for authentication 
                      and session management purposes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cookie Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  You can control and/or delete cookies as you wish. You can delete all cookies 
                  that are already on your computer and you can set most browsers to prevent 
                  them from being placed.
                </p>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Browser Settings</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Most web browsers allow you to control cookies through their settings preferences:
                    </p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Chrome: Settings → Privacy and Security → Cookies</li>
                      <li>• Firefox: Preferences → Privacy & Security → Cookies</li>
                      <li>• Safari: Preferences → Privacy → Cookies</li>
                      <li>• Edge: Settings → Cookies and Site Permissions</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Opt-Out Links</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Google Analytics: <span className="text-primary">https://tools.google.com/dlpage/gaoptout</span></li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cookie Consent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  When you first visit our platform, you will see a cookie banner asking for 
                  your consent to use non-essential cookies. You can choose to accept or decline 
                  these cookies. Essential cookies will always be used as they are necessary 
                  for the platform to function properly.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Updates to This Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We may update this Cookie Policy from time to time in order to reflect changes 
                  to the cookies we use or for other operational, legal, or regulatory reasons. 
                  Please revisit this Cookie Policy regularly to stay informed about our use of cookies.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  If you have any questions about our use of cookies, please contact us at:
                </p>
                <div className="space-y-2">
                  <p className="text-foreground font-medium">Email: privacy@ats.me</p>
                  <p className="text-foreground font-medium">Subject: Cookie Policy Inquiry</p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>
    </div>
  );
};

export default CookiePolicyPage;