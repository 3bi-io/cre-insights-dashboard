

# Extend Social Express Form to X and All Social Traffic

## Problem
The `SocialExpressForm` (2-step, mobile-optimized) only triggers for Meta traffic. X/Twitter, LinkedIn, and TikTok traffic all fall through to the full 4-step form despite having identical low-patience user behavior.

## Changes

### 1. Expand `useSourceDetection` hook
Add X/Twitter and other social platform detection:

- **New constants**: `X_UTM_SOURCES = ['x', 'twitter']`, `X_REFERRER_DOMAINS = ['x.com', 'twitter.com', 't.co']`, plus LinkedIn (`linkedin.com`) and TikTok (`tiktok.com`)
- **New return field**: `isXTraffic: boolean` alongside existing `isMetaTraffic`
- **Fix `isSocialTraffic`**: Currently only true for Meta. Make it true for ANY social source (Meta, X, LinkedIn, TikTok)
- **Source detection priority**: `fbclid` → Meta UTM → X UTM → LinkedIn/TikTok UTM → referrer domain check → organic

### 2. Update `Apply.tsx` routing logic
Change the conditional from `isMetaTraffic` to `isSocialTraffic`:
```
isSocialTraffic ? <SocialExpressForm /> : <ApplicationForm />
```
This makes the express form serve ALL social traffic, not just Meta.

### 3. Update `ApplicationHeader.tsx`
Change `isExpressMode` prop from `isMetaTraffic && !isOutsideAmericas` to `isSocialTraffic && !isOutsideAmericas`.

### 4. No backend changes needed
The `submit-application` edge function already handles `utm_source=x` via its `UTM_SOURCE_MAP` normalization.

## Impact
- Any future X ad campaigns will automatically get the optimized 2-step form
- LinkedIn and TikTok traffic (if added later) will also benefit
- Zero risk to existing Meta express flow -- it's additive
- ZipRecruiter/Indeed/Direct/Voice traffic unaffected (keeps full form)

