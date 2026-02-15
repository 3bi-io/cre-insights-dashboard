

## Hero Background Image Audit and Upgrade Recommendations

### Current Inventory

There are **9 hero images** in `src/assets/hero/`, all in PNG format:

| Image File | Used On | Current Subject |
|---|---|---|
| `voice-hero.png` | Homepage (primary) | AI/voice technology abstract |
| `cyber-hero.png` | Homepage (slideshow) | Cybersecurity theme |
| `trades-hero.png` | Homepage (slideshow) | Trades/welding theme |
| `healthcare-hero.png` | Homepage (slideshow) | Healthcare theme |
| `transport-hero.png` | Clients page | Digital truck/fleet wireframe |
| `jobs-hero.png` | Jobs page | Workforce/industry abstract |
| `social-hero.png` | Features + Blog pages | Social network/connections |
| `roi-hero.png` | Demo page | Business analytics/charts |
| `trust-hero.png` | Contact + Resources pages | Trust/security shield |

---

### Issues Identified

**1. Generic, stock-feel AI-generated aesthetic**
Every image appears to be an AI-generated abstract/digital illustration with neon-blue wireframes on dark backgrounds. While they match the dark theme, they all look like the same image with minor variations -- giving the entire platform a templated, "SaaS starter kit" feel rather than a premium, differentiated brand.

**2. No real people**
A recruitment platform should feature **real professionals at work**. The current images are entirely abstract digital art with no human presence. This undermines trust and emotional connection, especially for a product whose core value is connecting people (candidates and employers).

**3. Duplicate usage**
- `social-hero.png` is reused on both Features AND Blog pages
- `trust-hero.png` is reused on both Contact AND Resources pages
Every page should have its own distinct hero to reinforce page identity.

**4. Format and performance**
All images are PNG. For hero backgrounds under dark overlays, WebP or AVIF would deliver 40-60% smaller file sizes with equivalent or better quality. The codebase already has WebP assets (`hero-recruitment-*.webp`) showing this pattern is established.

**5. Low visual contrast and detail**
Because every image is primarily dark blue/black with faint wireframe elements, and then a 65-70% dark overlay is applied on top, the final visual result is essentially a near-solid dark background with barely-visible ghost lines. The images aren't contributing meaningful visual impact.

---

### Recommended New Image Direction

Each hero image should be a **high-resolution photograph** (not AI-generated art) with the following characteristics:

| Page | Recommended Subject | Mood/Style |
|---|---|---|
| **Homepage primary** | Diverse group of professionals in a modern office environment, someone speaking into a phone/headset (voice theme) | Warm, energetic, welcoming. Shallow depth of field. Golden-hour lighting. |
| **Homepage slide: Cyber** | Cybersecurity professional at a SOC (Security Operations Center) with multiple monitors | Cool blue-toned, high-tech, focused |
| **Homepage slide: Trades** | Skilled tradesperson (welder, electrician, or mechanic) actively working, sparks visible | Warm amber/orange tones, action-oriented, gritty authenticity |
| **Homepage slide: Healthcare** | Healthcare workers (nurse, technician) in a clinical setting, friendly and approachable | Clean whites and soft blues, trustworthy |
| **Jobs page** | Aerial/wide shot of a bustling logistics hub, warehouse, or cityscape with workers | Scale, opportunity, movement |
| **Clients/Employers page** | Executive team or hiring managers in a boardroom/interview setting | Professional, collaborative, aspirational |
| **Features page** | Close-up of hands interacting with a modern software dashboard on a large screen or tablet | Tech-forward, clean, product-focused |
| **Blog page** | Open notebook/laptop on a desk with coffee, editorial/content creation vibe | Warm, knowledge-focused, approachable |
| **Demo page** | Split-screen style: person on a video call or webinar, data visualizations visible | Interactive, demo-oriented, engaging |
| **Contact page** | Friendly customer support team member with headset, open body language | Approachable, responsive, human |
| **Resources page** | Organized workspace with guides/documents/tablet showing charts | Educational, structured, resourceful |

---

### Technical Specifications for New Images

- **Resolution**: 2400px wide minimum (provide 600w, 1200w, 2400w srcset variants as already established with `hero-recruitment-*.webp`)
- **Format**: WebP primary, with PNG fallback. Consider AVIF for next-gen browsers.
- **Aspect ratio**: 16:9 or 21:9 (ultrawide) to cover full-width hero sections
- **File size target**: Under 150KB per WebP variant at 1200w; under 300KB at 2400w
- **Composition**: Subject weighted to center-left (content overlays are left-aligned per the `max-w-3xl` design language), leaving the right third relatively open or blurred
- **Color grading**: Each image should work well under a 60-65% dark overlay. Avoid images that are already very dark. Prefer images with mid-tone brightness so the overlay creates depth rather than a black void.
- **Licensing**: Use royalty-free stock from Unsplash, Pexels, or licensed stock (Shutterstock/Getty) -- NOT AI-generated images for credibility.

---

### Image Generation Alternative

If using the Lovable AI image generation (Gemini model) to produce these, craft prompts like:

- **"Professional photograph of diverse truck drivers standing in front of a fleet of semi-trucks at sunrise, warm golden lighting, shallow depth of field, 16:9 aspect ratio, high resolution, editorial quality"**
- **"Close-up photograph of a cybersecurity analyst working at multiple monitors in a dark SOC room, blue screen glow on face, cinematic lighting"**
- **"Skilled welder working on steel beams with bright welding sparks, dramatic orange and blue contrast, industrial setting, editorial photography"**

Use the `google/gemini-3-pro-image-preview` model (higher quality) for these hero images since they are high-visibility, brand-defining assets.

---

### Delivery Checklist

For each of the 11 images above:
1. Generate or source the photograph at 2400px+ width
2. Export 3 WebP variants: 600w, 1200w, 2400w
3. Keep a single PNG fallback at 1200w
4. Name consistently: `hero-[page]-[width].webp` (e.g., `hero-jobs-1200.webp`)
5. Update the `HeroBackground` component's `srcSet` and `sizes` props for responsive loading
6. Remove the old PNG files from `src/assets/hero/`
7. Verify each image looks good under the existing 60-65% dark overlay in both light and dark theme modes

