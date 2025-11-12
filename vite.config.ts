import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { VitePWA } from "vite-plugin-pwa";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // Production-only visualizer for bundle analysis
    mode === 'production' && visualizer({
      open: false,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
    ViteImageOptimizer({
      jpg: { quality: 80 },
      jpeg: { quality: 80 },
      png: { quality: 80 },
      webp: { quality: 80 },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo-icon.png', 'robots.txt', 'sitemap.xml', 'og-social.png', 'twitter-card.png'],
      manifest: {
        name: 'ATS.me - AI-Powered Recruitment Platform',
        short_name: 'ATS.me',
        description: 'Transform your recruitment with AI-powered analytics, automated workflows, and intelligent candidate ranking. Join our pilot program.',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/logo-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/logo-icon.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ],
        categories: ['business', 'productivity', 'utilities'],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/auwhcdpppldjlcaxzsme\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/auth/],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core vendors - loaded on every page
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('@tanstack/react-query') || id.includes('@supabase/supabase-js')) {
              return 'data-vendor';
            }
            if (id.includes('recharts')) {
              return 'charts';
            }
            if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('zod')) {
              return 'forms';
            }
            if (id.includes('@11labs/react')) {
              return 'ai-features';
            }
            if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'utilities';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            // Other node_modules as vendor
            return 'vendor';
          }

          // Feature-based code splitting
          if (id.includes('/src/features/tenstreet/')) {
            return 'feature-tenstreet';
          }
          if (id.includes('/src/features/admin/')) {
            return 'feature-admin';
          }
          if (id.includes('/src/features/platforms/')) {
            return 'feature-platforms';
          }
          if (id.includes('/src/features/applications/')) {
            return 'feature-applications';
          }
          if (id.includes('/src/features/campaigns/')) {
            return 'feature-campaigns';
          }
          if (id.includes('/src/features/jobs/')) {
            return 'feature-jobs';
          }
          if (id.includes('/src/features/media/')) {
            return 'feature-media';
          }
          if (id.includes('/src/features/settings/')) {
            return 'feature-settings';
          }
          if (id.includes('/src/features/ai/')) {
            return 'feature-ai';
          }
          
          // Component groups
          if (id.includes('/src/components/charts/')) {
            return 'component-charts';
          }
          if (id.includes('/src/components/forms/')) {
            return 'component-forms';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove all console statements in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.info', 'console.warn'],
      },
      mangle: {
        safari10: true,
      },
    },
    sourcemap: false, // Disable sourcemaps in production for smaller bundle
  },
}));
