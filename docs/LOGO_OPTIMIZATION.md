# Logo Optimization Documentation

## Overview
The Brand component has been enhanced with comprehensive optimizations for all device types, ensuring optimal performance, responsiveness, and accessibility across the application.

## Features Implemented

### 1. Responsive Sizing & Variants
- **Auto-responsive variants**: `variant="auto"` automatically switches between `icon` (mobile) and `horizontal` (desktop)
- **Auto-responsive sizes**: `size="auto"` adapts sizes based on device (sm/mobile, md/tablet, lg/desktop)
- **Manual control**: Still supports manual `variant` and `size` props for specific use cases

### 2. Performance Optimization
- **Lazy loading**: Non-critical logos use `LazyImage` component with intersection observer
- **Priority loading**: Critical above-the-fold logos use `priority={true}` for eager loading
- **WebP support**: Modern image format with PNG/JPG fallbacks using `<picture>` elements
- **Responsive images**: Automatic 1x and 2x srcsets for retina displays
- **Explicit dimensions**: All images have width/height to prevent Cumulative Layout Shift (CLS)

### 3. Organization Custom Logos
- **Seamless integration**: Pass `customLogoUrl` and `organizationName` props
- **All optimizations applied**: Custom logos get same performance benefits as default logos
- **Graceful fallback**: Falls back to default ATS.me logo if custom logo fails to load

### 4. Dark Mode Optimization
- **Efficient rendering**: Horizontal variant shows appropriate logo based on theme
- **Single DOM element per logo**: Uses CSS `dark:hidden` / `dark:block` utilities
- **Auto theme support**: Automatically handles light/dark mode switching

### 5. Accessibility
- **Descriptive alt text**: Context-aware alt attributes
- **ARIA labels**: Screen reader friendly navigation hints
- **Keyboard navigation**: Proper focus indicators with visible ring
- **Color contrast**: Meets WCAG standards in both light and dark modes

### 6. Error Handling
- **Image error fallback**: Automatically falls back to text variant if images fail
- **State management**: Tracks loading and error states for robust UX

## Usage Examples

### Basic Usage (Default)
```tsx
<Brand />
// horizontal variant, md size, auto theme, priority=false
```

### Auto-Responsive
```tsx
<Brand variant="auto" size="auto" priority={true} />
// Icon on mobile, horizontal on desktop, size adapts to device
```

### Organization Custom Logo
```tsx
<Brand 
  customLogoUrl={organization?.logo_url}
  organizationName={organization?.name}
  variant="horizontal"
  size="md"
  priority={true}
/>
```

### Icon-Only (Mobile Headers)
```tsx
<Brand variant="icon" size="sm" showAsLink={false} priority={true} />
```

### Landing Page Hero
```tsx
<Brand variant="horizontal" size="xl" priority={true} />
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'horizontal' \| 'icon' \| 'text' \| 'auto'` | `'horizontal'` | Logo display style. `auto` adapts to device |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'auto'` | `'md'` | Logo size. `auto` adapts to device |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Theme mode for logo selection |
| `linkTo` | `string` | `'/'` | Navigation destination when clicked |
| `className` | `string` | `undefined` | Additional CSS classes |
| `showAsLink` | `boolean` | `true` | Whether to render as clickable link |
| `priority` | `boolean` | `false` | Enable eager loading for critical logos |
| `customLogoUrl` | `string \| null` | `undefined` | URL for organization custom logo |
| `organizationName` | `string` | `'ATS.me'` | Organization name for alt text |

## Implementation Locations

### Critical Logos (priority={true})
These logos are above the fold and should load immediately:
- `src/components/MobileHeader.tsx` - Mobile header icon
- `src/components/common/Header.tsx` - Public header logo
- `src/components/Layout.tsx` - Desktop collapsed sidebar logo
- `src/components/AppSidebar.tsx` - Sidebar header logo
- `src/features/landing/components/sections/HeroSection.tsx` - Hero section logo (if present)

### Organization Logos
- `src/components/AppSidebar.tsx` - Organization logo in sidebar header

### Lazy-Loaded Logos
All other logo instances use lazy loading by default for better performance.

## Performance Metrics

### Expected Improvements
- **40-60% faster** logo loading on mobile devices
- **Zero layout shift** (CLS < 0.1) from logo rendering
- **Reduced bandwidth** with WebP format (20-30% smaller file sizes)
- **Better Core Web Vitals** scores

### Lighthouse Targets
- **Performance**: 90+
- **Accessibility**: 100
- **Best Practices**: 95+
- **SEO**: 100

## Device-Specific Behavior

### Mobile (<768px)
- Auto-responsive: Uses `icon` variant
- Size: `sm` (24px)
- Touch-friendly minimum size: 44x44px tap target

### Tablet (768px-1024px)
- Auto-responsive: Can use either based on space
- Size: `md` (32px)
- Adapts to portrait/landscape orientation

### Desktop (>1024px)
- Auto-responsive: Uses `horizontal` variant
- Size: `lg` (40px)
- Full brand visibility with hover effects

### Ultra-wide (>1920px)
- Max-width constraints prevent oversizing
- Uses high-DPI assets (2x) for crisp rendering

## Best Practices

1. **Always use `priority={true}` for above-the-fold logos**
   - Headers, hero sections, navigation
   
2. **Use `variant="auto"` for adaptive layouts**
   - Automatically optimizes for device type
   
3. **Pass organization logos through Brand component**
   - Ensures consistent optimization and fallback behavior
   
4. **Provide descriptive `organizationName`**
   - Improves accessibility and SEO

5. **Test across devices**
   - Verify responsive behavior
   - Check loading performance
   - Validate accessibility

## Future Enhancements

- [ ] Automatic WebP generation on organization logo upload
- [ ] Multiple size variants stored in Supabase Storage
- [ ] Image optimization edge function
- [ ] Advanced caching strategies
- [ ] Progressive image loading with blur-up effect

## Related Components

- `src/components/optimized/LazyImage.tsx` - Lazy loading utility
- `src/hooks/useResponsiveLayout.tsx` - Responsive breakpoint detection
- `src/components/organizations/OrganizationLogoUpload.tsx` - Logo upload interface

## Testing Checklist

- [ ] Mobile devices (iPhone, Android)
- [ ] Tablets (iPad, Android tablets)
- [ ] Desktop browsers (Chrome, Safari, Firefox, Edge)
- [ ] Dark mode switching
- [ ] Slow network conditions (3G throttling)
- [ ] Image loading errors
- [ ] Custom organization logos
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
