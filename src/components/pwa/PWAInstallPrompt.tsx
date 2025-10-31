/**
 * PWA Install Prompt Component
 * Shows a banner or modal to prompt users to install the app
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { logger } from '@/lib/logger';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    // Show prompt after 10 seconds if installable and not dismissed
    const timer = setTimeout(() => {
      if (isInstallable && !isDismissed && !isInstalled) {
        setShowPrompt(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isInstallable, isDismissed, isInstalled]);

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setShowPrompt(false);
      logger.debug('PWA installation initiated from prompt');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
    logger.debug('PWA install prompt dismissed');
  };

  // Don't show if not installable, already installed, or dismissed
  if (!isInstallable || isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="relative pb-3">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5 text-primary" />
            Install ATS.me
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <CardDescription>
            Install our app for faster access, offline support, and a native app experience on your device.
          </CardDescription>
          <div className="flex gap-2">
            <Button onClick={handleInstall} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Install Now
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
