/**
 * AspenView Description Transformer
 * Converts bullet-point job descriptions to narrative format,
 * adds ONET skills, gender-normalizes language, and appends legal disclosures.
 * Only applied to AspenView Technology Partners jobs.
 */

const ASPENVIEW_CLIENT_ID = '82513316-7df2-4bf0-83d8-6c511c83ddfb';

/**
 * Check if a job belongs to AspenView
 */
export function isAspenViewJob(clientId: string | null | undefined): boolean {
  return clientId === ASPENVIEW_CLIENT_ID;
}

/**
 * Gender-normalize text: replace gendered pronouns with inclusive alternatives
 */
function genderNormalize(text: string): string {
  return text
    // Pronoun replacements (case-sensitive patterns)
    .replace(/\bhe or she\b/gi, 'they')
    .replace(/\bhe\/she\b/gi, 'they')
    .replace(/\bshe\/he\b/gi, 'they')
    .replace(/\bhis or her\b/gi, 'their')
    .replace(/\bhis\/her\b/gi, 'their')
    .replace(/\bher\/his\b/gi, 'their')
    .replace(/\bhim or her\b/gi, 'them')
    .replace(/\bhim\/her\b/gi, 'them')
    .replace(/\bhimself or herself\b/gi, 'themselves')
    .replace(/\bherself or himself\b/gi, 'themselves')
    // Gendered nouns
    .replace(/\bchairman\b/gi, 'chairperson')
    .replace(/\bforeman\b/gi, 'foreperson')
    .replace(/\bmanpower\b/gi, 'workforce')
    .replace(/\bworkmanship\b/gi, 'craftsmanship')
    .replace(/\bsalesman\b/gi, 'salesperson')
    .replace(/\bsalesmen\b/gi, 'salespeople')
    .replace(/\bbusinessman\b/gi, 'business professional')
    .replace(/\bbusinessmen\b/gi, 'business professionals')
    .replace(/\bmanmade\b/gi, 'manufactured')
    .replace(/\bman-made\b/gi, 'manufactured')
    .replace(/\bfreshman\b/gi, 'first-year')
    // Standalone gendered pronouns (careful with context)
    .replace(/\bHe\b(?=\s+(?:will|shall|should|must|is|has|may|can|would|could))/g, 'They')
    .replace(/\bShe\b(?=\s+(?:will|shall|should|must|is|has|may|can|would|could))/g, 'They')
    .replace(/\bhis\b(?=\s+(?:role|position|duties|responsibilities|work|team|manager|supervisor))/gi, 'their')
    .replace(/\bher\b(?=\s+(?:role|position|duties|responsibilities|work|team|manager|supervisor))/gi, 'their');
}

/**
 * Convert bullet-point descriptions into flowing narrative paragraphs.
 * Groups related bullets by section headers and merges them into prose.
 */
function bulletsToNarrative(text: string): string {
  const lines = text.split('\n');
  const sections: { header: string | null; items: string[] }[] = [];
  let currentSection: { header: string | null; items: string[] } = { header: null, items: [] };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for headers (markdown or plain text followed by colon)
    const headerMatch = trimmed.match(/^#{1,6}\s+(.+)/) || trimmed.match(/^([A-Z][^.!?]*):$/);
    if (headerMatch) {
      if (currentSection.items.length > 0 || currentSection.header) {
        sections.push(currentSection);
      }
      currentSection = { header: headerMatch[1].replace(/:$/, '').trim(), items: [] };
      continue;
    }

    // Strip bullet prefixes
    const bulletMatch = trimmed.match(/^[-*+•]\s*(.*)/);
    const numberedMatch = trimmed.match(/^\d+[.)]\s*(.*)/);
    const content = bulletMatch?.[1] || numberedMatch?.[1] || trimmed;

    if (content) {
      currentSection.items.push(content.replace(/\.$/, '').trim());
    }
  }

  if (currentSection.items.length > 0 || currentSection.header) {
    sections.push(currentSection);
  }

  // Build narrative paragraphs
  const paragraphs: string[] = [];

  for (const section of sections) {
    if (section.items.length === 0) continue;

    let paragraph: string;

    if (section.items.length === 1) {
      paragraph = section.items[0] + '.';
    } else if (section.items.length <= 3) {
      paragraph = section.items.join(', ') + '.';
    } else {
      // Join with natural connectors
      const allButLast = section.items.slice(0, -1).join(', ');
      paragraph = allButLast + ', and ' + section.items[section.items.length - 1] + '.';
    }

    // Capitalize first letter
    paragraph = paragraph.charAt(0).toUpperCase() + paragraph.slice(1);

    if (section.header) {
      paragraphs.push(`**${section.header}**\n\n${paragraph}`);
    } else {
      paragraphs.push(paragraph);
    }
  }

  return paragraphs.join('\n\n');
}

