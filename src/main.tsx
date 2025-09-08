import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { startPerformanceMonitoring } from '@/hooks/usePerformanceMonitor'

// Start performance monitoring in development
if (process.env.NODE_ENV === 'development') {
  startPerformanceMonitoring();
}

// Suppress noisy third‑party RUM/recorder errors blocked by ad blockers
// e.g. "Failed to fetch (ingesteer.services-prod.nsvcs.net)"
const suppressPatterns = [/ingesteer\.services-prod\.nsvcs\.net/i];

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

createRoot(document.getElementById("root")!).render(<App />);