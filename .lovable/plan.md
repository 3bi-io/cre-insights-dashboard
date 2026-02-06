
# Hero Background Image Strategy Review

## Critical Issue Identified

After reviewing the hero sections and content, I discovered a **significant misalignment** between the platform's positioning and the current hero imagery:

### Platform Positioning (from hero.content.ts)
```
Badge: "AI Voice Interviews Designed for No Resume Jobs"
Headline: "Interview Everyone"
Industries: Cyber | Healthcare | Trades | Transportation
```

### Current Hero Images (AI-Generated)
All 6 images are **trucking/transportation-focused**:
1. Homepage: Truck driver in cab
2. Companies: Fleet yard with semi-trucks
3. Features: Generic SaaS dashboard
4. Resources: Office/documentation setting
5. Blog: Highway/transportation scene
6. Contact: Support team

**This creates 3 problems**:
1. **Industry Mismatch**: 3 of 4 industries (Cyber, Healthcare, Trades) see imagery that doesn't represent them
2. **Reduced Trust**: Visitors from non-trucking industries may assume the platform isn't built for their needs
3. **Lower Conversion**: First impressions are critical - trucking-only visuals will cause bounce from other verticals

---

## Recommended Strategy for User Adoption

### Option A: Industry-Agnostic Heroes (Recommended)
Replace trucking-specific imagery with **abstract/universal visuals** that resonate across all 4 industries:

| Page | Current | Recommended | Rationale |
|------|---------|-------------|-----------|
| **Homepage** | Truck driver | **Diverse professionals + AI technology collage** | Shows multiple industries being served |
| **Companies** | Fleet yard | **Multi-industry employer montage** (hospital, warehouse, office, truck) | Represents employer diversity |
| **Features** | Dashboard | **Modern AI/tech visualization** | Already industry-neutral - keep |
| **Resources** | Office desk | **Professional development/learning** | Already industry-neutral - keep |
| **Blog** | Highway scene | **Abstract knowledge/insights visual** | Thought leadership for all industries |
| **Contact** | Support team | **Friendly, diverse team** | Already industry-neutral - keep |

### Option B: Industry-Rotating Heroes
Implement a hero carousel or randomized image selection showing all 4 industries cycling.

### Option C: Industry-Specific Landing Pages
Create `/trucking`, `/healthcare`, `/cyber`, `/trades` routes with industry-specific heroes and content, while keeping the main homepage industry-agnostic.

---

## Specific Image Recommendations

### 1. Homepage (`hero-home.jpeg`)
**Replace with**: A collage or split-screen showing:
- A healthcare worker taking a call
- A tradesperson at a job site
- A cybersecurity professional at a workstation
- A transportation professional

**Alternative**: Abstract AI/voice wave visualization with human silhouettes representing different professions

### 2. Companies (`hero-companies.jpeg`)
**Replace with**: Multi-industry employer showcase featuring:
- Hospital/medical facility
- Warehouse/logistics center
- Corporate office building
- Tech company environment

This signals "employers across industries use our platform"

### 3. Features (`hero-features.jpeg`)
**Keep current**: Generic SaaS/dashboard imagery works for all industries

### 4. Resources (`hero-resources.jpeg`)
**Keep current**: Professional development visuals are industry-neutral

### 5. Blog (`hero-blog.jpeg`)
**Replace with**: Abstract thought leadership visual (lightbulbs, neural networks, or professional insights imagery) rather than highway/transportation scene

### 6. Contact (`hero-contact.png`)
**Keep current**: Friendly support team imagery is industry-neutral

---

## Additional UX Recommendations

### Update `imageAlt` Attributes
Current `imageAlt` values reference trucking:
```tsx
// Current (HeroSection.tsx line 20)
imageAlt="Professional trucking and transportation recruitment"

// Recommended
imageAlt="AI-powered recruitment platform for essential workforce industries"
```

```tsx
// Current (ClientsHero.tsx line 16)
imageAlt="Transportation companies hiring CDL drivers"

// Recommended
imageAlt="Companies hiring across healthcare, trades, cyber, and transportation"
```

### Content Alignment Check
The `ClientsHero.tsx` also has transportation-specific copy:
```tsx
// Current (line 26-27)
"Browse top employers in the transportation industry..."

// Recommended
"Browse top employers hiring for essential workforce roles..."
```

---

## Implementation Priority

| Priority | Change | Impact |
|----------|--------|--------|
| **High** | Replace Homepage hero with multi-industry visual | First impression for all visitors |
| **High** | Replace Companies hero with diverse employer imagery | Jobseekers see industry relevance |
| **Medium** | Replace Blog hero with abstract thought leadership visual | Editorial credibility |
| **Low** | Features, Resources, Contact heroes are acceptable as-is | Industry-neutral already |

---

## Technical Implementation

### Files to Modify
1. `src/assets/heroes/hero-home.jpeg` - Replace with multi-industry image
2. `src/assets/heroes/hero-companies.jpeg` - Replace with diverse employer image
3. `src/assets/heroes/hero-blog.jpeg` - Replace with abstract insights image
4. `src/features/landing/components/sections/HeroSection.tsx` - Update imageAlt
5. `src/components/public/clients/ClientsHero.tsx` - Update imageAlt and copy

### Image Specifications
- **Size**: 1920x1080 (standard) or 2400x1350 (retina)
- **Format**: JPEG or WebP (70-80% quality)
- **Composition**: Left-weighted visual interest to allow text overlay on right/center
- **Color palette**: Professional blues, teals, and warm accent colors that work with the primary brand

---

## Next Steps

Please confirm which approach you'd like to proceed with:

1. **Generate 3 new AI images** for Homepage, Companies, and Blog with multi-industry themes
2. **Provide your own images** that represent the multi-industry platform
3. **Search for stock images** from Unsplash/Pexels that show workforce diversity
4. **Create industry-specific landing pages** with dedicated hero images per vertical
