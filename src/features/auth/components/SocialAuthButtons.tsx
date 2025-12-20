/**
 * Social Auth Buttons
 * Responsive OAuth provider buttons with device-optimized layouts
 */

import { Button } from '@/components/ui/button';
import { Github, Linkedin, Loader2 } from 'lucide-react';
import { GoogleIcon, AppleIcon, MicrosoftIcon, XIcon } from './AuthIcons';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { cn } from '@/lib/utils';
import type { OAuthProvider } from '../hooks/useAuthForm';

interface SocialAuthButtonsProps {
  onOAuthSignIn: (provider: OAuthProvider) => Promise<void>;
  loading?: boolean;
  oauthLoading: OAuthProvider | null;
  className?: string;
}

interface ProviderConfig {
  id: OAuthProvider;
  name: string;
  icon: React.ReactNode;
  loadingIcon: React.ReactNode;
  className?: string;
}

export function SocialAuthButtons({
  onOAuthSignIn,
  loading = false,
  oauthLoading,
  className,
}: SocialAuthButtonsProps) {
  const { isMobile, isTablet } = useResponsiveLayout();

  const providers: ProviderConfig[] = [
    {
      id: 'google',
      name: 'Google',
      icon: <GoogleIcon className="h-4 w-4 sm:h-5 sm:w-5" />,
      loadingIcon: <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />,
    },
    {
      id: 'azure',
      name: 'Microsoft',
      icon: <MicrosoftIcon className="h-4 w-4 sm:h-5 sm:w-5" />,
      loadingIcon: <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />,
    },
    {
      id: 'apple',
      name: 'Apple',
      icon: <AppleIcon className="h-4 w-4 sm:h-5 sm:w-5" />,
      loadingIcon: <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />,
    },
    {
      id: 'linkedin_oidc',
      name: 'LinkedIn',
      icon: <Linkedin className="h-4 w-4 sm:h-5 sm:w-5 text-[#0A66C2]" />,
      loadingIcon: <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />,
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: <Github className="h-4 w-4 sm:h-5 sm:w-5" />,
      loadingIcon: <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />,
    },
    {
      id: 'twitter',
      name: 'X',
      icon: <XIcon className="h-4 w-4 sm:h-5 sm:w-5" />,
      loadingIcon: <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />,
    },
  ];

  const isDisabled = loading || oauthLoading !== null;

  // Mobile: 2 columns with labels for accessibility
  // Tablet: 3 columns with labels
  // Desktop: 6 columns icon-only with tooltips
  const gridClasses = cn(
    "grid gap-2",
    isMobile && "grid-cols-2 gap-3",
    isTablet && "grid-cols-3 gap-2",
    !isMobile && !isTablet && "grid-cols-6 gap-1.5"
  );

  const buttonClasses = cn(
    "w-full touch-manipulation transition-all",
    // Mobile: larger touch targets (min 44px), show labels
    isMobile && "min-h-[48px] px-3 py-3",
    // Tablet: medium size with labels
    isTablet && "min-h-[44px] px-2 py-2",
    // Desktop: compact icon-only
    !isMobile && !isTablet && "min-h-[40px] px-1.5"
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or continue with</span>
        </div>
      </div>
      
      {/* Provider buttons grid */}
      <div className={gridClasses}>
        {providers.map((provider) => (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            onClick={() => onOAuthSignIn(provider.id)}
            disabled={isDisabled}
            className={cn(buttonClasses, provider.className)}
            title={`Continue with ${provider.name}`}
            aria-label={`Continue with ${provider.name}`}
          >
            {oauthLoading === provider.id ? provider.loadingIcon : provider.icon}
            {/* Show labels on mobile and tablet for better accessibility */}
            {(isMobile || isTablet) && (
              <span className="ml-2 text-sm font-medium truncate">
                {provider.name}
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
