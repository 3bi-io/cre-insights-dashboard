
# Fix: AI Analytics Page Not Loading

## Problem Identified

The `/ai-analytics` page fails to render because of a missing `TabsList` component in `AIAnalyticsPage.tsx`.

In Radix UI's Tabs component, `TabsTrigger` elements **must** be wrapped inside a `TabsList` component. The recent refactoring removed this wrapper, causing the component to crash during render.

## Current (Broken) Code Structure

```text
<Tabs>
  <div className="w-full overflow-x-auto...">      <-- Wrapper div
    <div className="inline-flex h-auto...">        <-- Inner div (styled like TabsList)
      <TooltipProvider>
        {tabs.map(() => (
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger ... />                  <-- NOT inside TabsList!
            </TooltipTrigger>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  </div>
  <TabsContent ... />
</Tabs>
```

## Fix Required

Replace the inner `<div>` with `<TabsList>` component while maintaining the custom styling:

```text
<Tabs>
  <div className="w-full overflow-x-auto...">      <-- Keep wrapper for scroll
    <TabsList className="inline-flex h-auto...">   <-- Use TabsList instead of div
      <TooltipProvider>
        {tabs.map(() => (
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger ... />                  <-- Now correctly inside TabsList
            </TooltipTrigger>
          </Tooltip>
        ))}
      </TooltipProvider>
    </TabsList>
  </div>
  <TabsContent ... />
</Tabs>
```

## Files to Modify

| File | Change |
|------|--------|
| `src/features/ai-analytics/pages/AIAnalyticsPage.tsx` | Replace inner `<div>` on line 103 with `<TabsList>` component |

## Code Change (Line 103)

**Before:**
```tsx
<div className="inline-flex h-auto items-center gap-1 rounded-md bg-muted p-1 text-muted-foreground min-w-max md:min-w-0 md:w-full md:grid md:grid-cols-6">
```

**After:**
```tsx
<TabsList className="inline-flex h-auto items-center gap-1 rounded-md bg-muted p-1 text-muted-foreground min-w-max md:min-w-0 md:w-full md:grid md:grid-cols-6">
```

Also close with `</TabsList>` instead of `</div>` on line 122.

## Why This Happened

During the mobile tab UX improvement, the standard `<TabsList>` was replaced with a styled `<div>` to achieve horizontal scrolling. However, Radix UI Tabs requires the semantic `TabsList` component to properly register and manage tab triggers.

## Testing

After the fix:
1. Navigate to `/ai-analytics`
2. Verify page loads with all six tabs visible
3. Test tab switching functionality
4. Verify mobile horizontal scroll works
5. Confirm tooltips appear on mobile (icon-only mode)
