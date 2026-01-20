/**
 * Reusable call-to-action block
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CTABlockProps {
  primaryText: string;
  primaryPath: string;
  secondaryText?: string;
  secondaryPath?: string;
  footer?: string;
}

export const CTABlock = ({ 
  primaryText, 
  primaryPath, 
  secondaryText, 
  secondaryPath,
  footer 
}: CTABlockProps) => {
  const navigate = useNavigate();

  return (
    <div className="text-center">
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          size="lg" 
          className="text-lg px-8 py-6 min-h-[48px]"
          onClick={() => navigate(primaryPath)}
        >
          {primaryText}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        {secondaryText && secondaryPath && (
          <Button 
            size="lg" 
            variant="outline" 
            className="text-lg px-8 py-6 min-h-[48px]"
            onClick={() => navigate(secondaryPath)}
          >
            {secondaryText}
          </Button>
        )}
      </div>
      {footer && (
        <p className="text-sm text-muted-foreground mt-4">
          {footer}
        </p>
      )}
    </div>
  );
};
