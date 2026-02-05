 import { supabase } from '@/integrations/supabase/client';
 import { 
   DataQualitySummary, 
   SourceQualityMetrics, 
   FieldCompletionRate,
   DataQualityAlert,
   CRITICAL_FIELDS,
   SOURCE_DISPLAY_NAMES 
 } from '../types/dataQuality';
 import { logger } from '@/lib/logger';
 
 /**
  * Service for fetching data quality metrics
  */
 export class DataQualityService {
   private static readonly QUALITY_THRESHOLDS = {
     critical: 50,
     high: 70,
     medium: 85,
     low: 95,
   };
 
   /**
    * Fetches comprehensive data quality metrics
    */
   static async fetchDataQualitySummary(days: number = 30): Promise<DataQualitySummary> {
     logger.debug('DataQualityService: Fetching data quality summary', { days });
     
     const startDate = new Date();
     startDate.setDate(startDate.getDate() - days);
     const startDateStr = startDate.toISOString();
 
     // Fetch applications with relevant fields
     const { data: applications, error } = await supabase
       .from('applications')
       .select(`
         id, source, created_at,
         first_name, last_name, phone, applicant_email,
         city, state, zip,
         cdl, cdl_class, exp, driving_experience_years,
         veteran, drug, consent
       `)
       .gte('created_at', startDateStr)
       .order('created_at', { ascending: false });
 
     if (error) {
       logger.error('DataQualityService: Error fetching applications', { error });
       throw error;
     }
 
     const apps = applications || [];
     
     // Group by source
     const sourceGroups = this.groupBySource(apps);
     
     // Calculate metrics for each source
     const bySource: SourceQualityMetrics[] = Object.entries(sourceGroups).map(
       ([source, sourceApps]) => this.calculateSourceMetrics(source, sourceApps)
     );
 
     // Sort by total applications descending
     bySource.sort((a, b) => b.totalApplications - a.totalApplications);
 
     // Calculate overall metrics
     const criticalFields = this.calculateOverallFieldCompletion(apps);
     const overallScore = this.calculateOverallScore(criticalFields);
 
     return {
       overallScore,
       totalApplications: apps.length,
       bySource,
       criticalFields,
       recentTrend: 'stable', // Would need historical data to calculate
       lastUpdated: new Date().toISOString(),
     };
   }
 
   /**
    * Generates alerts for fields below thresholds
    */
   static generateAlerts(summary: DataQualitySummary): DataQualityAlert[] {
     const alerts: DataQualityAlert[] = [];
     
     summary.bySource.forEach(source => {
       source.fieldCompletionRates.forEach(field => {
         let severity: DataQualityAlert['severity'] | null = null;
         let threshold = 0;
 
         if (field.completionRate < this.QUALITY_THRESHOLDS.critical) {
           severity = 'critical';
           threshold = this.QUALITY_THRESHOLDS.critical;
         } else if (field.completionRate < this.QUALITY_THRESHOLDS.high) {
           severity = 'high';
           threshold = this.QUALITY_THRESHOLDS.high;
         } else if (field.completionRate < this.QUALITY_THRESHOLDS.medium && 
                    ['contact', 'qualification'].includes(field.category)) {
           severity = 'medium';
           threshold = this.QUALITY_THRESHOLDS.medium;
         }
 
         if (severity && source.totalApplications >= 5) {
           alerts.push({
             id: `${source.source}-${field.fieldName}`,
             severity,
             source: source.displayName,
             field: field.displayName,
             message: `${field.displayName} capture rate is ${field.completionRate.toFixed(0)}% for ${source.displayName}`,
             currentRate: field.completionRate,
             threshold,
             createdAt: new Date().toISOString(),
           });
         }
       });
     });
 
     // Sort by severity
     const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
     alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
 
     return alerts;
   }
 
   private static groupBySource(apps: any[]): Record<string, any[]> {
     const groups: Record<string, any[]> = {};
     
     apps.forEach(app => {
       const source = this.normalizeSource(app.source);
       if (!groups[source]) {
         groups[source] = [];
       }
       groups[source].push(app);
     });
 
     return groups;
   }
 
   private static normalizeSource(source: string | null): string {
     if (!source) return 'Unknown';
     
     const normalized = source.toLowerCase().trim();
     
     if (normalized.includes('elevenlabs') || normalized.includes('voice')) return 'ElevenLabs';
     if (normalized.includes('ziprecruiter')) return 'ZipRecruiter';
     if (normalized.includes('indeed')) return 'Indeed';
     if (normalized.includes('cdl job cast')) return 'CDL Job Cast';
     if (normalized.includes('embed')) return 'Embed Form';
     if (normalized.includes('meta') || normalized.includes('facebook')) return 'Meta';
     if (normalized.includes('quick apply')) return 'Quick Apply';
     if (normalized.includes('direct')) return 'Direct Application';
     
     return source;
   }
 
   private static calculateSourceMetrics(source: string, apps: any[]): SourceQualityMetrics {
     const fieldCompletionRates = CRITICAL_FIELDS.map(field => 
       this.calculateFieldCompletion(field, apps)
     );
 
     const qualityScore = this.calculateOverallScore(fieldCompletionRates);
 
     return {
       source,
       displayName: SOURCE_DISPLAY_NAMES[source] || source,
       totalApplications: apps.length,
       qualityScore,
       fieldCompletionRates,
       trend: 'stable',
       trendPercentage: 0,
     };
   }
 
   private static calculateFieldCompletion(
     field: typeof CRITICAL_FIELDS[number], 
     apps: any[]
   ): FieldCompletionRate {
     const totalRecords = apps.length;
     const populatedRecords = apps.filter(app => {
       const value = app[field.name];
       return value !== null && value !== undefined && value !== '' && value !== 'N/A';
     }).length;
 
     return {
       fieldName: field.name,
       displayName: field.display,
       completionRate: totalRecords > 0 ? (populatedRecords / totalRecords) * 100 : 0,
       totalRecords,
       populatedRecords,
       category: field.category,
     };
   }
 
   private static calculateOverallFieldCompletion(apps: any[]): FieldCompletionRate[] {
     return CRITICAL_FIELDS.map(field => this.calculateFieldCompletion(field, apps));
   }
 
   private static calculateOverallScore(fields: FieldCompletionRate[]): number {
     if (fields.length === 0) return 0;
     
     // Weight critical fields more heavily
     const weights: Record<string, number> = {
       contact: 1.5,
       location: 1.2,
       qualification: 1.3,
       compliance: 1.0,
       screening: 0.8,
     };
 
     let weightedSum = 0;
     let totalWeight = 0;
 
     fields.forEach(field => {
       const weight = weights[field.category] || 1;
       weightedSum += field.completionRate * weight;
       totalWeight += weight;
     });
 
     return totalWeight > 0 ? weightedSum / totalWeight : 0;
   }
 }