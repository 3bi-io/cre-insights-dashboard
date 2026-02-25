/**
 * Breadcrumb Structured Data Builder
 * Generates JSON-LD BreadcrumbList schema for SEO
 */

import { SITE_URL } from '@/config/siteConfig';

export interface BreadcrumbItem {
  name: string;
  href: string;
}

export const buildBreadcrumbSchema = (items: BreadcrumbItem[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": `${SITE_URL}${item.href}`,
  })),
});
