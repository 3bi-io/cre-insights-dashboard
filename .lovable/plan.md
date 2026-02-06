

# Hero Background Image Replacement Plan

## Executive Summary
After reviewing all 6 current hero background images, I've identified several issues with contextual alignment, visual quality, and industry relevance. This plan provides a systematic approach to replace each image with best-in-class alternatives that better match each page's purpose for a CDL/trucking recruitment platform.

---

## Current Image Analysis

### 1. Homepage (`hero-home.jpeg`)
**Current State**: AI robot with social media icons and Tenstreet branding in a city nightscape
**Issues**:
- Robot imagery feels generic and doesn't convey the trucking/CDL industry focus
- Social media icons visible in background create visual noise
- Mixed messaging between AI technology and human recruitment
**Recommendation**: Replace with professional image showing real truck drivers, fleet operations, or driver recruitment scene

### 2. Companies Page (`hero-companies.jpeg`)
**Current State**: Same AI robot/social media style as homepage
**Issues**:
- Identical visual theme as homepage - no differentiation
- Doesn't convey "companies hiring" or employer branding
- Robot imagery doesn't match "browse top employers" messaging
**Recommendation**: Replace with image showing trucking company fleet, professional drivers, or corporate transportation environment

### 3. Features Page (`hero-features.jpeg`)
**Current State**: AI robot with workflow/platform UI mockups
**Issues**:
- Cluttered composition with overlapping UI elements
- Text in image creates double-reading confusion with overlay text
- Tenstreet logo visible - shouldn't feature competitor branding
**Recommendation**: Replace with clean technology/dashboard imagery or abstract SaaS platform visualization

### 4. Resources Page (`hero-resources.jpeg`)
**Current State**: Night cityscape with buildings
**Issues**:
- Generic stock cityscape - no connection to trucking or documentation
- Doesn't convey "knowledge base" or educational content
- Low contrast makes text overlay difficult
**Recommendation**: Replace with image suggesting learning, documentation, or professional development in transportation

### 5. Blog Page (`hero-blog.jpeg`)
**Current State**: Warm cityscape at sunset/dusk
**Issues**:
- Generic cityscape with no transportation connection
- Duplicates the city theme from Resources page
- Doesn't convey industry insights or thought leadership
**Recommendation**: Replace with image suggesting industry expertise, road/highway scenes, or professional trucking content

### 6. Contact Page (`hero-contact.png`)
**Current State**: AI robot with customer service representative and communication icons
**Issues**:
- Robot placement competes with human customer service rep
- Mixed messaging about AI vs. human support
- Communication icons (envelope, phone) are cluttered
**Recommendation**: Replace with clean customer support imagery, professional team photo, or welcoming office environment

---

## Recommended Image Strategy

### Image Requirements Per Page

| Page | Recommended Subject Matter | Mood/Tone | Key Elements |
|------|---------------------------|-----------|--------------|
| **Homepage** | Truck driver in cab, fleet on highway, or driver recruitment | Aspirational, Professional | Real people, trucks, open road |
| **Companies** | Fleet of trucks, corporate yard, driver team | Corporate, Trustworthy | Multiple trucks, professional setting |
| **Features** | Clean tech dashboard, abstract SaaS UI, or modern office | Modern, Innovative | Technology focus, clean lines |
| **Resources** | Learning environment, documentation, training | Educational, Supportive | Books, guides, professional development |
| **Blog** | Highway at golden hour, truck on scenic route | Thoughtful, Industry-focused | Transportation theme, editorial feel |
| **Contact** | Customer support team, welcoming office, handshake | Friendly, Accessible | Human connection, approachable |

---

## Implementation Approach

### Phase 1: Image Sourcing
Source high-quality images (1920x1080 minimum, WebP preferred) from:
- Professional stock libraries (Unsplash, Pexels, Shutterstock)
- Custom AI-generated images tailored to trucking/CDL recruitment
- Existing brand asset library if available

### Phase 2: Image Optimization
For each new image:
1. Resize to 1920x1080 (standard) or 2400x1350 (retina)
2. Convert to WebP format (70-80% quality)
3. Ensure sufficient contrast in overlay regions
4. Test text readability with current overlay variants

### Phase 3: Implementation
Replace images in `src/assets/heroes/`:
1. `hero-home.jpeg` - New trucking/driver recruitment image
2. `hero-companies.jpeg` - Fleet/corporate trucking image
3. `hero-features.jpeg` - Clean technology platform image
4. `hero-resources.jpeg` - Educational/documentation image
5. `hero-blog.jpeg` - Editorial transportation image
6. `hero-contact.png` - Customer support/team image

### Phase 4: Overlay Adjustments
Review and adjust overlay variants after new images are applied:
- **Dark overlay**: For bright/high-contrast images
- **Gradient overlay**: For balanced compositions
- **Light overlay**: For darker base images

---

## Technical Details

### Files to Modify
```
src/assets/heroes/
  hero-home.jpeg (or .webp)
  hero-companies.jpeg (or .webp)
  hero-features.jpeg (or .webp)
  hero-resources.jpeg (or .webp)
  hero-blog.jpeg (or .webp)
  hero-contact.png (or .webp)
```

### Potential Component Updates
If new images have significantly different brightness/contrast:
- `src/features/landing/components/sections/HeroSection.tsx` - May need overlay adjustment
- `src/components/public/clients/ClientsHero.tsx` - May need overlay adjustment
- `src/pages/public/FeaturesPage.tsx` - May need overlay adjustment
- `src/pages/public/ResourcesPage.tsx` - May need overlay adjustment
- `src/pages/public/BlogPage.tsx` - May need overlay adjustment
- `src/pages/public/ContactPage.tsx` - May need overlay adjustment

---

## Next Steps
To proceed, please provide:
1. **6 new images** matching the recommended subject matter above, OR
2. **Approval to use AI-generated images** for each page context, OR
3. **Stock image budget/preferences** for sourcing from commercial libraries

Once images are provided, I will implement the replacements with optimized overlays for each page.

