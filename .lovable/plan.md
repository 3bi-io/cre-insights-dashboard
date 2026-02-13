

## Three-Factor Navigation Menu with Blog Link

### Overview
Implement a unified three-factor navigation pattern across all device sizes for the public-facing pages, and restore the Blog link to navigation. The three factors are: **Brand** | **Navigation Links** | **Action Buttons** -- consistently visible on all screen sizes.

### Current State
- **Desktop**: Full horizontal nav with all links visible, auth buttons on right
- **Mobile**: Brand + hamburger menu that opens a side sheet -- nav links are hidden behind it
- **Blog link**: Already exists in `publicNavigationConfig.ts` at `/blog` with a "NEW" badge

### What Changes

#### 1. Redesign the Public Header (`src/components/common/Header.tsx`)
- Implement a consistent three-factor layout for all breakpoints:
  - **Factor 1 (Left)**: Brand/Logo
  - **Factor 2 (Center)**: Primary navigation links (Jobs, Employers, Features, Resources, Blog, Contact) -- on mobile, these collapse into a compact horizontal scrollable strip or a bottom-sheet menu triggered by a centered nav button
  - **Factor 3 (Right)**: Auth actions (Sign In / Start Free Trial) + Theme Toggle
- On mobile, show a condensed but always-visible nav bar rather than hiding everything behind a hamburger
- Ensure Blog link with "NEW" badge is always present in the navigation items

#### 2. Mobile Navigation Approach
- Replace the hamburger sheet with a **bottom navigation bar** for public pages (similar pattern to the admin `MobileBottomNav`)
- Show the top 4-5 nav items as icons with labels in a fixed bottom bar
- Overflow items go into a "More" sheet
- Keep the top header slim with Brand (left) and Auth actions (right)

#### 3. Tablet/Mid-size Adaptation
- Between mobile and desktop, show a condensed horizontal nav with shorter labels or icon-only mode
- Auth buttons remain visible at all breakpoints

### Technical Details

**Files to modify:**
- `src/components/common/Header.tsx` -- Restructure into three-factor layout with responsive behavior; replace hamburger with always-visible nav
- `src/components/public/PublicLayout.tsx` -- Add a `PublicBottomNav` component for mobile
- `src/config/publicNavigationConfig.ts` -- Confirm Blog entry is present (it already is)

**New files:**
- `src/components/public/PublicBottomNav.tsx` -- Mobile bottom navigation for public pages with primary nav items + "More" overflow

**Key implementation details:**
- Use the existing `publicNavigation` config array which already includes the Blog entry with `isNew: true`
- Desktop (md+): Horizontal links centered, Brand left, Auth right -- all three factors visible
- Mobile (<md): Brand + Auth top bar, bottom nav with icons for Jobs, Employers, Blog, Resources, More
- Bottom nav uses safe-area insets for Android/iOS compatibility (existing pattern from `MobileBottomNav`)
- Blog link keeps its "NEW" badge across all navigation factors

