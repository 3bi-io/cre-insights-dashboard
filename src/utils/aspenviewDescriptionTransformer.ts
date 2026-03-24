/**
 * AspenView Description Transformer
 * Converts bullet-point job descriptions into structured narrative sections:
 *   1. Overview (~100 words)
 *   2. Duties & Responsibilities (natural paragraphs)
 *   3. About the Company
 *   4. Compensation & Benefits
 *   5. Match Taxonomies and Skills (O*NET)
 *   6. Legal Disclosures (EEO, wage transparency, AI assessment)
 *
 * Also applies gender-neutral language normalization.
 * Only applied to AspenView Technology Partners jobs.
 */

const ASPENVIEW_CLIENT_ID = '82513316-7df2-4bf0-83d8-6c511c83ddfb';

export function isAspenViewJob(clientId: string | null | undefined): boolean {
  return clientId === ASPENVIEW_CLIENT_ID;
}

// ============= Gender Normalization =============

function genderNormalize(text: string): string {
  return text
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
    .replace(/\bHe\b(?=\s+(?:will|shall|should|must|is|has|may|can|would|could))/g, 'They')
    .replace(/\bShe\b(?=\s+(?:will|shall|should|must|is|has|may|can|would|could))/g, 'They')
    .replace(/\bhis\b(?=\s+(?:role|position|duties|responsibilities|work|team|manager|supervisor))/gi, 'their')
    .replace(/\bher\b(?=\s+(?:role|position|duties|responsibilities|work|team|manager|supervisor))/gi, 'their');
}

// ============= Content Parsing =============

interface ParsedSection {
  header: string | null;
  items: string[];
}

/** Keywords that indicate compensation/benefits sections */
const COMP_KEYWORDS = /compens|salary|pay|wage|benefit|insurance|401|retirement|pto|paid\s*time|bonus|stipend|perks|health\s*plan/i;
/** Keywords that indicate company/about sections */
const COMPANY_KEYWORDS = /about\s*(the\s*)?(company|us|org)|who\s*we\s*are|our\s*(mission|culture|values|story|team)|company\s*(overview|description|profile)/i;
/** Keywords that indicate qualifications/requirements */
const QUAL_KEYWORDS = /qualif|require|must\s*have|minimum|prefer|experience|education|skill|certif/i;
/** Keywords that indicate duties/responsibilities */
const DUTY_KEYWORDS = /dut|responsibilit|what\s*you|you\s*will|key\s*(tasks|functions|activities)|scope|essential\s*functions|day[\s-]to[\s-]day/i;

function parseIntoSections(text: string): ParsedSection[] {
  const lines = text.split('\n');
  const sections: ParsedSection[] = [];
  let current: ParsedSection = { header: null, items: [] };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect headers
    const mdHeader = trimmed.match(/^#{1,6}\s+(.+)/);
    const colonHeader = trimmed.match(/^([A-Z][^.!?]{2,60}):$/);
    const boldHeader = trimmed.match(/^\*\*([^*]+)\*\*:?\s*$/);

    if (mdHeader || colonHeader || boldHeader) {
      if (current.items.length > 0 || current.header) sections.push(current);
      const headerText = (mdHeader?.[1] || colonHeader?.[1] || boldHeader?.[1]).replace(/:$/, '').trim();
      current = { header: headerText, items: [] };
      continue;
    }

    // Strip bullet prefixes
    const bulletMatch = trimmed.match(/^[-*+•]\s*(.*)/);
    const numberedMatch = trimmed.match(/^\d+[.)]\s*(.*)/);
    const content = bulletMatch?.[1] || numberedMatch?.[1] || trimmed;

    if (content) {
      // Ensure sentence ends with period
      const cleaned = content.trim().replace(/[.;,]$/, '').trim();
      if (cleaned.length > 0) current.items.push(cleaned);
    }
  }

  if (current.items.length > 0 || current.header) sections.push(current);
  return sections;
}

// ============= Section Classification =============

interface ClassifiedContent {
  duties: string[];
  qualifications: string[];
  compensation: string[];
  company: string[];
  other: string[];
}

function classifySections(sections: ParsedSection[]): ClassifiedContent {
  const result: ClassifiedContent = {
    duties: [],
    qualifications: [],
    compensation: [],
    company: [],
    other: [],
  };

  for (const section of sections) {
    const header = section.header || '';
    const bucket =
      COMP_KEYWORDS.test(header) ? 'compensation' :
      COMPANY_KEYWORDS.test(header) ? 'company' :
      QUAL_KEYWORDS.test(header) ? 'qualifications' :
      DUTY_KEYWORDS.test(header) ? 'duties' :
      null;

    if (bucket) {
      result[bucket].push(...section.items);
    } else {
      // Try to classify by content if no header matched
      for (const item of section.items) {
        if (COMP_KEYWORDS.test(item)) result.compensation.push(item);
        else if (COMPANY_KEYWORDS.test(item)) result.company.push(item);
        else result.duties.push(item);
      }
    }
  }

  return result;
}

// ============= Narrative Builders =============

/**
 * Groups items into natural paragraphs of 3-4 sentences each.
 */
function itemsToParagraphs(items: string[], sentencesPerParagraph = 3): string {
  if (items.length === 0) return '';

  const paragraphs: string[] = [];
  for (let i = 0; i < items.length; i += sentencesPerParagraph) {
    const chunk = items.slice(i, i + sentencesPerParagraph);
    const sentences = chunk.map(s => {
      let sentence = s.charAt(0).toUpperCase() + s.slice(1);
      if (!/[.!?]$/.test(sentence)) sentence += '.';
      return sentence;
    });
    paragraphs.push(sentences.join(' '));
  }
  return paragraphs.join('\n\n');
}

