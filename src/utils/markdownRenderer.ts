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
 * Renders content as HTML, automatically detecting markdown vs HTML input.
 * Always sanitizes output with DOMPurify.
 */
export function renderJobDescription(text: string): string {
  if (!text) return '';

  let html: string;
  if (looksLikeMarkdown(text)) {
    html = marked.parse(text, { async: false }) as string;
  } else {
    html = text;
  }

  return DOMPurify.sanitize(html);
}
