/**
 * Engagement Classifier
 * Fast, lightweight classification for high-volume social media processing
 */

import { 
  IntentType, 
  SentimentLabel, 
  ClassificationResult,
  classifyInteraction,
  SocialPlatform 
} from './social-ai-service.ts';
import { getBenefitsKeywords } from './benefits-catalog.ts';

// ============= Quick Classification (No AI) =============

interface QuickClassifyResult {
  intent: IntentType;
  confidence: number;
  useAI: boolean;
  keywords: string[];
}

const INTENT_KEYWORDS: Record<IntentType, string[]> = {
  job_inquiry: [
    'hiring', 'job', 'position', 'opening', 'apply', 'application', 
    'looking for work', 'need a job', 'driver job', 'cdl job',
    'are you hiring', 'how do i apply', 'job openings', 'positions available',
  ],
  application_status: [
    'application status', 'my application', 'applied last', 'applied yesterday',
    'when will i hear', 'any update', 'check status', 'submitted application',
    'heard back', 'interview scheduled',
  ],
  salary_question: [
    'pay', 'salary', 'wage', 'how much', 'compensation', 'per mile',
    'cpm', 'cents per mile', 'weekly pay', 'bonus', 'sign on',
  ],
  benefits_question: [
    'benefits', 'insurance', 'health', '401k', 'retirement', 'pto',
    'vacation', 'medical', 'dental', 'vision', 'home time',
  ],
  support: [
    'help', 'issue', 'problem', 'can\'t', 'unable', 'error',
    'contact', 'speak to', 'talk to', 'need assistance',
  ],
  complaint: [
    'terrible', 'worst', 'horrible', 'never', 'hate', 'angry',
    'frustrated', 'disappointed', 'unprofessional', 'scam',
  ],
  spam: [
    'click here', 'free', 'winner', 'prize', 'bitcoin', 'crypto',
    'make money fast', 'work from home', 'mlm', 'limited time',
  ],
  general: [],
};

const SENTIMENT_INDICATORS = {
  positive: [
    'thanks', 'thank you', 'great', 'awesome', 'love', 'excited',
    'interested', 'perfect', 'wonderful', 'amazing', '👍', '❤️', '😊',
  ],
  negative: [
    'bad', 'terrible', 'hate', 'angry', 'frustrated', 'disappointed',
    'worst', 'horrible', 'never', 'waste', '👎', '😡', '😤',
  ],
};

export function quickClassify(content: string): QuickClassifyResult {
  const lowerContent = content.toLowerCase();
  const words = lowerContent.split(/\s+/);
  
  let bestIntent: IntentType = 'general';
  let bestScore = 0;
  let matchedKeywords: string[] = [];
  
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    const matches = keywords.filter(kw => lowerContent.includes(kw));
    const score = matches.length;
    
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent as IntentType;
      matchedKeywords = matches;
    }
  }
  
  // Determine if AI classification is needed
  const useAI = bestScore < 2 || bestIntent === 'general';
  const confidence = Math.min(0.9, 0.5 + (bestScore * 0.1));
  
  return {
    intent: bestIntent,
    confidence,
    useAI,
    keywords: matchedKeywords,
  };
}

export function quickSentiment(content: string): {
  sentiment: SentimentLabel;
  score: number;
} {
  const lowerContent = content.toLowerCase();
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  for (const word of SENTIMENT_INDICATORS.positive) {
    if (lowerContent.includes(word)) positiveCount++;
  }
  
  for (const word of SENTIMENT_INDICATORS.negative) {
    if (lowerContent.includes(word)) negativeCount++;
  }
  
  if (positiveCount > negativeCount) {
    return { sentiment: 'positive', score: Math.min(1, positiveCount * 0.2) };
  } else if (negativeCount > positiveCount) {
    return { sentiment: 'negative', score: Math.max(-1, -negativeCount * 0.2) };
  }
  
  return { sentiment: 'neutral', score: 0 };
}

// ============= Hybrid Classification =============

