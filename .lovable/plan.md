

# Inline AI Job Search Assistant for /map

## What Changes

Replace the `MapStats` overlay (the bottom-left metric pills showing "571 jobs · 261 locations · 57%") with a premium inline AI assistant panel that acts as a context-aware job search copilot. Map metrics are preserved as a compact context strip inside the assistant, but the primary surface becomes an intelligent guide.

## Architecture

```text
┌──────────────────────────────────────────────────────┐
│  Map Canvas (unchanged)                              │
│                                                      │
│  ┌─── Filters (top, unchanged) ─────────────────┐   │
│  └──────────────────────────────────────────────-┘   │
│                                                      │
│                                                      │
│  ┌─── AI Assistant Panel (bottom-left) ──────────┐   │
│  │ ✦ AI Job Search Guide                         │   │
│  │ Context: 571 jobs · 261 loc · 57% mapped      │   │
│  │                                                │   │
│  │ "I see 571 CDL positions across 261 cities..." │   │
│  │                                                │   │
│  │ [Strongest markets] [Exact only] [Compare co.] │   │
│  │                                                │   │
│  │ ┌─ Conversation thread (expandable) ────────┐ │   │
│  │ │  User: Where should I look near Dallas?   │ │   │
│  │ │  AI: The DFW metro has 23 positions...    │ │   │
│  │ └──────────────────────────────────────────-─┘ │   │
│  │ [Ask a question...]                    [Send]  │   │
│  └────────────────────────────────────────────────┘   │
│                                        Controls (R)   │
└──────────────────────────────────────────────────────┘
```

## New Components

### 1. `MapAIAssistantPanel.tsx` (new file)

Main inline component replacing `MapStats`. Receives all map context as props:

**Props**: `totalJobs`, `uniqueLocations`, `exactCount`, `stateCount`, `countryCount`, `visibleJobs`, `mappedPercentage`, `filters`, `displayMode`, `companies`, `categories`, `isLoading`, plus callback handlers for `onFiltersChange`, `onToggleExactOnly`, `onFitBounds`, `onDisplayModeChange`.

**Sections**:
- **Header**: "AI Job Search Guide" with sparkle icon, collapsible on mobile
- **Context strip**: Compact single line — `571 jobs · 261 locations · 57% mapped (342 exact · 189 state · 40 intl)` — styled as subtle secondary text, not the primary surface
- **Proactive insight**: On first load (and when filters change), generates a contextual insight from current map state using the `ai-chat` edge function with a map-specific system prompt. Example: *"I see 571 CDL positions across 261 US cities. The strongest hiring markets are Dallas (47 jobs), Atlanta (38), and Jacksonville (31). 57% of positions have exact city coordinates — toggle 'Exact only' to focus on verified locations."*
- **Quick action chips**: Context-aware suggestions that either trigger AI queries or directly manipulate map state:
  - "Strongest hiring markets" → AI query
  - "Show only exact locations" → calls `onToggleExactOnly(true)`
  - "Compare companies in view" → AI query
  - "Summarize this area" → AI query with current filter context
  - "Help me refine this search" → AI query
  - Chips update based on active filters (e.g., if company filter is active, show "Other companies hiring here" instead)
- **Conversation area**: Expandable thread showing user messages and AI responses. Responses render with `react-markdown`. Each AI response can include action buttons that call back into map state (e.g., "Apply this filter" button).
- **Input**: Compact inline text input with send button, placeholder "Ask about jobs in this area..."

**Desktop layout**: Fixed panel, bottom-left, `max-w-sm`, glassmorphism card (`bg-background/95 backdrop-blur-md`), max-height ~40% viewport with scroll.

**Mobile layout**: Collapsed by default to a single-line trigger showing the insight summary. Tapping expands to a bottom sheet or full-width panel. Quick action chips scroll horizontally.

### 2. `useMapAIChat.ts` (new hook)

Manages the AI conversation state for the map assistant:

- Maintains message history (local state, not persisted)
- Builds context-enriched prompts by prepending current map state as a structured system context block
- Calls the existing `ai-chat` edge function via `supabase.functions.invoke` with streaming
- Parses SSE stream for token-by-token rendering
- Generates the initial proactive insight on mount and when filters change (debounced)
- Returns: `messages`, `isStreaming`, `sendMessage(text)`, `initialInsight`, `isInsightLoading`

**System prompt** (sent server-side via a new dedicated edge function or by extending `ai-chat`):

```
You are the AI Job Search Guide on Apply AI's interactive job map.
You have access to the user's current map context:
- Total jobs: {totalJobs}
- Visible locations: {uniqueLocations}  
- Confidence: {exactCount} exact, {stateCount} state-level, {countryCount} country-level
- Mapped coverage: {mappedPercentage}%
- Active filters: {filterSummary}
- Top companies: {topCompanies}
- Top categories: {topCategories}

Help users discover jobs by location. Be specific, actionable, and concise.
When suggesting map actions, format them as: [ACTION: filter_exact_only] or [ACTION: search_term "Dallas"]
so the UI can parse and offer clickable action buttons.
```

### 3. `map-ai-chat` edge function (new)

A lightweight wrapper around the existing `ai-chat` pattern but:
- **No auth required** (public /map page) — uses anon key rate limiting instead
- Stricter rate limit (10 req/min per IP)
- Map-specific system prompt injected server-side
- Accepts `mapContext` object in the request body alongside `messages`
- Streams response back via SSE

## Changes to Existing Files

### `JobMapPage.tsx`
- Remove `MapStats` import and usage
- Add `MapAIAssistantPanel` in its place
- Pass map state + callback handlers as props
- Add callbacks for AI-triggered actions: `handleSetExactOnly`, `handleSearchFromAI`, `handleFocusRegion`

### `MapStats.tsx`
- Keep the file but it's no longer rendered directly in JobMapPage
- The context strip inside the AI panel reuses the same data, styled as a compact inline summary

### `index.ts`
- Export new `MapAIAssistantPanel`

## Key Design Decisions

- **No auth wall**: The map is a public page. The AI assistant uses the `map-ai-chat` edge function with IP-based rate limiting (10 req/min) instead of requiring login.
- **Proactive first content**: The initial insight is generated on load so users see immediate value, not an empty chat box.
- **Action-aware responses**: AI responses can contain structured action markers that the UI parses into clickable buttons (e.g., "Toggle exact only", "Search for Dallas").
- **Metrics preserved, not removed**: All confidence counts and mapped percentage remain visible as a compact context strip, just visually subordinate to the assistant experience.
- **Performance**: Initial insight is debounced and cached. Conversation messages stream token-by-token. No heavy re-renders on the map layer.

## Files Changed

1. `supabase/functions/map-ai-chat/index.ts` — **New** — public edge function for map AI
2. `src/components/map/MapAIAssistantPanel.tsx` — **New** — inline AI assistant component
3. `src/hooks/useMapAIChat.ts` — **New** — streaming chat hook with map context
4. `src/pages/public/JobMapPage.tsx` — Replace `MapStats` with `MapAIAssistantPanel`, wire callbacks
5. `src/components/map/index.ts` — Export new component

## Mobile Behavior

- Collapsed state: Single-line context bar ("571 jobs · 57% mapped · AI Guide ▸")
- Tapping expands to a panel covering bottom ~60% with quick chips + conversation
- Input has 44px touch target, chips are scrollable horizontally
- Collapsing preserves conversation state

