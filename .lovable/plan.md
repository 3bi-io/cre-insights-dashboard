

# Remove Spinning Wheels from Hero Section

## Change

### Update `src/components/public/clients/ClientsHero.tsx`
- Remove the `TruckWheelSpin` import
- Remove the `overlayContent={<TruckWheelSpin active />}` prop from `HeroBackground`

This is the only hero using spinning wheels. The landing page hero uses `WeldingSparks` (not wheels), so it stays untouched.

