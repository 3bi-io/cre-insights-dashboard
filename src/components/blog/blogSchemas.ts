/**
 * Blog-specific structured data schema builders
 * Extracted from StructuredData.tsx for modularity
 */

const BASE_URL = import.meta.env.VITE_SITE_URL || 'https://applyai.jobs';

export interface BlogPostingInput {
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  authorTitle?: string | null;
  authorBio?: string | null;
  authorUrl?: string | null;
  authorSameAs?: string[];
  category?: string | null;
  tags?: string[];
  wordCount?: number;
  slug: string;
}

/**
 * Build a full BlogPosting schema with E-E-A-T, speakable, and AEO optimizations
 */
export const buildBlogPostingSchema = (input: BlogPostingInput) => {
  const canonicalUrl = `${BASE_URL}/blog/${input.slug}`;

  const authorEntity: Record<string, unknown> = {
    "@type": "Person",
    "name": input.authorName,
    ...(input.authorUrl && { "url": input.authorUrl }),
    ...(input.authorTitle && { "jobTitle": input.authorTitle }),
    ...(input.authorSameAs && input.authorSameAs.length > 0 && { "sameAs": input.authorSameAs }),
  };

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": input.title,
    "description": input.description,
    "image": input.image,
    "datePublished": input.datePublished,
    "dateModified": input.dateModified || input.datePublished,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    "author": authorEntity,
    "publisher": {
      "@type": "Organization",
      "name": "Apply AI",
      "url": BASE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": `${BASE_URL}/logo.png`,
      },
    },
    "isPartOf": {
      "@type": "Blog",
      "@id": `${BASE_URL}/blog`,
      "name": "Apply AI Blog",
      "url": `${BASE_URL}/blog`,
    },
    // Speakable spec for AEO — voice assistants read title + description
    "speakable": {
      "@type": "SpeakableSpecification",
      "xpath": [
        "/html/head/title",
        "/html/head/meta[@name='description']/@content"
      ],
    },
  };

  if (input.wordCount) schema.wordCount = input.wordCount;
  if (input.category) schema.articleSection = input.category;
  if (input.tags && input.tags.length > 0) schema.keywords = input.tags.join(', ');

  return schema;
};

export interface BlogIndexItem {
  slug: string;
  title: string;
  image?: string | null;
}

/**
 * Build CollectionPage + ItemList schema for blog index page
 */
export const buildBlogIndexSchema = (posts: BlogIndexItem[]) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Apply AI Blog",
  "description": "Expert insights on AI recruitment, applicant tracking systems, hiring strategies, and HR technology trends.",
  "url": `${BASE_URL}/blog`,
  "isPartOf": {
    "@type": "WebSite",
    "name": "Apply AI",
    "url": BASE_URL,
  },
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": posts.map((post, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `${BASE_URL}/blog/${post.slug}`,
      "name": post.title,
      ...(post.image && { "image": post.image }),
    })),
  },
});
