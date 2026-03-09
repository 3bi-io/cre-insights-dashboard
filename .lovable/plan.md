

## Fix: RovingFocusGroupItem Error in DashboardTabs

**Root cause**: `src/features/dashboard/components/DashboardTabs.tsx` renders `TabsTrigger` components inside a plain `<div>` instead of `TabsList`. Radix UI's `TabsList` provides the `RovingFocusGroup` context that `TabsTrigger` (a `RovingFocusGroupItem`) requires.

### Change

**`src/features/dashboard/components/DashboardTabs.tsx`**:
1. Add `TabsList` to the import from `@/components/ui/tabs`
2. Replace the inner `<div>` wrapping the `TabsTrigger` items (line 36-61) with `<TabsList>`, moving the styling classes onto it

The outer scroll wrapper `<div>` (line 35) stays as-is for horizontal scroll behavior. Only the inner container becomes `TabsList`.

```text
Before:
  <div className="inline-flex h-10 items-center gap-1 rounded-md bg-muted p-1 ...">
    <TabsTrigger ... />
  </div>

After:
  <TabsList className="inline-flex h-10 items-center gap-1 rounded-md bg-muted p-1 ...">
    <TabsTrigger ... />
  </TabsList>
```

Single file, ~3 lines changed. This will resolve the crash immediately.

