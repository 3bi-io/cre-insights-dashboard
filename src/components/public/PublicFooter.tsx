/**
 * Public Footer Component
 * Mobile-first with collapsible sections on mobile, expanded on desktop
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brand } from '@/components/common';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const PublicFooter = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const productLinks = [
    { to: '/jobs', label: 'Jobs' },
    { to: '/features', label: 'Features' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/resources', label: 'Resources' },
  ];

  const companyLinks = [
    { to: '/contact', label: 'Contact' },
    { to: '/auth', label: 'Sign In' },
  ];

  const legalLinks = [
    { to: '/privacy-policy', label: 'Privacy' },
    { to: '/terms-of-service', label: 'Terms' },
    { to: '/cookie-policy', label: 'Cookies' },
    { to: '/sitemap', label: 'Sitemap' },
  ];

  return (
    <footer className="bg-muted/30 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          
          {/* Company Info - Always visible */}
          <div className="col-span-1 lg:col-span-2">
            <Brand variant="horizontal" size="md" showAsLink={true} className="mb-4" />
            <p className="text-muted-foreground mb-4 lg:mb-6 max-w-md text-sm lg:text-base">
              Revolutionize your hiring process with AI-powered analytics, automated workflows, 
              and comprehensive candidate tracking.
            </p>
            <a 
              href="mailto:contact@ats.me" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors min-h-[44px]"
              aria-label="Email us at contact@ats.me"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">contact@ats.me</span>
            </a>
          </div>

          {/* Product Links - Collapsible on mobile */}
          <div className="lg:block">
            <button 
              onClick={() => toggleSection('product')}
              className="flex items-center justify-between w-full py-3 lg:py-0 lg:cursor-default border-b lg:border-0 border-border"
              aria-expanded={openSection === 'product'}
            >
              <h3 className="font-semibold text-foreground">Product</h3>
              <ChevronDown className={cn(
                "h-4 w-4 lg:hidden transition-transform",
                openSection === 'product' && "rotate-180"
              )} />
            </button>
            <ul className={cn(
              "space-y-3 overflow-hidden transition-all duration-200 lg:mt-4",
              openSection === 'product' ? "max-h-40 pt-3" : "max-h-0 lg:max-h-none"
            )}>
              {productLinks.map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-muted-foreground hover:text-primary transition-colors block py-1 min-h-[44px] lg:min-h-0 flex items-center"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links - Collapsible on mobile */}
          <div className="lg:block">
            <button 
              onClick={() => toggleSection('company')}
              className="flex items-center justify-between w-full py-3 lg:py-0 lg:cursor-default border-b lg:border-0 border-border"
              aria-expanded={openSection === 'company'}
            >
              <h3 className="font-semibold text-foreground">Company</h3>
              <ChevronDown className={cn(
                "h-4 w-4 lg:hidden transition-transform",
                openSection === 'company' && "rotate-180"
              )} />
            </button>
            <ul className={cn(
              "space-y-3 overflow-hidden transition-all duration-200 lg:mt-4",
              openSection === 'company' ? "max-h-40 pt-3" : "max-h-0 lg:max-h-none"
            )}>
              {companyLinks.map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-muted-foreground hover:text-primary transition-colors block py-1 min-h-[44px] lg:min-h-0 flex items-center"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-8 lg:mt-12 pt-6 lg:pt-8 border-t border-border">
          <div className="flex flex-col-reverse lg:flex-row justify-between items-center gap-4">
            {/* Legal Links - Horizontal scroll on mobile */}
            <div className="w-full lg:w-auto overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
              <div className="flex items-center gap-4 lg:gap-6 text-sm text-muted-foreground min-w-max">
                {legalLinks.map((link) => (
                  <Link 
                    key={link.to}
                    to={link.to} 
                    className="hover:text-primary transition-colors py-2 lg:py-0"
                  >
                    {link.label}
                  </Link>
                ))}
                <a 
                  href="mailto:support@ats.me" 
                  className="hover:text-primary transition-colors py-2 lg:py-0"
                >
                  Support
                </a>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ATS.me. All rights reserved.
            </p>
          </div>
        </div>

        {/* Back to Top - Mobile only */}
        <div className="mt-6 text-center lg:hidden">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-sm text-muted-foreground hover:text-primary transition-colors py-2"
          >
            ↑ Back to top
          </button>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
