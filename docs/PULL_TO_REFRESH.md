# Pull-to-Refresh Feature

## Overview

ATS.me now includes a native-feeling pull-to-refresh feature that works seamlessly on mobile devices. Users can pull down on any page to refresh the content.

## How It Works

### For Users

1. **On Mobile Devices**: Simply pull down from the top of any page
2. **Visual Feedback**: An animated icon appears showing the refresh progress
3. **Auto-Refresh**: Release when the icon reaches the threshold to trigger refresh
4. **Confirmation**: A brief toast notification confirms the refresh

### For Developers

The pull-to-refresh system consists of two main components:

#### 1. `usePullToRefresh` Hook

Located in `src/hooks/usePullToRefresh.ts`

```typescript
const { containerRef, isRefreshing, pullDistance } = usePullToRefresh({
  onRefresh: async () => {
    // Your refresh logic here
  },
  enabled: true,
  threshold: 80,
  resistance: 2.5
});
```

**Options:**
- `onRefresh`: Function to call when refresh is triggered (can be async)
- `enabled`: Boolean to enable/disable the feature (default: true)
- `threshold`: Distance in pixels before refresh triggers (default: 80)
- `resistance`: Pull resistance multiplier for natural feel (default: 2.5)

#### 2. `PullToRefresh` Component

Located in `src/components/PullToRefresh.tsx`

```typescript
<PullToRefresh
  onRefresh={handleRefresh}
  enabled={isMobile}
  className="flex-1"
>
  {/* Your content here */}
</PullToRefresh>
```

**Props:**
- `onRefresh`: Refresh handler function
- `enabled`: Enable/disable the feature
- `className`: Additional CSS classes
- `children`: Content to wrap

## Implementation

The feature is already integrated into the main `Layout.tsx` component:

```typescript
const handleRefresh = useCallback(async () => {
  await queryClient.invalidateQueries();
  toast({
    description: "Content refreshed",
    duration: 2000,
  });
}, [queryClient, toast]);

<PullToRefresh 
  onRefresh={handleRefresh} 
  enabled={isMobile}
  className="flex-1 flex flex-col pb-16 md:pb-0"
>
  <main className="flex-1">
    <Outlet />
  </main>
</PullToRefresh>
```

## Adding to Other Components

To add pull-to-refresh to specific pages:

```typescript
import { PullToRefresh } from '@/components/PullToRefresh';
import { useQueryClient } from '@tanstack/react-query';

const MyPage = () => {
  const queryClient = useQueryClient();
  
  const handleRefresh = async () => {
    // Invalidate specific queries
    await queryClient.invalidateQueries({ queryKey: ['myData'] });
    
    // Or refetch data manually
    await refetchMyData();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      {/* Your page content */}
    </PullToRefresh>
  );
};
```

## Customization

### Adjust Pull Sensitivity

```typescript
const { containerRef, isRefreshing, pullDistance } = usePullToRefresh({
  onRefresh: handleRefresh,
  threshold: 100, // Require more pull distance
  resistance: 3,  // More resistance (feels heavier)
});
```

### Custom Refresh Indicator

Modify `src/components/PullToRefresh.tsx` to customize the visual indicator:

```typescript
{isRefreshing ? (
  <YourCustomSpinner />
) : (
  <YourCustomIcon pullDistance={pullDistance} />
)}
```

### Page-Specific Behavior

```typescript
// Only enable on certain pages
const location = useLocation();
const enableRefresh = location.pathname === '/dashboard';

<PullToRefresh enabled={enableRefresh} onRefresh={handleRefresh}>
  {children}
</PullToRefresh>
```

## Technical Details

### Touch Event Handling

- Uses native touch events (`touchstart`, `touchmove`, `touchend`)
- Prevents default scroll behavior during pull
- Only triggers when scrolled to top of page
- Applies resistance curve for natural feel

### Performance

- Uses `useCallback` to memoize event handlers
- Cleanup on component unmount
- Minimal re-renders with state management
- Passive event listeners where possible

### Compatibility

- **Mobile Browsers**: iOS Safari, Chrome, Firefox, Edge
- **Desktop**: Disabled by default (can be enabled)
- **Progressive Enhancement**: Works without JavaScript (basic scroll)

## Best Practices

1. **Enable on Mobile Only**: Use `isMobile` hook to enable only on mobile devices
2. **Clear Feedback**: Always show toast or confirmation after refresh
3. **Fast Refresh**: Keep refresh logic under 2 seconds for best UX
4. **Invalidate Queries**: Use React Query's `invalidateQueries` for automatic refetch
5. **Error Handling**: Handle refresh failures gracefully

## Troubleshooting

### Pull-to-refresh not working

1. Check if component is wrapped with `<PullToRefresh>`
2. Verify `enabled` prop is `true`
3. Ensure scrollable content reaches top (scrollTop === 0)
4. Check browser console for touch event errors

### Conflicts with native pull-to-refresh

Add to parent container:
```css
overscroll-behavior: none;
-webkit-overflow-scrolling: touch;
```

### Performance issues

- Reduce `threshold` value
- Increase `resistance` value
- Debounce `onRefresh` function
- Use `React.memo` on child components

## Future Enhancements

- [ ] Haptic feedback on supported devices
- [ ] Customizable animations
- [ ] Multi-directional pull (swipe to delete, etc.)
- [ ] Analytics tracking for refresh events
- [ ] A/B testing different thresholds
