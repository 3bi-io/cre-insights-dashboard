import React from 'react';
import LegalPageLayout, { type LegalSection } from '@/components/public/LegalPageLayout';
import { FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const sections: LegalSection[] = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: <p>By accessing or using ATS.me (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, then you may not access the Service. These Terms apply to all visitors, users, and others who access or use the Service.</p>,
  },
  {
    id: 'description',
    title: '2. Description of Service',
    content: (
      <div className="space-y-3">
        <p>ATS.me is an applicant tracking system that provides:</p>
        <ul className="space-y-2 list-disc pl-5">
          <li>Job posting and management capabilities</li>
          <li>Application tracking and candidate management</li>
          <li>AI-powered analytics and insights</li>
          <li>Integration with third-party platforms</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'accounts',
    title: '3. User Accounts',
    content: (
      <div className="space-y-3">
        <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for maintaining the confidentiality of your account.</p>
        <p>You agree to accept responsibility for all activities that occur under your account or password. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>
      </div>
    ),
  },
  {
    id: 'acceptable-use',
    title: '4. Acceptable Use',
    content: (
      <div className="space-y-3">
        <p>You agree not to use the Service:</p>
        <ul className="space-y-2 list-disc pl-5">
          <li>For any unlawful purpose or to solicit others to unlawful acts</li>
          <li>To violate any international, federal, provincial, or state regulations or laws</li>
          <li>To transmit or send unsolicited or unauthorized advertising or promotional material</li>
          <li>To interfere with or circumvent the security features of the Service</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'access',
    title: '5. Access and Usage',
    content: (
      <div className="space-y-3">
        <p>Access to the Service is provided to authorized users within your organization. Your organization's administrator manages user access and feature availability based on user roles and responsibilities.</p>
        <p>All registered users have access to platform features appropriate to their role. Feature access is managed by your organization's Super Administrator and may be adjusted at any time.</p>
      </div>
    ),
  },
  {
    id: 'ip',
    title: '6. Intellectual Property Rights',
    content: <p>The Service and its original content, features, and functionality are and will remain the exclusive property of ATS.me and its licensors. The Service is protected by copyright, trademark, and other laws.</p>,
  },
  {
    id: 'privacy',
    title: '7. Privacy Policy',
    content: <p>Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.</p>,
  },
  {
    id: 'termination',
    title: '8. Termination',
    content: <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will cease immediately.</p>,
  },
  {
    id: 'liability',
    title: '9. Limitation of Liability',
    content: <p>In no event shall ATS.me, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.</p>,
  },
  {
    id: 'changes',
    title: '10. Changes to Terms',
    content: <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.</p>,
  },
  {
    id: 'contact',
    title: '11. Contact Information',
    content: (
      <div className="space-y-2">
        <p>If you have any questions about these Terms of Service, please contact us at:</p>
        <p className="text-foreground font-medium">Email: legal@ats.me</p>
        <p className="text-foreground font-medium">Address: ATS.me Legal Department</p>
      </div>
    ),
  },
];

const TermsOfServicePage = () => (
  <LegalPageLayout
    title="Terms of Service"
    lastUpdated="January 2026"
    icon={<FileText className="h-14 w-14 text-primary mx-auto" />}
    seoTitle="Terms of Service | User Agreement"
    seoDescription="Terms and conditions for using ATS.me's recruitment platform. Service agreement, usage rights, and responsibilities."
    canonical="https://ats.me/terms-of-service"
    breadcrumbPath="/terms-of-service"
    sections={sections}
    introAlert={
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>By accessing and using ATS.me, you agree to be bound by these Terms of Service. Please read them carefully.</AlertDescription>
      </Alert>
    }
  />
);

export default TermsOfServicePage;
