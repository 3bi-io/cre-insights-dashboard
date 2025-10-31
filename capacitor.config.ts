import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.cf22d483762d45c7a42c85b40ce9290a',
  appName: 'ats-me',
  webDir: 'dist',
  server: {
    url: 'https://cf22d483-762d-45c7-a42c-85b40ce9290a.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#667eea',
      showSpinner: false,
    },
  },
};

export default config;
