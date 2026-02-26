

## Replace SEO Blog Post Image

### What
Copy the uploaded image into the project assets and map it as the featured hero image for the "Advanced SEO Implementation Guide 2026" blog post.

### Steps

1. **Copy image to project** -- Save `user-uploads://IMG_4783.jpeg` to `src/assets/blog/seo-guide-hero.jpg`

2. **Also copy to public directory** -- Save a copy to `public/og-blog-seo-guide.png` so the OG image URL already mapped in `BLOG_OG_IMAGE_MAP` resolves correctly for social sharing

3. **Update `src/utils/blogImageUtils.ts`**:
   - Add import: `import seoGuideHero from '@/assets/blog/seo-guide-hero.jpg'`
   - Add entry to `BLOG_IMAGE_MAP`: `'advanced-seo-implementation-guide-2026': seoGuideHero`

This will make the uploaded image appear as the hero image on the blog post page, in blog post cards on the index, and in related posts -- replacing the current default fallback.

