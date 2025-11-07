/**
 * XML Utility Functions
 * Provides standardized XML generation, escaping, and structure building
 */

/**
 * Escape XML special characters
 */
export function escapeXml(unsafe: string | null | undefined): string {
  if (unsafe === null || unsafe === undefined) return '';
  
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Wrap content in CDATA section
 */
export function wrapCDATA(content: string | null | undefined): string {
  if (!content) return '';
  return `<![CDATA[${content}]]>`;
}

/**
 * Create XML element with content
 */
export function xmlElement(
  tag: string, 
  content: string | number | null | undefined, 
  useCDATA = false
): string {
  if (content === null || content === undefined || content === '') {
    return `<${tag}/>`;
  }
  
  const safeContent = useCDATA 
    ? wrapCDATA(String(content))
    : escapeXml(String(content));
  
  return `<${tag}>${safeContent}</${tag}>`;
}

/**
 * Create XML element with attributes
 */
export function xmlElementWithAttrs(
  tag: string,
  attrs: Record<string, string | number>,
  content?: string,
  useCDATA = false
): string {
  const attrString = Object.entries(attrs)
    .map(([key, value]) => `${key}="${escapeXml(String(value))}"`)
    .join(' ');
  
  if (!content) {
    return `<${tag} ${attrString}/>`;
  }
  
  const safeContent = useCDATA 
    ? wrapCDATA(content)
    : escapeXml(content);
  
  return `<${tag} ${attrString}>${safeContent}</${tag}>`;
}

/**
 * Generate XML declaration
 */
export function xmlDeclaration(version = '1.0', encoding = 'UTF-8'): string {
  return `<?xml version="${version}" encoding="${encoding}"?>`;
}

/**
 * Build RSS channel header
 */
export function buildRssChannel(
  title: string,
  link: string,
  description: string,
  additionalElements?: Record<string, string>
): string {
  let channel = `
    ${xmlElement('title', title, true)}
    ${xmlElement('link', link)}
    ${xmlElement('description', description, true)}`;
  
  if (additionalElements) {
    for (const [key, value] of Object.entries(additionalElements)) {
      channel += `\n    ${xmlElement(key, value, true)}`;
    }
  }
  
  return channel;
}

/**
 * Wrap content in RSS structure
 */
export function wrapInRss(channelContent: string, items: string): string {
  return `${xmlDeclaration()}
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
${channelContent}
${items}
  </channel>
</rss>`;
}

/**
 * Build job XML item for RSS feeds
 */
export interface JobXmlOptions {
  title: string;
  link: string;
  description: string;
  guid?: string;
  pubDate?: Date | string;
  customElements?: Record<string, string>;
}

export function buildJobXmlItem(options: JobXmlOptions): string {
  const { title, link, description, guid, pubDate, customElements } = options;
  
  let item = `
    <item>
      ${xmlElement('title', title, true)}
      ${xmlElement('link', link)}
      ${xmlElement('description', description, true)}`;
  
  if (guid) {
    item += `\n      ${xmlElementWithAttrs('guid', { isPermaLink: 'false' }, guid)}`;
  }
  
  if (pubDate) {
    const dateStr = pubDate instanceof Date 
      ? pubDate.toUTCString() 
      : new Date(pubDate).toUTCString();
    item += `\n      ${xmlElement('pubDate', dateStr)}`;
  }
  
  if (customElements) {
    for (const [key, value] of Object.entries(customElements)) {
      item += `\n      ${xmlElement(key, value, true)}`;
    }
  }
  
  item += `\n    </item>`;
  
  return item;
}

/**
 * Parse simple XML to JSON (basic parser for responses)
 */
export function parseXmlToJson(xml: string): Record<string, any> {
  const result: Record<string, any> = {};
  
  // Very basic XML parsing - for production use a proper XML parser
  const tagPattern = /<([^>\s]+)[^>]*>([^<]*)<\/\1>/g;
  let match;
  
  while ((match = tagPattern.exec(xml)) !== null) {
    const [, tag, value] = match;
    result[tag] = value.trim();
  }
  
  return result;
}

/**
 * Validate XML structure
 */
export function isValidXml(xml: string): boolean {
  try {
    // Basic validation - check for matching tags
    const openTags = xml.match(/<([^/\s>]+)[^>]*>/g) || [];
    const closeTags = xml.match(/<\/([^\s>]+)>/g) || [];
    
    return openTags.length >= closeTags.length;
  } catch {
    return false;
  }
}

/**
 * Create XML response with proper headers
 */
export function createXmlResponse(xml: string, status = 200): Response {
  return new Response(xml, {
    status,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
