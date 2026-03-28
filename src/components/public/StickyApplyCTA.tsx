/**
 * Sticky Apply CTA Component
 * Fixed bottom bar with smart show/hide on scroll for mobile job applications
 * Enhanced for accessibility with proper touch targets and graceful voice fallbacks
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mic, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsVoiceSupported } from '@/hooks/useVoiceCompatibility';

interface StickyApplyCTAProps {
  applyUrl: string;
  isExternalApply?: boolean;
  onVoiceApply?: () => void;
  isVoiceConnected: boolean;
  jobTitle: string;
  showVoiceButton?: boolean;
}

export const StickyApplyCTA: React.FC<StickyApplyCTAProps> = ({
  applyUrl,
  isExternalApply,
  onVoiceApply,
  isVoiceConnected,
  jobTitle,
  showVoiceButton = true,
}) => {
  const isVoiceSupported = useIsVoiceSupported();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Only show voice button if device actually supports WebRTC
  const canShowVoiceButton = showVoiceButton && isVoiceSupported && onVoiceApply;

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
        "safe-area-bottom",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
      role="region"
      aria-label="Quick apply actions"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex gap-3">
          {isExternalApply ? (
            <a href={applyUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button 
                className="w-full min-h-[48px] text-base font-semibold touch-manipulation"
                size="lg"
              >
                Apply Now
                <ExternalLink className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
            </a>
          ) : (
            <Link to={applyUrl} state={{ internal: true }} className="flex-1">
              <Button 
                className="w-full min-h-[48px] text-base font-semibold touch-manipulation"
                size="lg"
              >
                Apply Now
                <ExternalLink className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
            </Link>
          )}
          {canShowVoiceButton && (
            <Button 
              variant="outline" 
              className="min-h-[48px] min-w-[48px] px-4 touch-manipulation"
              onClick={onVoiceApply}
              disabled={isVoiceConnected}
              aria-label={isVoiceConnected ? `Voice application in progress for ${jobTitle}` : `Apply to ${jobTitle} using voice conversation`}
            >
              <Mic className="w-5 h-5" aria-hidden="true" />
              <span className="sr-only">
                {isVoiceConnected ? 'Voice application in progress' : 'Apply with voice'}
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StickyApplyCTA;
