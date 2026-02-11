

## Add ZipRecruiter Tracking Pixel to Apply Pages

### Approach

Create a small reusable `ZipRecruiterPixel` component and add it to all apply-related pages.

### Changes

#### 1. New Component: `src/components/tracking/ZipRecruiterPixel.tsx`

A simple component rendering the 1x1 tracking pixel image:
```tsx
const ZipRecruiterPixel = () => (
  <img
    src="https://track.ziprecruiter.com/conversion?enc_account_id=8e21fb39"
    width="1"
    height="1"
    alt=""
    aria-hidden="true"
    style={{ position: 'absolute', left: '-9999px' }}
  />
);
```

#### 2. Add pixel to these pages:

- **`src/pages/Apply.tsx`** (`/apply`)
- **`src/pages/DetailedApply.tsx`** (`/apply/detailed`)
- **`src/pages/EmbedApply.tsx`** (`/embed/apply`)
- **`src/pages/LinkedInApply.tsx`**, **`src/pages/XApply.tsx`**, **`src/pages/SocialApply.tsx`**, **`src/pages/SocialEmbedApply.tsx`** -- these redirect to `/apply`, so the pixel fires on the destination page already. No changes needed.

Each page gets `<ZipRecruiterPixel />` added inside the JSX return, firing on page load.

