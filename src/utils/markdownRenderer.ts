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
    /^```/.test(trimmed)
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
 * Bolds the first bullet point's text to highlight the top-line summary.
 * Does not add a "Summary" header (components handle that separately).
 */
function boldFirstBullet(text: string): string {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    // If it's a bullet, bold just the text after the prefix
    const bulletMatch = trimmed.match(/^([-*+]\s)(.*)/);
    if (bulletMatch) {
      lines[i] = `${bulletMatch[1]}**${bulletMatch[2]}**`;
      break;
    }
    // If it's a header, skip — already bold
    if (/^#{1,6}\s/.test(trimmed)) break;
    // Plain text first line — bold it
    lines[i] = `**${trimmed}**`;
    break;
  }
  return lines.join('\n');
}

/**
 * Ensures markdown headers (###) that appear inline mid-text get their own lines,
 * so the markdown parser can detect and render them properly.
 */
function normalizeInlineHeaders(text: string): string {
  // Insert a newline before any #{1,6} that isn't already at start of line
  return text.replace(/([^\n])(\s*#{1,6}\s)/g, '$1\n\n$2');
}

/**
 * Renders content as HTML, automatically detecting markdown vs HTML input.
 * Converts sentence-dense paragraphs to bullet lists, then sanitizes with DOMPurify.
 */
export function renderJobDescription(text: string, skipBulletConversion = false): string {
  if (!text) return '';

  // Pre-process: ensure inline markdown headers get their own lines
  let processed = normalizeInlineHeaders(text);

  if (!skipBulletConversion) {
    // Pre-process: convert sentence-packed paragraphs to bullet lists first
    processed = convertSentencesToBullets(processed);

    // Then bold the first bullet/line as top-line summary
    processed = boldFirstBullet(processed);
  }

  let html: string;
  if (looksLikeMarkdown(processed)) {
    html = marked.parse(processed, { async: false }) as string;
  } else {
    html = processed;
  }

  return DOMPurify.sanitize(html);
}
