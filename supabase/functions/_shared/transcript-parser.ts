 /**
  * Transcript Parser Utilities
  * Extracts structured data from ElevenLabs conversation transcripts
  * when data_collection_results is empty or incomplete
  */
 
export interface ExtractedData {
  zip?: string;
  cdl?: string;
  exp?: string;
  over_21?: string;
  drug?: string;
  veteran?: string;
  driver_type?: string;
  consent?: string;
  email?: string;
  phone?: string;
}
 
 /**
  * Extract ZIP code from transcript
  * Matches patterns like "36185", "three six one eight five"
  */
 function extractZip(transcript: string): string | undefined {
   // Look for 5-digit ZIP patterns
   const zipMatch = transcript.match(/(?:zip\s*(?:code)?|postal\s*code)[^0-9]*(\d{5})/i);
   if (zipMatch) return zipMatch[1];
 
   // Look for spoken ZIP (after "zip code" question)
   const spokenZipPattern = /zip\s*code[^\n]*\nCaller:\s*([^\n]+)/i;
   const spokenMatch = transcript.match(spokenZipPattern);
   if (spokenMatch) {
     const spokenZip = parseSpokenNumber(spokenMatch[1].trim());
     if (spokenZip && /^\d{5}$/.test(spokenZip)) {
       return spokenZip;
     }
   }
 
   return undefined;
 }
 
 /**
  * Extract CDL experience months from transcript
  */
 function extractExperience(transcript: string): string | undefined {
   // Look for months of experience patterns
   const expPatterns = [
     /(\d+)\s*months?\s*(?:of\s*)?(?:experience|driving)/i,
     /experience[^0-9]*(\d+)\s*months?/i,
     /how\s*many\s*months[^\n]*\nCaller:\s*(\d+)/i,
   ];
 
   for (const pattern of expPatterns) {
     const match = transcript.match(pattern);
     if (match) return match[1];
   }
 
   // Look for spoken numbers
   const spokenExpPattern = /months\s*(?:of\s*)?(?:experience|driving)[^\n]*\nCaller:\s*([^\n]+)/i;
   const spokenMatch = transcript.match(spokenExpPattern);
   if (spokenMatch) {
     const parsed = parseSpokenNumber(spokenMatch[1].trim());
     if (parsed && /^\d+$/.test(parsed)) {
       return parsed;
     }
   }
 
   return undefined;
 }
 
 /**
  * Extract yes/no answers for CDL, drug test, veteran status
  */
 function extractYesNo(transcript: string, question: string): string | undefined {
   const pattern = new RegExp(
     `${question}[^\\n]*\\nCaller:\\s*(yes|no|yeah|yep|nope|correct|affirmative|negative)`,
     'i'
   );
   const match = transcript.match(pattern);
   if (match) {
     const answer = match[1].toLowerCase();
     if (['yes', 'yeah', 'yep', 'correct', 'affirmative'].includes(answer)) {
       return 'Yes';
     }
     if (['no', 'nope', 'negative'].includes(answer)) {
       return 'No';
     }
   }
   return undefined;
 }
 
 /**
  * Extract driver type preference
  */
 function extractDriverType(transcript: string): string | undefined {
   const patterns = [
     /(?:company|owner.?operator|lease.?purchase|o.?o)\s*driver/i,
     /interested\s*in[^:]*:\s*(company|owner.?operator|lease.?purchase)/i,
   ];
 
   for (const pattern of patterns) {
     const match = transcript.match(pattern);
     if (match) {
       const type = match[1] || match[0];
       if (/company/i.test(type)) return 'Company';
       if (/owner/i.test(type)) return 'Owner-Operator';
       if (/lease/i.test(type)) return 'Lease-Purchase';
     }
   }
 
  return undefined;
}

/**
 * Extract phone number from transcript and normalize spoken digits
 */
