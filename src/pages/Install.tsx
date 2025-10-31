/**
 * PWA Installation Page
 * Dedicated page for installing the app on mobile devices
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Smartphone, Wifi, Zap, Check } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useNavigate } from 'react-router-dom';

const Install: React.FC = () => {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const navigate = useNavigate();

  const handleInstall = async () => {
    await promptInstall();
  };

  const features = [
    {
      icon: Wifi,
      title: 'Offline Access',
      description: 'Work without internet connection',
    },
    {
      icon: Zap,
      title: 'Fast & Responsive',
      description: 'Lightning-fast load times',
    },
    {
      icon: Smartphone,
      title: 'Native Experience',
      description: 'Feels like a native app',
    },
  ];

  const instructions = {
    ios: [
      'Tap the Share button in Safari',
      'Scroll down and tap "Add to Home Screen"',
      'Tap "Add" in the top right corner',
      'Find the ATS.me icon on your home screen',
    ],
    android: [
      'Tap the menu icon (three dots) in Chrome',
      'Tap "Add to Home Screen" or "Install App"',
      'Tap "Add" or "Install" to confirm',
      'Find the ATS.me icon in your app drawer',
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Badge className="bg-primary/10 text-primary border-primary/20">
            Progressive Web App
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
            Install ATS.me
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get the best experience with our installable web app. Works offline, loads faster, and feels like a native app.
          </p>
        </div>

        {/* Install Status */}
        {isInstalled && (
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="py-6">
              <div className="flex items-center justify-center gap-3 text-green-600">
                <Check className="h-6 w-6" />
                <span className="text-lg font-semibold">App is already installed!</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Install Button */}
        {isInstallable && !isInstalled && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-8">
              <div className="flex flex-col items-center gap-4">
                <Download className="h-12 w-12 text-primary" />
                <h2 className="text-2xl font-semibold">Ready to Install</h2>
                <p className="text-muted-foreground text-center max-w-md">
                  Click the button below to install ATS.me on your device. It takes just a few seconds!
                </p>
                <Button size="lg" onClick={handleInstall} className="px-8">
                  <Download className="mr-2 h-5 w-5" />
                  Install Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <feature.icon className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Manual Instructions */}
        {!isInstallable && !isInstalled && (
          <Card>
            <CardHeader>
              <CardTitle>Manual Installation Instructions</CardTitle>
              <CardDescription>
                Follow these steps to install the app on your device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* iOS Instructions */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  iPhone / iPad (Safari)
                </h3>
                <ol className="space-y-2">
                  {instructions.ios.map((step, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </span>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <Separator />

              {/* Android Instructions */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Android (Chrome)
                </h3>
                <ol className="space-y-2">
                  {instructions.android.map((step, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </span>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back Button */}
        <div className="text-center">
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Install;
