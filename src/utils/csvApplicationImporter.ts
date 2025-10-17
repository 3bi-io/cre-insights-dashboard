import { ApplicationFormData } from '@/features/applications/types';

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
const JOB_MATCHING_RULES: Record<string, string> = {
  'IL': '65a6cf0c-97ee-4e32-9b16-5a7f5dee9ab9', // Joliet, IL - Dollar Tree Account
  'MO': '07363b73-cfe3-42a8-8a16-8eade56de5e3', // Warrensburg, MO - Dollar Tree Account
  'OR': 'b7b4874a-95d4-4051-86c3-086e4432f2a2', // Ridgefield, OR
  'default': '65a6cf0c-97ee-4e32-9b16-5a7f5dee9ab9' // Default to Dollar Tree Account for unmatched states
};

/**
 * Maps Excel row to ApplicationFormData structure
 */
export function mapExcelRowToApplication(row: ExcelRow): Partial<ApplicationFormData> {
  const state = row['output__316256331__ST'] || '';
  const jobListingId = JOB_MATCHING_RULES[state] || JOB_MATCHING_RULES['default'];

  return {
    job_listing_id: jobListingId,
    first_name: row['output__301909100__First name'] || '',
    last_name: row['output__301909100__Last name'] || '',
    applicant_email: row['output__301909100__Email'] || '',
    phone: row['output__301909100__Phone number'] || '',
    city: row['output__306837197__zip_produced'] || '',
    state: state,
    zip: row['output__301909100__What zip code do you prefer to be based out of?'] || '',
    cdl: row['output__301909100__Do you have a Class A CDL?'] || '',
    exp: row['output__306830962__Exp_result'] || '',
    age: row['output__301909100__Are you 21 or older?'] || '',
    drug: row['output__301909100__Are you able to pass a DOT drug test?'] || '',
    veteran: row['output__301909100__Are you a Veteran?'] || '',
    consent: row['output__301909100__I agree to C.R. England\'s Privacy Policy & Mobile Terms of Service. By providing my phone number, I agree to receive text messages from the business.'] || '',
    privacy: row['output__301909100__I agree to C.R. England\'s Privacy Policy & Mobile Terms of Service. By providing my phone number, I agree to receive text messages from the business.'] || '',
    source: 'Facebook Lead Gen',
    campaign_id: row['output__301909100__campaign_id'] || '',
    ad_id: row['output__301909100__ad_id'] || '',
    adset_id: row['output__301909100__adset_id'] || '',
    months: row['output__301909100__How many months of Class A driving experience do you have?'] || '',
  };
}

/**
 * Converts ApplicationFormData to CSV row string
 */
export function applicationToCsvRow(app: Partial<ApplicationFormData>): string {
  const fields = [
    app.job_listing_id || '',
    app.first_name || '',
    app.last_name || '',
    app.applicant_email || '',
    app.phone || '',
    app.city || '',
    app.state || '',
    app.zip || '',
    app.cdl || '',
    app.exp || '',
    app.age || '',
    app.drug || '',
    app.veteran || '',
    app.consent || '',
    app.privacy || '',
    app.source || '',
    app.campaign_id || '',
    app.ad_id || '',
    app.adset_id || '',
    app.months || '',
    app.notes || '',
  ];

  // Escape and quote fields that contain commas or quotes
  return fields.map(field => {
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }).join(',');
}

/**
 * Generates CSV header row
 */
export function getCsvHeaders(): string {
  return [
    'job_listing_id',
    'first_name',
    'last_name',
    'applicant_email',
    'phone',
    'city',
    'state',
    'zip',
    'cdl',
    'exp',
    'age',
    'drug',
    'veteran',
    'consent',
    'privacy',
    'source',
    'campaign_id',
    'ad_id',
    'adset_id',
    'months',
    'notes',
  ].join(',');
}

/**
 * Processes Excel data and generates complete CSV string
 */
export function generateCsvFromExcelData(excelRows: ExcelRow[]): string {
  const csvLines = [getCsvHeaders()];
  
  excelRows.forEach((row, index) => {
    try {
      const application = mapExcelRowToApplication(row);
      
      // Validate required fields
      if (!application.applicant_email || !application.first_name || !application.last_name) {
        console.warn(`Skipping row ${index + 1}: Missing required fields`);
        return;
      }
      
      csvLines.push(applicationToCsvRow(application));
    } catch (error) {
      console.error(`Error processing row ${index + 1}:`, error);
    }
  });
  
  return csvLines.join('\n');
}