function extractPhone(transcript: string): string | undefined {
  // Look for phone number in caller responses after a phone-related question
  const phonePatterns = [
    /(?:phone|number|reach\s*you|contact\s*you|call\s*you)[^\n]*\nCaller:\s*([^\n]+)/i,
    /(?:phone|cell|mobile)\s*(?:number)?[^:]*:\s*([^\n]+)/i,
  ];

  for (const pattern of phonePatterns) {
    const match = transcript.match(pattern);
    if (match) {
      const spoken = match[1].trim();
      
      // If already contains digits, extract them
      const digitsOnly = spoken.replace(/\D/g, '');
      if (digitsOnly.length >= 10) {
        return digitsOnly.slice(-10); // Take last 10 digits
      }
      
      // Try parsing spoken number words
      const parsed = parseSpokenNumber(spoken);
      if (parsed && parsed.length >= 10) {
        return parsed.slice(-10); // Take last 10 digits
      }
    }
  }

  return undefined;
}

/**
 * Extract email from transcript
 */
function extractEmail(transcript: string): string | undefined {
  // Look for email patterns in caller responses
  const emailPattern = /email[^:]*:\s*([^\n]+)/i;
  const match = transcript.match(emailPattern);
  if (match) {
    // Try to reconstruct email from spoken format
    const spoken = match[1].trim();
    // Convert common spoken patterns
    const normalized = spoken
      .toLowerCase()
      .replace(/\s+at\s+/g, '@')
      .replace(/\s+dot\s+/g, '.')
      .replace(/\s+/g, '')
      .replace(/[^\w@.+-]/g, '');
    
    if (normalized.includes('@') && normalized.includes('.')) {
      return normalized;
    }
  }
  return undefined;
}
 
 /**
  * Parse spoken numbers to digits
  * "three six one eight five" -> "36185"
  * "seventy-two" -> "72"
  */
 function parseSpokenNumber(spoken: string): string | undefined {
   // If already numeric, return as-is
   if (/^\d+$/.test(spoken.replace(/[\s-]/g, ''))) {
     return spoken.replace(/[\s-]/g, '');
   }
 
   const wordToDigit: Record<string, string> = {
     'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
     'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
     'oh': '0', 'o': '0',
   };
 
   const tensMap: Record<string, number> = {
     'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
     'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
     'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
     'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
   };
 
   const words = spoken.toLowerCase().replace(/-/g, ' ').split(/\s+/);
   let result = '';
   let i = 0;
 
   while (i < words.length) {
     const word = words[i];
     
     // Check for single digit words
     if (wordToDigit[word]) {
       result += wordToDigit[word];
       i++;
       continue;
     }
 
     // Check for tens
     if (tensMap[word] !== undefined) {
       const tensValue = tensMap[word];
       // Check if next word is a single digit
       if (i + 1 < words.length && wordToDigit[words[i + 1]]) {
         result += String(tensValue + parseInt(wordToDigit[words[i + 1]]));
         i += 2;
       } else {
         result += String(tensValue);
         i++;
       }
       continue;
     }
 
     i++;
   }
 
   return result || undefined;
 }
 
 /**
  * Main extraction function - extracts all available data from transcript
  */
 export function extractFromTranscript(transcript: string): ExtractedData {
   if (!transcript) return {};
 
   const data: ExtractedData = {};
 
   // Extract ZIP code
   data.zip = extractZip(transcript);
 
   // Extract experience
   data.exp = extractExperience(transcript);
 
   // Extract CDL status
   data.cdl = extractYesNo(transcript, 'Class\\s*A\\s*CDL');
 
   // Extract age verification
   data.over_21 = extractYesNo(transcript, '(?:21|twenty.?one)\\s*years\\s*old');
 
   // Extract drug test
   data.drug = extractYesNo(transcript, 'drug\\s*test');
 
   // Extract veteran status
   data.veteran = extractYesNo(transcript, 'military');
 
   // Extract privacy/consent
   data.consent = extractYesNo(transcript, 'privacy\\s*policy');
 
  // Extract driver type
  data.driver_type = extractDriverType(transcript);

  // Extract email
  data.email = extractEmail(transcript);

  // Extract phone
  data.phone = extractPhone(transcript);

  return data;
}