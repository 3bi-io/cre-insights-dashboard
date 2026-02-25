/**
 * Blog Table of Contents
 * Auto-generates TOC from H2/H3 headings in blog post content
 * Creates anchor links for jump navigation and sitelink eligibility
 */

import React, { useMemo } from 'react';
import { List } from 'lucide-react';

interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

interface BlogTableOfContentsProps {
  content: string;
}

/**
 * Parse HTML content and extract H2/H3 headings for TOC generation
 */
function extractHeadings(html: string): TocItem[] {
  const headings: TocItem[] = [];
  const regex = /<h([23])[^>]*(?:id="([^"]*)")?[^>]*>(.*?)<\/h[23]>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1]) as 2 | 3;
    const existingId = match[2];
    const rawText = match[3].replace(/<[^>]+>/g, '').trim();
    const id = existingId || rawText.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

    if (rawText) {
      headings.push({ id, text: rawText, level });
    }
  }

  return headings;
}

const BlogTableOfContents: React.FC<BlogTableOfContentsProps> = ({ content }) => {
  const headings = useMemo(() => extractHeadings(content), [content]);

  if (headings.length < 3) return null;

  return (
    <nav
      aria-label="Table of contents"
      className="mb-8 p-5 rounded-lg border bg-muted/30"
    >
      <div className="flex items-center gap-2 mb-3">
        <List className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Table of Contents
        </h2>
      </div>
      <ol className="space-y-1.5 text-sm">
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={heading.level === 3 ? 'ml-4' : ''}
          >
            <a
              href={`#${heading.id}`}
              className="text-muted-foreground hover:text-primary transition-colors leading-relaxed"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
};

/**
 * Inject id attributes into H2/H3 tags in HTML content for anchor linking
 */
export function injectHeadingIds(html: string): string {
  return html.replace(
    /<h([23])([^>]*)>(.*?)<\/h[23]>/gi,
    (match, level, attrs, inner) => {
      if (/id="/.test(attrs)) return match;
      const text = inner.replace(/<[^>]+>/g, '').trim();
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
      return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
    }
  );
}

export default BlogTableOfContents;
