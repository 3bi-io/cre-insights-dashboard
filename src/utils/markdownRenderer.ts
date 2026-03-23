import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Detects whether a string contains markdown syntax rather than HTML.
 */
function looksLikeMarkdown(text: string): boolean {
  const markdownPatterns = [
    /^#{1,6}\s/m,        // headers
    /\*\*[^*]+\*\*/,     // bold
    /^\|.+\|$/m,         // tables
    /^[-*+]\s/m,         // unordered lists
    /^\d+\.\s/m,         // ordered lists
    /^>\s/m,             // blockquotes
    /```/,               // code blocks
  ];
  return markdownPatterns.some((p) => p.test(text));
}

/**
 * Converts dense sentence-style paragraphs into markdown bullet lists.
 * Only targets plain text lines with 3+ sentences; preserves headers, tables, and existing lists.
 */
function convertSentencesToBullets(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();

      // Skip empty lines, headers, tables, existing lists, blockquotes
      if (
        !trimmed ||
        /^#{1,6}\s/.test(trimmed) ||
        /^\|/.test(trimmed) ||
        /^[-*+]\s/.test(trimmed) ||
        /^\d+\.\s/.test(trimmed) ||
        /^>/.test(trimmed) ||
        /^```/.test(trimmed)
      ) {
        return line;
      }

      // Split on ". " boundaries (sentence endings)
      const segments = trimmed.split(/\.\s+/).filter(Boolean);

      // Only convert if there are 3+ segments (sentence-dense paragraph)
      if (segments.length < 3) return line;

      // Filter out very short segments (< 10 chars) to avoid splitting abbreviations
      const bullets = segments.map((s) => {
        // Remove trailing period if present
        const cleaned = s.replace(/\.$/, '').trim();
        return cleaned.length >= 10 ? `- ${cleaned}` : null;
      }).filter(Boolean);

      // If we got enough bullets, return as list; otherwise keep original
      return bullets.length >= 3 ? bullets.join('\n') : line;
    })
    .join('\n');
}

/**
 * Renders content as HTML, automatically detecting markdown vs HTML input.
 * Converts sentence-dense paragraphs to bullet lists, then sanitizes with DOMPurify.
 */
export function renderJobDescription(text: string): string {
  if (!text) return '';

  let processed = text;

  // Pre-process: convert sentence-packed paragraphs to bullet lists
  processed = convertSentencesToBullets(processed);

  let html: string;
  if (looksLikeMarkdown(processed)) {
    html = marked.parse(processed, { async: false }) as string;
  } else {
    html = processed;
  }

  return DOMPurify.sanitize(html);
}
