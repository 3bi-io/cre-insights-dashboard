/**
 * Map Component Constants
 * Shared configuration values for map components
 */

// Display modes
export type DisplayMode = 'standard' | 'density' | 'detail';

// Geographic defaults
export const US_CENTER: [number, number] = [39.8283, -98.5795];
export const DEFAULT_ZOOM = 4;
export const MIN_ZOOM = 2;
export const MAX_ZOOM = 18;
export const FLY_TO_ZOOM = 10;
export const FLY_TO_DURATION = 0.8;

// Responsive breakpoints (matches Tailwind defaults)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Drawer snap points for mobile
export const DRAWER_SNAP_POINTS = [0.4, 0.7, 0.95] as [number, ...number[]];
export const DEFAULT_DRAWER_SNAP = 0.7;

// Sheet widths
export const SHEET_WIDTH_DESKTOP = 'max-w-md';
export const SHEET_WIDTH_TABLET = 'max-w-sm';

// Touch targets (WCAG minimum)
export const MIN_TOUCH_TARGET = 44;

// Cluster sizing
export const CLUSTER_SIZE = {
  SMALL: 40,
  MEDIUM: 50,
  LARGE: 60,
} as const;

export const CLUSTER_THRESHOLDS = {
  MEDIUM: 20,
  LARGE: 100,
} as const;

// Mode-specific cluster radius
export const CLUSTER_RADIUS: Record<DisplayMode, number> = {
  standard: 60,
  density: 40,
  detail: 80,
};

// Marker sizing
export const MARKER_SIZE = {
  BASE: 24,
  BASE_TOUCH: 44,
  SMALL: 28,
  SMALL_TOUCH: 46,
  MEDIUM: 32,
  MEDIUM_TOUCH: 50,
  LARGE: 36,
  LARGE_TOUCH: 56,
} as const;

// Mode-specific marker scale multipliers
export const MARKER_SCALE: Record<DisplayMode, number> = {
  standard: 1,
  density: 0.85,
  detail: 1.15,
};

export const MARKER_THRESHOLDS = {
  MEDIUM: 5,
  HIGH: 20,
  HOT: 50,
} as const;

// Debounce timings
export const SEARCH_DEBOUNCE_MS = 300;
export const MAP_EVENT_THROTTLE_MS = 100;

// Tile URLs — CARTO CDN (free, no API key)
export const TILE_URLS = {
  LIGHT: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  DARK: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  VOYAGER: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  LIGHT_NOLABELS: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
  DARK_NOLABELS: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
} as const;

// Mode → tile mapping helpers
export function getTileUrl(mode: DisplayMode, isDark: boolean): string {
  switch (mode) {
    case 'density':
      return isDark ? TILE_URLS.DARK_NOLABELS : TILE_URLS.LIGHT_NOLABELS;
    case 'detail':
      return isDark ? TILE_URLS.DARK : TILE_URLS.LIGHT;
    default:
      return isDark ? TILE_URLS.DARK : TILE_URLS.VOYAGER;
  }
}

// Attribution
export const MAP_ATTRIBUTION = '© OSM · CARTO';

// Check if device has touch capability
export const IS_TOUCH_DEVICE = typeof window !== 'undefined' && 
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);
