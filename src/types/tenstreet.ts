/**
 * Tenstreet API Data Types and Interfaces
 * 
 * NOTE: For API contracts, see src/types/tenstreet/api-contracts.ts
 * NOTE: For database types, see src/types/tenstreet/database.ts
 */

export interface TenstreetAuthentication {
  clientId: string;
  password: string;
  service: string;
}

export interface TenstreetConfig {
  authentication: TenstreetAuthentication;
  mode: 'DEV' | 'TEST' | 'PROD';
  source: string;
  companyId: string;
  companyName: string;
  driverId?: string;
  jobId?: string;
  statusTag?: string;
}

export interface PersonName {
  prefix?: string;
  givenName: string;
  middleName?: string;
  familyName: string;
  affix?: string;
}

export interface PostalAddress {
  countryCode: string;
  municipality: string;
  region: string;
  postalCode: string;
  address1?: string;
  address2?: string;
}

export interface GovernmentID {
  value: string;
  countryCode: string;
  issuingAuthority: string;
  documentType: string;
}

export interface ContactData {
  internetEmailAddress: string;
  primaryPhone?: string;
  secondaryPhone?: string;
  preferredMethod?: 'PrimaryPhone' | 'SecondaryPhone' | 'Email';
}

export interface PersonalData {
  personName: PersonName;
  postalAddress: PostalAddress;
  governmentID?: GovernmentID;
  dateOfBirth?: string;
  contactData: ContactData;
}

export interface CustomQuestion {
  questionId: string;
  question: string;
  answer: string;
}

export interface DisplayField {
  displayPrompt: string;
  displayValue: string;
}

// Endorsement types per Tenstreet schema
export type TenstreetEndorsement = 
  | 'tanker'
  | 'xendorsement'
  | 'hazmat'
  | 'doublestriples'
  | 'passenger'
  | 'schoolbus'
  | 'other';

export interface License {
  currentLicense: 'y' | 'n';
  licenseNumber?: string;
  expirationDate?: string; // Format: YYYY-MM-DD
  region?: string; // State code (e.g., 'OK', 'TX')
  countryCode?: string; // Default 'US'
  commercialDriversLicense: 'y' | 'n';
  licenseClass?: string; // 'Class A', 'Class B', 'Class C'
  endorsements?: TenstreetEndorsement[];
}

export interface ApplicationData {
  appReferrer?: string;
  licenses?: License[];
  customQuestions?: CustomQuestion[];
  displayFields?: DisplayField[];
}

export interface TenstreetData {
  authentication: TenstreetAuthentication;
  mode: string;
  source: string;
  companyId: string;
  companyName: string;
  driverId?: string;
  personalData: PersonalData;
  applicationData?: ApplicationData;
}

// Field mapping configuration interfaces
export interface LicenseMappings {
  currentLicense: string;
  licenseNumber: string;
  expirationDate: string;
  region: string;
  countryCode: string;
  commercialDriversLicense: string;
  licenseClass: string;
  endorsements: string;
}

export interface PersonalDataMappings {
  // PersonName mappings
  prefix: string;
  givenName: string;
  middleName: string;
  familyName: string;
  affix: string;
  
  // PostalAddress mappings
  countryCode: string;
  municipality: string;
  region: string;
  postalCode: string;
  address1: string;
  address2: string;
  
  // GovernmentID mappings
  governmentId: string;
  governmentIdCountryCode: string;
  governmentIdIssuingAuthority: string;
  governmentIdDocumentType: string;
  
  // Contact data mappings
  dateOfBirth: string;
  internetEmailAddress: string;
  primaryPhone: string;
  secondaryPhone: string;
  preferredMethod: string;
}

export interface TenstreetFieldMappings {
  personalData: PersonalDataMappings;
  license?: LicenseMappings;
  customQuestions: CustomQuestion[];
  displayFields: DisplayField[];
}

// Available field types for mapping
export const AVAILABLE_FIELD_TYPES = [
  // Basic contact info
  'first_name',
  'last_name',
  'email',
  'applicant_email',
  'phone',
  'secondary_phone',
  
  // Address fields
  'address',
  'address_1',
  'address_2', 
  'city',
  'state',
  'zip',
  'zip_code',
  'postal_code',
  'country',
  
  // Personal info
  'middle_name',
  'prefix',
  'suffix',
  'date_of_birth',
  'ssn',
  'government_id',
  
  // CDL/License fields
  'cdl',
  'cdl_class',
  'cdl_state',
  'cdl_endorsements',
  'cdl_expiration_date',
  
  // Application-specific fields
  'job_id',
  'driver_id',
  'experience_months',
  'months',
  'exp',
  'driving_experience_years',
  'veteran_status',
  'veteran',
  'over_21',
  'can_pass_drug_test',
  'agree_privacy_policy',
  'consent_to_sms',
  
  // Custom fields
  'notes',
  'source',
  'status',
  'applied_at',
  'created_at',
  'updated_at'
] as const;

export type AvailableFieldType = typeof AVAILABLE_FIELD_TYPES[number];