/**
 * ONET-based skills and knowledge mapping by job title keywords.
 * Each entry produces a paragraph under 300 characters referencing ONET.
 */
const ONET_SKILL_MAP: Array<{ keywords: RegExp; paragraph: string }> = [
  {
    keywords: /software\s*(engineer|developer)|full[\s-]?stack|front[\s-]?end|back[\s-]?end|web\s*developer/i,
    paragraph: 'Per O*NET, this role draws on programming, systems analysis, complex problem solving, and critical thinking. Key knowledge areas include computers and electronics, engineering, mathematics, and design principles.',
  },
  {
    keywords: /data\s*(scientist|analyst|engineer)/i,
    paragraph: 'Per O*NET, this role leverages analytical thinking, mathematics, data processing, and statistical analysis. Key knowledge areas include information technology, applied mathematics, and research methodology.',
  },
  {
    keywords: /devops|site\s*reliability|sre|infrastructure|cloud\s*engineer/i,
    paragraph: 'Per O*NET, this role involves systems evaluation, operations analysis, and complex problem solving. Key knowledge includes network architecture, cloud computing, automation, and system administration.',
  },
  {
    keywords: /project\s*manager|program\s*manager|scrum\s*master/i,
    paragraph: 'Per O*NET, this role requires coordination, time management, active listening, and critical thinking. Key knowledge areas include administration, resource management, and organizational planning.',
  },
  {
    keywords: /product\s*(manager|owner|designer)/i,
    paragraph: 'Per O*NET, this role applies judgment, decision-making, active listening, and persuasion skills. Key knowledge areas include market research, design thinking, and customer experience strategy.',
  },
  {
    keywords: /ux|ui|user\s*experience|user\s*interface|designer/i,
    paragraph: 'Per O*NET, this role involves design thinking, active listening, complex problem solving, and creativity. Key knowledge areas include fine arts, psychology, communications, and media production.',
  },
  {
    keywords: /qa|quality\s*assurance|test\s*(engineer|automation)/i,
    paragraph: 'Per O*NET, this role requires attention to detail, analytical thinking, and quality control analysis. Key knowledge areas include software testing, systems evaluation, and process documentation.',
  },
  {
    keywords: /cybersecurity|security\s*(engineer|analyst)|information\s*security/i,
    paragraph: 'Per O*NET, this role applies systems analysis, critical thinking, and complex problem solving. Key knowledge includes network security, cryptography, risk assessment, and compliance frameworks.',
  },
  {
    keywords: /machine\s*learning|ai\s*engineer|artificial\s*intelligence|ml\s*engineer/i,
    paragraph: 'Per O*NET, this role leverages mathematics, programming, analytical thinking, and research design. Key knowledge areas include algorithms, statistical modeling, and computational learning theory.',
  },
  {
    keywords: /business\s*analyst|systems\s*analyst/i,
    paragraph: 'Per O*NET, this role requires active listening, critical thinking, and systems evaluation. Key knowledge includes business process modeling, requirements analysis, and organizational strategy.',
  },
  {
    keywords: /recruiter|talent\s*acquisition|hr\s*|human\s*resources/i,
    paragraph: 'Per O*NET, this role involves active listening, social perceptiveness, negotiation, and persuasion. Key knowledge areas include personnel management, labor law, and organizational psychology.',
  },
  {
    keywords: /sales|account\s*(executive|manager)|business\s*development/i,
    paragraph: 'Per O*NET, this role requires persuasion, negotiation, active listening, and social perceptiveness. Key knowledge areas include sales strategy, customer relations, and market dynamics.',
  },
  {
    keywords: /marketing|content|seo|digital\s*marketing/i,
    paragraph: 'Per O*NET, this role applies creativity, persuasion, writing, and analytical thinking. Key knowledge areas include communications, media production, market research, and consumer behavior.',
  },
  {
    keywords: /support|help\s*desk|customer\s*success|technical\s*support/i,
    paragraph: 'Per O*NET, this role involves active listening, service orientation, problem solving, and communication. Key knowledge areas include customer service principles, technology, and troubleshooting.',
  },
  {
    keywords: /consultant|advisory|solutions?\s*architect/i,
    paragraph: 'Per O*NET, this role requires critical thinking, complex problem solving, and systems evaluation. Key knowledge areas include enterprise architecture, strategic planning, and technology integration.',
  },
];

/**
 * Get ONET skills paragraph based on job title (< 300 chars)
 */
function getOnetParagraph(title: string): string {
  for (const entry of ONET_SKILL_MAP) {
    if (entry.keywords.test(title)) {
      // Ensure under 300 characters
      return entry.paragraph.length <= 300
        ? entry.paragraph
        : entry.paragraph.substring(0, 297) + '...';
    }
  }
  // Generic fallback
  return 'Per O*NET, this role draws on critical thinking, active listening, complex problem solving, and effective communication. Key knowledge areas include technology applications, organizational management, and professional practices.';
}

