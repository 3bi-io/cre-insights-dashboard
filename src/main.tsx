import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'
import './i18n/config' // Initialize i18n
import { startPerformanceMonitoring } from '@/hooks/usePerformanceMonitor'
import { initSentry } from '@/utils/sentry'
import { initAnalytics } from '@/utils/analytics'
import { initWebVitals } from '@/utils/webVitals'

// Initialize monitoring services (production)
initSentry();
initAnalytics();
startPerformanceMonitoring();
initWebVitals();

// Suppress noisy third‑party RUM/recorder errors blocked by ad blockers
// e.g. "Failed to fetch (ingesteer.services-prod.nsvcs.net)", RudderStack, X-Frame-Options
const suppressPatterns = [
  /ingesteer\.services-prod\.nsvcs\.net/i,
  /rudderstack/i,
  /cdn\.rudderlabs\.com/i,
  /X-Frame-Options/i,
];

window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  const reason: any = (event as any).reason;
  const msg = typeof reason === 'string' ? reason : (reason?.message || '');
  const stack = typeof reason?.stack === 'string' ? reason.stack : '';
  const text = `${msg} ${stack}`;
  if (suppressPatterns.some((re) => re.test(text))) {
    event.preventDefault();
  }
});

window.addEventListener('error', (event: ErrorEvent) => {
  const text = `${event.message || ''} ${event.error?.stack || ''} ${event.filename || ''}`;
  if (suppressPatterns.some((re) => re.test(text))) {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);