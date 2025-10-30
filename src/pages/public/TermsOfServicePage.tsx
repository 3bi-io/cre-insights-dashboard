import React from 'react';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Terms of Service | User Agreement"
        description="Terms and conditions for using ATS.me's recruitment platform. Service agreement, usage rights, and responsibilities for users and organizations."
        keywords="terms of service, user agreement, ATS terms"
        canonical="https://ats.me/terms-of-service"
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
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6">
            Terms of Service
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
              <Info className="h-4 w-4" />
              <AlertDescription>
                By accessing and using ATS Intel, you agree to be bound by these Terms of Service. 
                Please read them carefully.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>1. Acceptance of Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  By accessing or using ATS Intel (the "Service"), you agree to be bound by these 
                  Terms of Service ("Terms"). If you disagree with any part of these terms, then 
                  you may not access the Service. These Terms apply to all visitors, users, and 
                  others who access or use the Service.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Description of Service</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  ATS Intel is an applicant tracking system that provides:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-muted-foreground">
                      Job posting and management capabilities
                    </p>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-muted-foreground">
                      Application tracking and candidate management
                    </p>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-muted-foreground">
                      AI-powered analytics and insights
                    </p>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-muted-foreground">
                      Integration with third-party platforms
                    </p>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. User Accounts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  When you create an account with us, you must provide information that is 
                  accurate, complete, and current at all times. You are responsible for 
                  safeguarding the password and for maintaining the confidentiality of your account.
                </p>
                <p className="text-muted-foreground">
                  You agree to accept responsibility for all activities that occur under your 
                  account or password. You must notify us immediately upon becoming aware of 
                  any breach of security or unauthorized use of your account.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Acceptable Use</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  You agree not to use the Service:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-muted-foreground">
                      For any unlawful purpose or to solicit others to unlawful acts
                    </p>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-muted-foreground">
                      To violate any international, federal, provincial, or state regulations or laws
                    </p>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-muted-foreground">
                      To transmit or send unsolicited or unauthorized advertising or promotional material
                    </p>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-muted-foreground">
                      To interfere with or circumvent the security features of the Service
                    </p>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Subscription and Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Some parts of the Service are billed on a subscription basis. You will be 
                  billed in advance on a recurring and periodic basis. Billing cycles are 
                  set either on a monthly or annual basis, depending on the type of subscription 
                  plan you select.
                </p>
                <p className="text-muted-foreground">
                  At the end of each billing cycle, your subscription will automatically renew 
                  under the same conditions unless you cancel it or we terminate it. You may 
                  cancel your subscription renewal either through your online account management 
                  page or by contacting our customer support team.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Intellectual Property Rights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  The Service and its original content, features, and functionality are and will 
                  remain the exclusive property of ATS Intel and its licensors. The Service is 
                  protected by copyright, trademark, and other laws. Our trademarks and trade 
                  dress may not be used in connection with any product or service without our 
                  prior written consent.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Privacy Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your privacy is important to us. Please review our Privacy Policy, which also 
                  governs your use of the Service, to understand our practices.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Termination</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We may terminate or suspend your account immediately, without prior notice or 
                  liability, for any reason whatsoever, including without limitation if you breach 
                  the Terms. Upon termination, your right to use the Service will cease immediately. 
                  If you wish to terminate your account, you may simply discontinue using the Service.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  In no event shall ATS Intel, nor its directors, employees, partners, agents, 
                  suppliers, or affiliates, be liable for any indirect, incidental, special, 
                  consequential, or punitive damages, including without limitation, loss of profits, 
                  data, use, goodwill, or other intangible losses, resulting from your use of the Service.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>10. Changes to Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We reserve the right, at our sole discretion, to modify or replace these Terms 
                  at any time. If a revision is material, we will try to provide at least 30 days 
                  notice prior to any new terms taking effect. What constitutes a material change 
                  will be determined at our sole discretion.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>11. Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <div className="space-y-2">
                  <p className="text-foreground font-medium">Email: legal@ats.me</p>
                  <p className="text-foreground font-medium">Address: ATS Intel Legal Department</p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsOfServicePage;