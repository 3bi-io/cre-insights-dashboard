import React from 'react';
import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img 
              src="/ats-io-logo.png" 
              alt="ATS Platform" 
              className="h-6 w-auto"
            />
            <span className="text-sm text-muted-foreground">
              © 2024 ATS Platform. All rights reserved.
            </span>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <Link 
              to="/privacy-controls" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link 
              to="/settings" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Settings
            </Link>
            <a 
              href="mailto:support@ats-platform.com" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;