export async function hybridClassify(
  content: string,
  platform: SocialPlatform,
  options?: {
    forceAI?: boolean;
    context?: {
      postContent?: string;
      previousMessages?: string[];
    };
  }
): Promise<ClassificationResult> {
  // Quick classification first
  const quick = quickClassify(content);
  const quickSent = quickSentiment(content);
  
  // Use AI if quick classification is uncertain or forced
  if (options?.forceAI || quick.useAI) {
    return classifyInteraction(content, platform, options?.context);
  }
  
  // Return quick classification for high-confidence cases
  const suggestedAction = determineSuggestedAction(quick.intent, quickSent.sentiment, quick.confidence);
  
  return {
    intent: quick.intent,
    confidence: quick.confidence,
    sentiment: quickSent.sentiment,
    sentimentScore: quickSent.score,
    isJobRelated: ['job_inquiry', 'salary_question', 'benefits_question', 'application_status'].includes(quick.intent),
    requiresHumanReview: quickSent.sentiment === 'negative' || quick.intent === 'complaint',
    reviewReason: quick.intent === 'complaint' ? 'Potential complaint detected' : undefined,
    suggestedAction,
    extractedEntities: extractEntities(content),
  };
}

function determineSuggestedAction(
  intent: IntentType,
  sentiment: SentimentLabel,
  confidence: number
): 'auto_respond' | 'queue_review' | 'ignore' {
  // Always ignore spam
  if (intent === 'spam') return 'ignore';
  
  // Always review complaints and negative sentiment
  if (intent === 'complaint' || sentiment === 'negative') return 'queue_review';
  
  // Auto-respond to job inquiries and simple questions with high confidence
  if (confidence >= 0.7 && ['job_inquiry', 'salary_question', 'benefits_question'].includes(intent)) {
    return 'auto_respond';
  }
  
  // Queue review for support and application status (need human touch)
  if (['support', 'application_status'].includes(intent)) return 'queue_review';
  
  // Default to review for safety
  return 'queue_review';
}

function extractEntities(content: string): Record<string, string> {
  const entities: Record<string, string> = {};
  const lowerContent = content.toLowerCase();
  
  // CDL type extraction
  const cdlMatch = lowerContent.match(/cdl[- ]?([abc])/i);
  if (cdlMatch) {
    entities.cdlType = `CDL-${cdlMatch[1].toUpperCase()}`;
  }
  
  // Experience extraction
  const expMatch = content.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)?/i);
  if (expMatch) {
    entities.experienceLevel = `${expMatch[1]}+ years`;
  }
  
  // Location extraction (simple state abbreviations)
  const stateMatch = content.match(/\b([A-Z]{2})\b/);
  if (stateMatch) {
    const states = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
    if (states.includes(stateMatch[1])) {
      entities.location = stateMatch[1];
    }
  }
  
  // Job type extraction
  if (lowerContent.includes('otr') || lowerContent.includes('over the road')) {
    entities.jobTitle = 'OTR Driver';
  } else if (lowerContent.includes('local')) {
    entities.jobTitle = 'Local Driver';
  } else if (lowerContent.includes('regional')) {
    entities.jobTitle = 'Regional Driver';
  }
  
  // Urgency detection
  if (lowerContent.includes('asap') || lowerContent.includes('urgent') || lowerContent.includes('immediately')) {
    entities.urgency = 'high';
  } else if (lowerContent.includes('soon') || lowerContent.includes('this week')) {
    entities.urgency = 'medium';
  }
  
  return entities;
}

// ============= Batch Classification =============

export async function batchClassify(
  interactions: Array<{ id: string; content: string; platform: SocialPlatform }>,
  options?: { maxConcurrent?: number }
): Promise<Map<string, ClassificationResult>> {
  const results = new Map<string, ClassificationResult>();
  const maxConcurrent = options?.maxConcurrent || 5;
  
  // Process in batches
  for (let i = 0; i < interactions.length; i += maxConcurrent) {
    const batch = interactions.slice(i, i + maxConcurrent);
    
    const batchResults = await Promise.all(
      batch.map(async ({ id, content, platform }) => {
        const result = await hybridClassify(content, platform);
        return { id, result };
      })
    );
    
    for (const { id, result } of batchResults) {
      results.set(id, result);
    }
  }
  
  return results;
}