/**
 * Build location-specific wage transparency disclosure
 */
function getWageTransparencyNote(state: string | null | undefined, city: string | null | undefined): string | null {
  const s = state?.toLowerCase().trim();
  const c = city?.toLowerCase().trim();

  // States with pay transparency laws
  const transparencyStates: Record<string, string> = {
    'california': 'California Pay Transparency Act (SB 1162)',
    'ca': 'California Pay Transparency Act (SB 1162)',
    'colorado': 'Colorado Equal Pay for Equal Work Act',
    'co': 'Colorado Equal Pay for Equal Work Act',
    'washington': 'Washington Equal Pay and Opportunities Act',
    'wa': 'Washington Equal Pay and Opportunities Act',
    'new york': 'New York Pay Transparency Law',
    'ny': 'New York Pay Transparency Law',
    'connecticut': 'Connecticut Pay Equity Law',
    'ct': 'Connecticut Pay Equity Law',
    'maryland': 'Maryland Equal Pay for Equal Work Law',
    'md': 'Maryland Equal Pay for Equal Work Law',
    'nevada': 'Nevada Senate Bill 293',
    'nv': 'Nevada Senate Bill 293',
    'rhode island': 'Rhode Island Pay Equity Act',
    'ri': 'Rhode Island Pay Equity Act',
    'illinois': 'Illinois Equal Pay Act',
    'il': 'Illinois Equal Pay Act',
    'hawaii': 'Hawaii Pay Transparency Law',
    'hi': 'Hawaii Pay Transparency Law',
    'minnesota': 'Minnesota Pay Transparency Law',
    'mn': 'Minnesota Pay Transparency Law',
    'vermont': 'Vermont Pay Transparency Law',
    'vt': 'Vermont Pay Transparency Law',
    'massachusetts': 'Massachusetts Pay Transparency Law',
    'ma': 'Massachusetts Pay Transparency Law',
  };

  // City-specific laws
  if (c?.includes('new york') || c?.includes('nyc')) {
    return 'In accordance with the New York City Pay Transparency Law, salary ranges are provided for this position. Applicants have the right to inquire about compensation before or after accepting an offer.';
  }
  if (c?.includes('jersey city')) {
    return 'In accordance with Jersey City Pay Transparency Ordinance, salary information is disclosed for this position.';
  }
  if (c?.includes('cincinnati')) {
    return 'In accordance with Cincinnati Pay Equity Ordinance, salary ranges are provided for this position.';
  }
  if (c?.includes('toledo')) {
    return 'In accordance with Toledo Pay Equity Ordinance, salary ranges are provided for this position.';
  }

  if (s && transparencyStates[s]) {
    return `In accordance with the ${transparencyStates[s]}, salary ranges are provided for this position where applicable. Applicants have the right to inquire about compensation.`;
  }

  return null;
}

/**
 * Build the full disclosures section
 */
function buildDisclosures(
  state: string | null | undefined,
  city: string | null | undefined,
): string {
  const disclosures: string[] = [];

  // Equal Opportunity Employment
  disclosures.push(
    '**Equal Opportunity Employer**\n\nAspenView Technology Partners is an Equal Opportunity Employer. All qualified applicants will receive consideration for employment without regard to race, color, religion, sex, sexual orientation, gender identity, national origin, disability, veteran status, or any other characteristic protected by applicable law.'
  );

  // Wage transparency (location-based)
  const wageNote = getWageTransparencyNote(state, city);
  if (wageNote) {
    disclosures.push(`**Wage Transparency Notice**\n\n${wageNote}`);
  }

  // AI Assessment disclosure (Voice Apply only)
  disclosures.push(
    '**AI-Assisted Assessment Disclosure**\n\nIf you choose to use the "Apply with Voice" feature, your voice transcript will be assessed using artificial intelligence. This assessment evaluates only whether your responses align with the intake criteria and messaging provided by the hiring organization — it does not evaluate information beyond what is described in this job posting. Use of the Voice Apply feature is entirely optional and is not required to be considered for this position.'
  );

  return '\n\n---\n\n' + disclosures.join('\n\n');
}

/**
 * Main transformer: applies all AspenView-specific transformations to a job description.
 * Only call this for AspenView jobs (check with isAspenViewJob first).
 */
export function transformAspenViewDescription(
  description: string,
  title: string,
  state?: string | null,
  city?: string | null,
): string {
  if (!description) return '';

  // Step 1: Convert bullets to narrative
  let transformed = bulletsToNarrative(description);

  // Step 2: Gender-normalize
  transformed = genderNormalize(transformed);

  // Step 3: Add ONET skills paragraph
  const onetParagraph = getOnetParagraph(title);
  transformed += `\n\n**Skills & Knowledge (O*NET Reference)**\n\n${onetParagraph}`;

  // Step 4: Add disclosures
  transformed += buildDisclosures(state, city);

  return transformed;
}
