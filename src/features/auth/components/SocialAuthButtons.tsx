/**
 * Social Auth Buttons
 * Full-width OAuth provider buttons with consistent sizing
 */

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { GoogleIcon, MicrosoftIcon } from './AuthIcons';
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
}

export function SocialAuthButtons({
  onOAuthSignIn,
  loading = false,
  oauthLoading,
  className,
}: SocialAuthButtonsProps) {
  const providers: ProviderConfig[] = [
    {
      id: 'google',
      name: 'Google',
      icon: <GoogleIcon className="h-5 w-5" />,
      loadingIcon: <Loader2 className="h-5 w-5 animate-spin" />,
    },
    {
      id: 'azure',
      name: 'Microsoft',
      icon: <MicrosoftIcon className="h-5 w-5" />,
      loadingIcon: <Loader2 className="h-5 w-5 animate-spin" />,
    },
  ];

  const isDisabled = loading || oauthLoading !== null;

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
      
      {/* Provider buttons grid - 2 columns, full width */}
      <div className="grid grid-cols-2 gap-3">
        {providers.map((provider) => (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            onClick={() => onOAuthSignIn(provider.id)}
            disabled={isDisabled}
            className="w-full min-h-[44px] px-4 py-3 touch-manipulation"
            title={`Continue with ${provider.name}`}
            aria-label={`Continue with ${provider.name}`}
          >
            {oauthLoading === provider.id ? provider.loadingIcon : provider.icon}
            <span className="ml-2 text-sm font-medium">
              {provider.name}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