/**
 * Builds a ~100-word overview from the title and first few duty items.
 */
function buildOverview(title: string, duties: string[], qualifications: string[]): string {
  const role = title || 'this role';

  // Take first 2-3 duties for the summary
  const topDuties = duties.slice(0, 3).map(d => d.toLowerCase().replace(/\.$/, ''));
  const qualSnippet = qualifications.length > 0
    ? qualifications[0].toLowerCase().replace(/\.$/, '')
    : null;

  let overview = `The ${role} at AspenView Technology Partners is a dynamic opportunity for a professional `;
  if (qualSnippet) {
    overview += `with ${qualSnippet}. `;
  } else {
    overview += `looking to make an impact in a collaborative environment. `;
  }

  if (topDuties.length > 0) {
    overview += `In this position, the successful candidate will focus on ${topDuties[0]}`;
    if (topDuties.length > 1) overview += `, ${topDuties[1]}`;
    if (topDuties.length > 2) overview += `, and ${topDuties[2]}`;
    overview += '. ';
  }

  overview += 'This role offers the opportunity to contribute meaningfully to the organization while growing professionally within a supportive team.';

  return overview;
}

/**
 * Builds a company section if content exists, or uses a default.
 */
function buildCompanySection(items: string[]): string {
  if (items.length > 0) {
    return itemsToParagraphs(items);
  }
  return 'AspenView Technology Partners is a forward-thinking organization committed to innovation, collaboration, and professional growth. The company fosters an inclusive culture where team members are empowered to contribute their unique perspectives and advance their careers. With a focus on delivering high-quality solutions and maintaining strong client relationships, AspenView provides a supportive environment where employees can thrive.';
}

/**
 * Builds compensation section from extracted items or default.
 */
function buildCompensationSection(items: string[]): string {
  if (items.length > 0) {
    return itemsToParagraphs(items);
  }
  return 'AspenView Technology Partners offers a competitive compensation package commensurate with experience and qualifications. Benefits may include health, dental, and vision insurance, retirement savings options, paid time off, and professional development opportunities. Specific details regarding compensation and benefits will be discussed during the interview process.';
}

// ============= O*NET Skills (renamed to Match Taxonomies) =============

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

function getOnetParagraph(title: string): string {
  for (const entry of ONET_SKILL_MAP) {
    if (entry.keywords.test(title)) {
      return entry.paragraph.length <= 300 ? entry.paragraph : entry.paragraph.substring(0, 297) + '...';
    }
  }
  return 'Per O*NET, this role draws on critical thinking, active listening, complex problem solving, and effective communication. Key knowledge areas include technology applications, organizational management, and professional practices.';
}

// ============= Legal Disclosures =============

function getWageTransparencyNote(state: string | null | undefined, city: string | null | undefined): string | null {
  const s = state?.toLowerCase().trim();
  const c = city?.toLowerCase().trim();

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

function buildDisclosures(state: string | null | undefined, city: string | null | undefined): string {
  const parts: string[] = [];

  parts.push(
    '**Equal Opportunity Employer**\n\nAspenView Technology Partners is an Equal Opportunity Employer. All qualified applicants will receive consideration for employment without regard to race, color, religion, sex, sexual orientation, gender identity, national origin, disability, veteran status, or any other characteristic protected by applicable law.'
  );

  const wageNote = getWageTransparencyNote(state, city);
  if (wageNote) {
    parts.push(`**Wage Transparency Notice**\n\n${wageNote}`);
  }

  parts.push(
    '**AI-Assisted Assessment Disclosure**\n\nIf you choose to use the "Apply with Voice" feature, your voice transcript will be assessed using artificial intelligence. This assessment evaluates only whether your responses align with the intake criteria and messaging provided by the hiring organization — it does not evaluate information beyond what is described in this job posting. Use of the Voice Apply feature is entirely optional and is not required to be considered for this position.'
  );

  return parts.join('\n\n');
}

// ============= Main Transformer =============

export function transformAspenViewDescription(
  description: string,
  title: string,
  state?: string | null,
  city?: string | null,
): string {
  if (!description) return '';

  // Parse raw description into sections
  const sections = parseIntoSections(description);
  const classified = classifySections(sections);

  // Merge qualifications into duties for the narrative (they often overlap)
  const allDuties = [...classified.duties, ...classified.qualifications];

  // Build structured output
  const output: string[] = [];

  // Section 1: Overview (~100 words)
  output.push(`## Overview\n\n${genderNormalize(buildOverview(title, classified.duties, classified.qualifications))}`);

  // Section 2: Duties & Responsibilities (natural paragraphs with breaks)
  if (allDuties.length > 0) {
    output.push(`## Duties & Responsibilities\n\n${genderNormalize(itemsToParagraphs(allDuties, 3))}`);
  }

  // Section 3: About the Company
  output.push(`## About AspenView Technology Partners\n\n${genderNormalize(buildCompanySection(classified.company))}`);

  // Section 4: Compensation & Benefits
  output.push(`## Compensation & Benefits\n\n${genderNormalize(buildCompensationSection(classified.compensation))}`);

  // Section 5: Match Taxonomies and Skills (O*NET)
  const onetParagraph = getOnetParagraph(title);
  output.push(`## Match Taxonomies and Skills\n\n${onetParagraph}`);

  // Section 6: Disclosures
  output.push(`---\n\n${buildDisclosures(state, city)}`);

  return output.join('\n\n');
}
