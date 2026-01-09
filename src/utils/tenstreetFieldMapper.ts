import { TenstreetData, PersonalData, CustomQuestion, DisplayField, License, TenstreetEndorsement } from '@/types/tenstreet';

// Helper function to safely get field value from application data
export const getFieldValue = (applicationData: any, fieldName: string): string => {
  if (!fieldName || !applicationData) return '';
  
  // Handle nested field access with dot notation
  if (fieldName.includes('.')) {
    const parts = fieldName.split('.');
    let value = applicationData;
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined || value === null) return '';
    }
    return String(value);
  }
  
  // Direct field access
  const value = applicationData[fieldName];
  if (value === undefined || value === null) return '';
  return String(value);
};

// Helper function to format phone number (XXX-XXX-XXXX format per Tenstreet)
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
};

// Helper function to format date (MM/DD/YYYY for PersonalData)
export const formatDate = (dateValue: string): string => {
  if (!dateValue) return '';
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return dateValue;
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch (error) {
    return dateValue;
  }
};

// Helper function to format date (YYYY-MM-DD for Licenses)
export const formatDateISO = (dateValue: string): string => {
  if (!dateValue) return '';
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return dateValue;
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    return dateValue;
  }
};

// Helper function to format SSN (XXX-XX-XXXX format)
export const formatSSN = (ssn: string): string => {
  if (!ssn) return '';
  const digits = ssn.replace(/\D/g, '');
  if (digits.length === 9) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }
  return ssn;
};

// Helper function to format email with mailto: prefix per Tenstreet schema
export const formatEmail = (email: string): string => {
  if (!email) return '';
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail.startsWith('mailto:')) return cleanEmail;
  return `mailto:${cleanEmail}`;
};

// Helper to normalize yes/no values
export const normalizeYesNo = (value: string): 'y' | 'n' => {
  if (!value) return 'n';
  const lower = value.toLowerCase().trim();
  return ['yes', 'y', 'true', '1'].includes(lower) ? 'y' : 'n';
};

// Map CDL endorsements to Tenstreet format
export const mapEndorsements = (endorsements: any): TenstreetEndorsement[] => {
  if (!endorsements) return [];
  
  const endorsementList = Array.isArray(endorsements) 
    ? endorsements 
    : typeof endorsements === 'string' 
      ? endorsements.split(',').map(e => e.trim())
      : [];
  
  const endorsementMap: Record<string, TenstreetEndorsement> = {
    't': 'tanker',
    'tanker': 'tanker',
    'n': 'tanker',
    'x': 'xendorsement',
    'xendorsement': 'xendorsement',
    'combination': 'xendorsement',
    'h': 'hazmat',
    'hazmat': 'hazmat',
    'doubles': 'doublestriples',
    'triples': 'doublestriples',
    'doublestriples': 'doublestriples',
    'doubles/triples': 'doublestriples',
    'p': 'passenger',
    'passenger': 'passenger',
    's': 'schoolbus',
    'schoolbus': 'schoolbus',
    'school bus': 'schoolbus',
  };
  
  return endorsementList
    .map(e => endorsementMap[String(e).toLowerCase()] || 'other')
    .filter((e, i, arr) => arr.indexOf(e) === i) as TenstreetEndorsement[];
};

// Build PersonalData section from application data and mappings
export const buildPersonalData = (applicationData: any, mappings: any): PersonalData => {
  const personalDataMappings = mappings.personalData || {};
  
  return {
    personName: {
      prefix: getFieldValue(applicationData, personalDataMappings.prefix || 'prefix'),
      givenName: getFieldValue(applicationData, personalDataMappings.givenName || 'first_name'),
      middleName: getFieldValue(applicationData, personalDataMappings.middleName || 'middle_name'),
      familyName: getFieldValue(applicationData, personalDataMappings.familyName || 'last_name'),
      affix: getFieldValue(applicationData, personalDataMappings.affix || 'suffix')
    },
    postalAddress: {
      countryCode: getFieldValue(applicationData, personalDataMappings.countryCode || 'country') || 'US',
      municipality: getFieldValue(applicationData, personalDataMappings.municipality || 'city'),
      region: getFieldValue(applicationData, personalDataMappings.region || 'state'),
      postalCode: getFieldValue(applicationData, personalDataMappings.postalCode || 'zip'),
      address1: getFieldValue(applicationData, personalDataMappings.address1 || 'address_1'),
      address2: getFieldValue(applicationData, personalDataMappings.address2 || 'address_2')
    },
    governmentID: personalDataMappings.governmentId ? {
      value: formatSSN(getFieldValue(applicationData, personalDataMappings.governmentId || 'ssn')),
      countryCode: 'US',
      issuingAuthority: 'SSA',
      documentType: 'SSN'
    } : undefined,
    dateOfBirth: formatDate(getFieldValue(applicationData, personalDataMappings.dateOfBirth || 'date_of_birth')),
    contactData: {
      internetEmailAddress: formatEmail(getFieldValue(applicationData, personalDataMappings.internetEmailAddress || 'applicant_email')),
      primaryPhone: formatPhoneNumber(getFieldValue(applicationData, personalDataMappings.primaryPhone || 'phone')),
      secondaryPhone: formatPhoneNumber(getFieldValue(applicationData, personalDataMappings.secondaryPhone || 'secondary_phone')),
      preferredMethod: 'PrimaryPhone'
    }
  };
};

