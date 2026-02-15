import React from 'react';
import LegalPageLayout, { type LegalSection } from '@/components/public/LegalPageLayout';
import { Cookie } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const CookieTypeSection = ({ badge, variant, description, examples }: { badge: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; description: string; examples: string[] }) => (
  <div className="space-y-3">
    <Badge variant={variant}>{badge}</Badge>
    <p>{description}</p>
    <div className="bg-muted/30 p-4 rounded-lg">
      <h4 className="font-medium text-foreground mb-2">Examples:</h4>
      <ul className="space-y-1 text-sm list-disc pl-5">
        {examples.map(e => <li key={e}>{e}</li>)}
      </ul>
    </div>
  </div>
);

const sections: LegalSection[] = [
  {
    id: 'what-are-cookies',
    title: 'What Are Cookies?',
    content: <p>Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners to make their websites work more efficiently, as well as to provide reporting information and enhance user experience.</p>,
  },
  {
    id: 'how-we-use',
    title: 'How We Use Cookies',
    content: <p>We use cookies for several reasons. Some cookies are required for technical reasons for our platform to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies enable us to track and target the interests of our users to enhance the experience on our platform.</p>,
  },
  {
    id: 'types',
    title: 'Types of Cookies We Use',
    content: (
      <div className="space-y-6">
        <CookieTypeSection badge="Essential Cookies" variant="default" description="These cookies are strictly necessary to provide you with services available through our platform." examples={['Authentication cookies (keep you logged in)', 'Security cookies (prevent fraud)', 'Session cookies (maintain your session)']} />
        <CookieTypeSection badge="Performance Cookies" variant="secondary" description="These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our platform." examples={['Google Analytics cookies', 'Page load time tracking', 'Error monitoring cookies']} />
        <CookieTypeSection badge="Functional Cookies" variant="outline" description="These cookies enable the platform to provide enhanced functionality and personalization." examples={['Language preference cookies', 'Theme preference cookies', 'Dashboard layout preferences']} />
        <CookieTypeSection badge="Targeting Cookies" variant="destructive" description="These cookies may be set through our platform by our advertising partners." examples={['Marketing campaign tracking', 'Social media integration cookies', 'Advertising optimization cookies']} />
      </div>
    ),
  },
  {
    id: 'third-party',
    title: 'Third-Party Cookies',
    content: (
      <div className="space-y-4">
        <p>In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the Service.</p>
        <div>
          <h4 className="font-medium text-foreground mb-1">Google Analytics</h4>
          <p className="text-sm">We use Google Analytics to analyze how users interact with our platform.</p>
        </div>
        <div>
          <h4 className="font-medium text-foreground mb-1">Supabase</h4>
          <p className="text-sm">Our backend infrastructure provider may set cookies for authentication and session management purposes.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'management',
    title: 'Cookie Management',
    content: (
      <div className="space-y-4">
        <p>You can control and/or delete cookies as you wish. Most web browsers allow you to control cookies through their settings:</p>
        <ul className="space-y-1 text-sm list-disc pl-5">
          <li>Chrome: Settings → Privacy and Security → Cookies</li>
          <li>Firefox: Preferences → Privacy & Security → Cookies</li>
          <li>Safari: Preferences → Privacy → Cookies</li>
          <li>Edge: Settings → Cookies and Site Permissions</li>
        </ul>
        <div>
          <h4 className="font-medium text-foreground mb-1">Opt-Out Links</h4>
          <p className="text-sm">Google Analytics: <span className="text-primary">https://tools.google.com/dlpage/gaoptout</span></p>
        </div>
      </div>
    ),
  },
  {
    id: 'consent',
    title: 'Cookie Consent',
    content: <p>When you first visit our platform, you will see a cookie banner asking for your consent to use non-essential cookies. Essential cookies will always be used as they are necessary for the platform to function properly.</p>,
  },
  {
    id: 'updates',
    title: 'Updates to This Policy',
    content: <p>We may update this Cookie Policy from time to time. Please revisit this Cookie Policy regularly to stay informed about our use of cookies.</p>,
  },
  {
    id: 'contact',
    title: 'Contact Us',
    content: (
      <div className="space-y-2">
        <p>If you have any questions about our use of cookies, please contact us at:</p>
        <p className="text-foreground font-medium">Email: privacy@ats.me</p>
        <p className="text-foreground font-medium">Subject: Cookie Policy Inquiry</p>
      </div>
    ),
  },
];

const CookiePolicyPage = () => (
  <LegalPageLayout
    title="Cookie Policy"
    lastUpdated="January 2026"
    icon={<Cookie className="h-14 w-14 text-primary mx-auto" />}
    seoTitle="Cookie Policy | How We Use Cookies"
    seoDescription="Learn how ATS.me uses cookies to enhance your experience. Cookie types, purposes, and how to manage cookie preferences."
    canonical="https://ats.me/cookie-policy"
    breadcrumbPath="/cookie-policy"
    sections={sections}
    introAlert={
      <Alert>
        <Cookie className="h-4 w-4" />
        <AlertDescription>This Cookie Policy explains how ATS.me uses cookies and similar technologies to recognize you when you visit our platform.</AlertDescription>
      </Alert>
    }
  />
);

export default CookiePolicyPage;
