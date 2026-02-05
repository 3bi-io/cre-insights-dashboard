 /**
  * Job Schema Extraction Utilities
  * Extracts structured data from job descriptions for enhanced Google Jobs schema
  */
 
 interface ExperienceRequirements {
   minimumMonths?: number;
   preferredMonths?: number;
   description?: string;
 }
 
 interface QualificationsData {
   summary: string | undefined;
   skills: string[];
 }
 
 /**
  * Extract experience requirements from job description
  * Looks for patterns like "2+ years", "3-5 years experience", "minimum 1 year"
  */
 export function extractExperienceFromDescription(description: string | null | undefined): ExperienceRequirements | undefined {
   if (!description) return undefined;
 
   const text = description.toLowerCase();
   
   // Common experience patterns
   const patterns = [
     /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/gi,
     /minimum\s*(?:of\s+)?(\d+)\s*(?:years?|yrs?)/gi,
     /at\s+least\s+(\d+)\s*(?:years?|yrs?)/gi,
     /(\d+)\s*(?:to|-)\s*(\d+)\s*(?:years?|yrs?)/gi,
     /(\d+)\s*months?\s*(?:of\s+)?(?:experience|exp)/gi,
   ];
   
   let minimumMonths: number | undefined;
   let preferredMonths: number | undefined;
   let experienceDescription: string | undefined;
 
   for (const pattern of patterns) {
     const match = pattern.exec(text);
     if (match) {
       if (match[2]) {
         // Range pattern (e.g., "3-5 years")
         minimumMonths = parseInt(match[1]) * 12;
         preferredMonths = parseInt(match[2]) * 12;
       } else if (match[1]) {
         const value = parseInt(match[1]);
         // Check if months or years
         if (pattern.source.includes('months')) {
           minimumMonths = value;
         } else {
           minimumMonths = value * 12;
         }
       }
       
       // Extract context around the match
       const matchIndex = text.indexOf(match[0]);
       const start = Math.max(0, matchIndex - 50);
       const end = Math.min(text.length, matchIndex + match[0].length + 50);
       experienceDescription = description.substring(start, end).trim();
       break;
     }
   }
 
   if (!minimumMonths) return undefined;
 
   return {
     minimumMonths,
     preferredMonths,
     description: experienceDescription,
   };
 }
 
 /**
  * Extract qualifications and skills from job description
  * Looks for requirements sections and common skill keywords
  */
 export function extractQualificationsFromDescription(description: string | null | undefined): QualificationsData {
   if (!description) {
     return { summary: undefined, skills: [] };
   }
 
   const skills: string[] = [];
   let qualificationsSummary: string | undefined;
 
   // Common CDL/trucking skills and requirements
   const cdlSkills = [
     { pattern: /CDL[\s-]?A/gi, skill: 'CDL-A License' },
     { pattern: /CDL[\s-]?B/gi, skill: 'CDL-B License' },
     { pattern: /hazmat/gi, skill: 'Hazmat Endorsement' },
     { pattern: /tanker\s*endorsement/gi, skill: 'Tanker Endorsement' },
     { pattern: /doubles\s*(?:and|\/)\s*triples/gi, skill: 'Doubles/Triples Endorsement' },
     { pattern: /twic\s*card/gi, skill: 'TWIC Card' },
     { pattern: /clean\s*(?:driving\s*)?(?:record|mvr)/gi, skill: 'Clean Driving Record' },
     { pattern: /dot\s*physical/gi, skill: 'DOT Physical' },
     { pattern: /otr/gi, skill: 'OTR Experience' },
     { pattern: /regional\s*(?:driving|routes)/gi, skill: 'Regional Driving' },
     { pattern: /local\s*(?:driving|routes)/gi, skill: 'Local Driving' },
     { pattern: /flatbed/gi, skill: 'Flatbed Experience' },
     { pattern: /reefer/gi, skill: 'Reefer/Refrigerated Experience' },
     { pattern: /dry\s*van/gi, skill: 'Dry Van Experience' },
     { pattern: /team\s*driv/gi, skill: 'Team Driving' },
     { pattern: /no\s*(?:felonies|felony)/gi, skill: 'No Felony Record' },
     { pattern: /pass\s*(?:drug|background)/gi, skill: 'Background Check' },
   ];
 
   // General professional skills
   const generalSkills = [
     { pattern: /communication\s*skills/gi, skill: 'Communication Skills' },
     { pattern: /customer\s*service/gi, skill: 'Customer Service' },
     { pattern: /time\s*management/gi, skill: 'Time Management' },
     { pattern: /safety\s*(?:focused|conscious)/gi, skill: 'Safety Conscious' },
     { pattern: /mechanical\s*(?:knowledge|aptitude)/gi, skill: 'Mechanical Knowledge' },
   ];
 
   const allSkillPatterns = [...cdlSkills, ...generalSkills];
 
   for (const { pattern, skill } of allSkillPatterns) {
     if (pattern.test(description)) {
       if (!skills.includes(skill)) {
         skills.push(skill);
       }
     }
   }
 
   // Try to extract a qualifications section
   const qualificationPatterns = [
     /(?:requirements?|qualifications?):?\s*([\s\S]*?)(?:\n\n|\z|benefits?:|what we offer)/gi,
     /(?:what you.?ll need|you must have):?\s*([\s\S]*?)(?:\n\n|\z|benefits?:)/gi,
   ];
 
   for (const pattern of qualificationPatterns) {
     const match = pattern.exec(description);
     if (match && match[1]) {
       // Clean up and truncate
       const raw = match[1].trim();
       qualificationsSummary = raw.length > 500 ? raw.substring(0, 497) + '...' : raw;
       break;
     }
   }
 
   return {
     summary: qualificationsSummary,
     skills: skills.slice(0, 10), // Limit to 10 skills
   };
 }