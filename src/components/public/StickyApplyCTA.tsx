/**
 * Sticky Apply CTA Component
 * Fixed bottom bar with smart show/hide on scroll for mobile job applications
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mic, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StickyApplyCTAProps {
  applyUrl: string;
  onVoiceApply: () => void;
  isVoiceConnected: boolean;
  jobTitle: string;
}

export const StickyApplyCTA: React.FC<StickyApplyCTAProps> = ({
  applyUrl,
  onVoiceApply,
  isVoiceConnected,
  jobTitle,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY);
      
      // Only hide/show if scroll delta is significant
      if (scrollDelta > 10) {
        // Hide when scrolling down, show when scrolling up
        // Also show if near top of page
        if (currentScrollY < 100) {
          setIsVisible(true);
        } else {
          setIsVisible(!scrollingDown);
        }
        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 lg:hidden",
        "bg-background/95 backdrop-blur-lg border-t shadow-lg",
        "transition-transform duration-300 ease-out",
        "pb-safe",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex gap-3">
          <Link to={applyUrl} className="flex-1">
            <Button className="w-full h-12 text-base font-semibold">
              Apply Now
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="h-12 px-4"
            onClick={onVoiceApply}
            disabled={isVoiceConnected}
            aria-label={`Apply to ${jobTitle} with voice`}
          >
            <Mic className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StickyApplyCTA;
