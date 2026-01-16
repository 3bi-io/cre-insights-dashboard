import { ApplicationFormData } from '@/features/applications/types';
import { logger } from '@/lib/logger';

/**
 * Maps Excel columns from CR England Facebook Lead Gen export
 * to clean CSV format for applications import
 */
export interface ExcelRow {
  'output__301909100__First name'?: string;
  'output__301909100__Last name'?: string;
  'output__301909100__Email'?: string;
  'output__301909100__Phone number'?: string;
  'output__316256331__ST'?: string;
  'output__306837197__zip_produced'?: string;
  'output__301909100__What zip code do you prefer to be based out of?'?: string;
  'output__301909100__Do you have a Class A CDL?'?: string;
  'output__306830962__Exp_result'?: string;
  'output__301909100__How many months of Class A driving experience do you have?'?: string;
  'output__301909100__Are you 21 or older?'?: string;
  'output__301909100__Are you able to pass a DOT drug test?'?: string;
  'output__301909100__Are you a Veteran?'?: string;
  'output__301909100__I agree to C.R. England\'s Privacy Policy & Mobile Terms of Service. By providing my phone number, I agree to receive text messages from the business.'?: string;
  'output__301909100__campaign_id'?: string;
  'output__301909100__ad_id'?: string;
  'output__301909100__adset_id'?: string;
  'output__301909100__created_time'?: string;
  [key: string]: any;
}

/**
 * Job matching rules by state for CR England
 */
const stateJobMapping: Record<string, string> = {
  'AZ': 'CDL-A Driver - Arizona',
  'CA': 'CDL-A Driver - California',
  'CO': 'CDL-A Driver - Colorado',
  'FL': 'CDL-A Driver - Florida',
  'GA': 'CDL-A Driver - Georgia',
  'IL': 'CDL-A Driver - Illinois',
  'IN': 'CDL-A Driver - Indiana',
  'KY': 'CDL-A Driver - Kentucky',
  'MI': 'CDL-A Driver - Michigan',
  'MO': 'CDL-A Driver - Missouri',
  'NC': 'CDL-A Driver - North Carolina',
  'NJ': 'CDL-A Driver - New Jersey',
  'NV': 'CDL-A Driver - Nevada',
  'NY': 'CDL-A Driver - New York',
  'OH': 'CDL-A Driver - Ohio',
  'PA': 'CDL-A Driver - Pennsylvania',
  'TN': 'CDL-A Driver - Tennessee',
  'TX': 'CDL-A Driver - Texas',
  'UT': 'CDL-A Driver - Utah',
  'VA': 'CDL-A Driver - Virginia',
  'WA': 'CDL-A Driver - Washington',
};

/**
 * Maps an Excel row to application form data
 */
export function mapExcelRowToApplication(row: ExcelRow): Partial<ApplicationFormData> {
  const state = row['output__316256331__ST'] || '';
  const zip = row['output__306837197__zip_produced'] || row['output__301909100__What zip code do you prefer to be based out of?'] || '';
  
  return {
    first_name: row['output__301909100__First name'] || '',
    last_name: row['output__301909100__Last name'] || '',
    applicant_email: row['output__301909100__Email'] || '',
    phone: row['output__301909100__Phone number'] || '',
    state: state,
    zip: zip,
    cdl: row['output__301909100__Do you have a Class A CDL?'] || '',
    exp: row['output__306830962__Exp_result'] || row['output__301909100__How many months of Class A driving experience do you have?'] || '',
    over_21: row['output__301909100__Are you 21 or older?'] || '',
    drug: row['output__301909100__Are you able to pass a DOT drug test?'] || '',
    veteran: row['output__301909100__Are you a Veteran?'] || '',
    privacy: row['output__301909100__I agree to C.R. England\'s Privacy Policy & Mobile Terms of Service. By providing my phone number, I agree to receive text messages from the business.'] || '',
    campaign_id: row['output__301909100__campaign_id'] || '',
    ad_id: row['output__301909100__ad_id'] || '',
    adset_id: row['output__301909100__adset_id'] || '',
    applied_at: row['output__301909100__created_time'] || new Date().toISOString(),
    source: 'facebook_lead_gen',
    status: 'new',
  };
}

/**
 * Gets suggested job title based on state
 */
export function getSuggestedJob(state: string): string {
  return stateJobMapping[state.toUpperCase()] || 'CDL-A Driver - General';
}

/**
 * Converts application data to CSV row format
 */
export function applicationToCsvRow(app: Partial<ApplicationFormData>): string {
  const fields = [
    app.first_name || '',
    app.last_name || '',
    app.applicant_email || '',
    app.phone || '',
    app.state || '',
    app.zip || '',
    app.cdl || '',
    app.exp || '',
    app.over_21 || '',
    app.drug || '',
    app.veteran || '',
    app.privacy || '',
    app.campaign_id || '',
    app.ad_id || '',
    app.adset_id || '',
    app.applied_at || '',
    app.source || '',
    app.status || '',
  ];
  
  // Escape fields that contain commas or quotes
  return fields.map(field => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }).join(',');
}

/**
 * Gets CSV headers
 */
export function getCsvHeaders(): string {
  return [
    'first_name',
    'last_name',
    'applicant_email',
    'phone',
    'state',
    'zip',
    'cdl',
    'exp',
    'over_21',
    'drug',
    'veteran',
    'privacy',
    'campaign_id',
    'ad_id',
    'adset_id',
    'applied_at',
    'source',
    'status',
  ].join(',');
}

/**
 * Generates CSV from Excel data
 */
export function generateCsvFromExcelData(excelRows: ExcelRow[]): string {
  const csvLines = [getCsvHeaders()];
  
  excelRows.forEach((row, index) => {
    try {
      const application = mapExcelRowToApplication(row);
      
      // Validate required fields
      if (!application.applicant_email || !application.first_name || !application.last_name) {
        logger.warn(`Skipping row ${index + 1}: Missing required fields`);
        return;
      }
      
      csvLines.push(applicationToCsvRow(application));
    } catch (error) {
      logger.error(`Error processing row ${index + 1}`, error);
    }
  });
  
  return csvLines.join('\n');
}