// Build License section from application data and mappings
export const buildLicense = (applicationData: any, mappings: any): License | undefined => {
  const licenseMappings = mappings.license || {};
  
  const hasCDL = normalizeYesNo(getFieldValue(applicationData, licenseMappings.commercialDriversLicense || 'cdl'));
  const cdlClass = getFieldValue(applicationData, licenseMappings.licenseClass || 'cdl_class');
  
  // Only build license if there's CDL data
  if (hasCDL === 'n' && !cdlClass) return undefined;
  
  return {
    currentLicense: hasCDL,
    licenseNumber: getFieldValue(applicationData, licenseMappings.licenseNumber || ''),
    expirationDate: formatDateISO(getFieldValue(applicationData, licenseMappings.expirationDate || 'cdl_expiration_date')),
    region: getFieldValue(applicationData, licenseMappings.region || 'cdl_state'),
    countryCode: 'US',
    commercialDriversLicense: hasCDL,
    licenseClass: cdlClass,
    endorsements: mapEndorsements(applicationData[licenseMappings.endorsements || 'cdl_endorsements'])
  };
};

// Build CustomQuestions section
export const buildCustomQuestions = (applicationData: any, customQuestions: any[]): CustomQuestion[] => {
  if (!customQuestions || !Array.isArray(customQuestions)) return [];
  
  return customQuestions
    .filter(q => q.questionId && q.question && q.mapping)
    .map(q => ({
      questionId: q.questionId,
      question: q.question,
      answer: getFieldValue(applicationData, q.mapping)
    }))
    .filter(q => q.answer);
};

// Build DisplayFields section
export const buildDisplayFields = (applicationData: any, displayFields: any[]): DisplayField[] => {
  const result: DisplayField[] = [];
  
  // Add driver_type as a display field if present
  const driverType = getFieldValue(applicationData, 'driver_type');
  if (driverType) {
    result.push({
      displayPrompt: 'Driver Type',
      displayValue: driverType
    });
  }
  
  // Add configured display fields
  if (displayFields && Array.isArray(displayFields)) {
    const configuredFields = displayFields
      .filter(f => f.displayPrompt && f.mapping)
      .map(f => ({
        displayPrompt: f.displayPrompt,
        displayValue: getFieldValue(applicationData, f.mapping)
      }))
      .filter(f => f.displayValue);
    
    result.push(...configuredFields);
  }
  
  return result;
};

// Main function to build complete Tenstreet data structure
export const buildTenstreetData = (applicationData: any, mappings: any, config: any): TenstreetData => {
  const license = buildLicense(applicationData, mappings);
  
  return {
    authentication: {
      clientId: config.clientId,
      password: config.password,
      service: config.service || 'subject_upload'
    },
    mode: config.mode || 'DEV',
    source: config.source,
    companyId: config.companyId,
    companyName: config.companyName,
    driverId: config.driverId || getFieldValue(applicationData, 'driver_id'),
    personalData: buildPersonalData(applicationData, mappings),
    applicationData: {
      appReferrer: config.appReferrer || '',
      licenses: license ? [license] : undefined,
      customQuestions: buildCustomQuestions(applicationData, mappings.customQuestions),
      displayFields: buildDisplayFields(applicationData, mappings.displayFields)
    }
  };
};