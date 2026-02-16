/**
 * Public Footer Component
 * 4-column layout with social links, newsletter signup, and compliance badges
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brand } from '@/components/common';
import { ChevronDown, Mail, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const PublicFooter = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success('Thanks for subscribing! We\'ll keep you updated.');
    setEmail('');
  };

  const productLinks = [
    { to: '/jobs', label: 'Search Jobs' },
    { to: '/features', label: 'Features' },
    
    { to: '/resources', label: 'Resources' },
  ];

  const solutionsLinks = [
    { to: '/clients', label: 'Employers' },
    { to: '/blog', label: 'Blog' },
    { to: '/features#voice-apply', label: 'Voice Apply' },
    { to: '/features#ai-screening', label: 'AI Screening' },
  ];

  const companyLinks = [
    { to: '/contact', label: 'Contact Us' },
    { to: '/auth', label: 'Sign In' },
    { to: '/blog', label: 'Blog' },
  ];

  const legalLinks = [
    { to: '/privacy-policy', label: 'Privacy Policy' },
    { to: '/terms-of-service', label: 'Terms of Service' },
    { to: '/cookie-policy', label: 'Cookie Policy' },
    { to: '/sitemap', label: 'Sitemap' },
  ];

  const socialLinks = [
    {
      label: 'LinkedIn',
      href: 'https://linkedin.com/company/ats-me',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      label: 'X (Twitter)',
      href: 'https://x.com/ats_me',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      label: 'Facebook',
      href: 'https://facebook.com/atsme',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
  ];

  const renderFooterSection = (
    title: string,
    sectionKey: string,
    links: { to: string; label: string }[]
  ) => (
    <div>
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full py-3 lg:py-0 lg:cursor-default border-b lg:border-0 border-border"
        aria-expanded={openSection === sectionKey}
      >
        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
        <ChevronDown
          className={cn(
            'h-4 w-4 lg:hidden transition-transform',
            openSection === sectionKey && 'rotate-180'
          )}
        />
      </button>
      <ul
        className={cn(
          'space-y-2.5 overflow-hidden transition-all duration-200 lg:mt-4',
          openSection === sectionKey ? 'max-h-48 pt-3' : 'max-h-0 lg:max-h-none'
        )}
      >
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="text-sm text-muted-foreground hover:text-primary transition-colors block py-1 min-h-[44px] lg:min-h-0 flex items-center"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand + Newsletter */}
          <div className="lg:col-span-2 space-y-6">
            <Brand variant="horizontal" size="md" showAsLink={true} />
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              The most advanced AI-powered applicant tracking platform. Voice interviews, automated callbacks, and intelligent candidate management.
            </p>

            {/* Newsletter Signup */}
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-sm">
              <Input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 text-sm bg-background"
                aria-label="Email for newsletter"
              />
              <Button type="submit" size="sm" className="h-10 px-4 shrink-0">
                <Send className="h-4 w-4" />
                <span className="sr-only">Subscribe</span>
              </Button>
            </form>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {renderFooterSection('Product', 'product', productLinks)}
          {renderFooterSection('Solutions', 'solutions', solutionsLinks)}
          {renderFooterSection('Company', 'company', companyLinks)}
        </div>

        {/* Compliance Badges */}
        <div className="mt-10 pt-6 border-t border-border/50 flex flex-wrap items-center justify-center gap-4 md:gap-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            SOC 2 Compliant
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            GDPR Ready
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            99.9% Uptime
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 pt-6 border-t border-border/50">
          <div className="flex flex-col-reverse lg:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} ATS.me. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {legalLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
