 // Data Quality Dashboard Types
 
 export interface FieldCompletionRate {
   fieldName: string;
   displayName: string;
   completionRate: number;
   totalRecords: number;
   populatedRecords: number;
   category: 'contact' | 'location' | 'qualification' | 'compliance' | 'screening';
 }
 
 export interface SourceQualityMetrics {
   source: string;
   displayName: string;
   totalApplications: number;
   qualityScore: number;
   fieldCompletionRates: FieldCompletionRate[];
   trend: 'up' | 'down' | 'stable';
   trendPercentage: number;
 }
 
 export interface DataQualitySummary {
   overallScore: number;
   totalApplications: number;
   bySource: SourceQualityMetrics[];
   criticalFields: FieldCompletionRate[];
   recentTrend: 'improving' | 'declining' | 'stable';
   lastUpdated: string;
 }
 
 export interface DataQualityAlert {
   id: string;
   severity: 'low' | 'medium' | 'high' | 'critical';
   source: string;
   field: string;
   message: string;
   currentRate: number;
   threshold: number;
   createdAt: string;
 }
 
 export const CRITICAL_FIELDS = [
   { name: 'first_name', display: 'First Name', category: 'contact' as const },
   { name: 'last_name', display: 'Last Name', category: 'contact' as const },
   { name: 'phone', display: 'Phone', category: 'contact' as const },
   { name: 'applicant_email', display: 'Email', category: 'contact' as const },
   { name: 'city', display: 'City', category: 'location' as const },
   { name: 'state', display: 'State', category: 'location' as const },
   { name: 'zip', display: 'ZIP Code', category: 'location' as const },
   { name: 'cdl', display: 'Has CDL', category: 'qualification' as const },
   { name: 'cdl_class', display: 'CDL Class', category: 'qualification' as const },
   { name: 'exp', display: 'Experience', category: 'qualification' as const },
   { name: 'driving_experience_years', display: 'Experience (Years)', category: 'qualification' as const },
   { name: 'veteran', display: 'Veteran Status', category: 'compliance' as const },
   { name: 'drug', display: 'Drug Test Consent', category: 'screening' as const },
   { name: 'consent', display: 'Consent Given', category: 'compliance' as const },
 ] as const;
 
 export const SOURCE_DISPLAY_NAMES: Record<string, string> = {
   'Direct Application': 'Direct Application',
   'Quick Apply': 'Quick Apply',
   'ElevenLabs': 'Voice Agent',
   'elevenlabs': 'Voice Agent',
   'voice': 'Voice Agent',
   'ZipRecruiter': 'ZipRecruiter',
   'ziprecruiter': 'ZipRecruiter',
   'Indeed': 'Indeed',
   'indeed': 'Indeed',
   'CDL Job Cast': 'CDL Job Cast',
   'Embed Form': 'Embed Form',
   'embed': 'Embed Form',
   'Meta': 'Meta Ads',
   'meta': 'Meta Ads',
   'Facebook': 'Meta Ads',
 };