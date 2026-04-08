import React from 'react';
import LegalPageLayout, { type LegalSection } from '@/components/public/LegalPageLayout';
import { Shield } from 'lucide-react';

const sections: LegalSection[] = [
  {
    id: 'information-we-collect',
    title: 'Information We Collect',
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-foreground mb-2">Personal Information</h4>
          <p>We collect information you provide directly to us, such as when you create an account, post job listings, apply for positions, or contact us for support. This may include your name, email address, phone number, company information, and professional details.</p>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-2">Usage Information</h4>
          <p>We automatically collect information about how you use Apply AI, including your interactions with the platform, features used, and performance metrics to improve our services.</p>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-2">Device Information</h4>
          <p>We collect information about the devices you use to access our platform, including hardware model, operating system, browser type, and IP address.</p>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-2">Voice Interaction Data</h4>
          <p>When you interact with our AI voice assistant or receive automated calls, we collect audio recordings, transcripts, call metadata (duration, timestamps, call status), and voicemail detection results. These recordings are processed by third-party AI services on our behalf.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'how-we-use',
    title: 'How We Use Your Information',
    content: (
      <ul className="space-y-2 list-disc pl-5">
        <li>Provide, maintain, and improve our applicant tracking system services</li>
        <li>Process job applications and facilitate recruitment activities</li>
        <li>Send you service-related communications and updates</li>
        <li>Analyze usage patterns to enhance user experience and platform performance</li>
        <li>Ensure security and prevent fraud or abuse</li>
        <li>Conduct AI-assisted voice outreach, including automated calls, voicemail detection, and follow-up communications</li>
        <li>Generate and store call transcripts for recruitment quality and compliance purposes</li>
      </ul>
    ),
  },
  {
    id: 'information-sharing',
    title: 'Information Sharing',
    content: (
      <div className="space-y-3">
        <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
        <ul className="space-y-2 list-disc pl-5">
          <li>With your consent or at your direction</li>
          <li>With service providers who assist us in operating our platform</li>
          <li>With AI and telephony service providers who process voice interactions on our behalf, subject to contractual data protection obligations</li>
          <li>To comply with legal obligations or protect our rights</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'data-security',
    title: 'Data Security',
    content: (
      <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure data transmission, and regular security assessments.</p>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your Rights',
    content: (
      <div className="space-y-3">
        <p>Depending on your location, you may have certain rights regarding your personal information:</p>
        <ul className="space-y-2 list-disc pl-5">
          <li>Access and update your personal information</li>
          <li>Request deletion of your personal information</li>
          <li>Opt-out of certain communications</li>
          <li>Data portability and restriction of processing</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'contact',
    title: 'Contact Us',
    content: (
      <div className="space-y-2">
        <p>If you have any questions about this Privacy Policy or our data practices, please contact us at:</p>
        <p className="text-foreground font-medium">Email: privacy@applyai.jobs</p>
        <p className="text-foreground font-medium">Address: Apply AI Privacy Office</p>
      </div>
    ),
  },
];

const PrivacyPolicyPage = () => (
  <LegalPageLayout
    title="Privacy Policy"
    lastUpdated="April 2026"
    icon={<Shield className="h-14 w-14 text-primary mx-auto" />}
    seoTitle="Privacy Policy | Data Protection & GDPR Compliance"
    seoDescription="Apply AI's privacy policy covering data collection, usage, security, and your rights. GDPR compliant recruitment platform."
    canonical="https://applyai.jobs/privacy-policy"
    breadcrumbPath="/privacy-policy"
    sections={sections}
  />
);

export default PrivacyPolicyPage;
