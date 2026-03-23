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
function isStructuredLine(trimmed: string): boolean {
  return (
    !trimmed ||
    /^#{1,6}\s/.test(trimmed) ||
    /^\|/.test(trimmed) ||
    /^[-*+]\s/.test(trimmed) ||
    /^\d+\.\s/.test(trimmed) ||
    /^>/.test(trimmed) ||
    /^```/.test(trimmed) ||
    /^\*\*/.test(trimmed)
  );
}

/**
 * Converts dense sentence-style paragraphs into markdown bullet lists.
 * Also converts comma-separated lists (3+ segments ≥10 chars) into bullets.
 * Preserves headers, tables, and existing lists.
 */
function convertSentencesToBullets(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();

      if (isStructuredLine(trimmed)) return line;

      // Try splitting on ". " boundaries first
      const sentenceSegments = trimmed.split(/\.\s+/).filter(Boolean);
      if (sentenceSegments.length >= 3) {
        const bullets = sentenceSegments
          .map((s) => s.replace(/\.$/, '').trim())
          .filter((s) => s.length >= 10)
          .map((s) => `- ${s}`);
        if (bullets.length >= 3) return bullets.join('\n');
      }

      // Try splitting on ", " boundaries (for comma-separated lists like deductions)
      const commaSegments = trimmed.split(/,\s+/).filter(Boolean);
      if (commaSegments.length >= 3) {
        const bullets = commaSegments
          .map((s) => s.replace(/,$/, '').trim())
          .filter((s) => s.length >= 10)
          .map((s) => `- ${s}`);
        if (bullets.length >= 3) return bullets.join('\n');
      }

      return line;
    })
    .join('\n');
}

/**
 * Adds a bold "Summary" header and bolds the first content line.
 */
function addSummaryHeader(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let addedHeader = false;
  let boldedFirst = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // If the text already starts with a header, skip adding Summary
    if (!addedHeader && trimmed && /^#{1,6}\s/.test(trimmed)) {
      addedHeader = true;
      boldedFirst = true; // headers are already bold
      result.push(line);
      continue;
    }

    // Add Summary header before first content line
    if (!addedHeader && trimmed) {
      addedHeader = true;
      result.push('## Summary');
      result.push('');
    }

    // Bold the first non-empty, non-header content line
    if (addedHeader && !boldedFirst && trimmed && !isStructuredLine(trimmed)) {
      boldedFirst = true;
      result.push(`**${trimmed}**`);
      continue;
    }

    result.push(line);
  }

  return result.join('\n');
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
