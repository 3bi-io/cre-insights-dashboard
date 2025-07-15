import { TenstreetData, PersonalData, CustomQuestion, DisplayField } from '@/types/tenstreet';

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

// Helper function to format phone number
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format as XXX-XXX-XXXX if it's a 10-digit US number
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  return phone; // Return original if not standard format
};

// Helper function to format date
export const formatDate = (dateValue: string): string => {
  if (!dateValue) return '';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return dateValue; // Return original if invalid
    
    // Format as MM/DD/YYYY
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${month}/${day}/${year}`;
  } catch (error) {
    return dateValue; // Return original if parsing fails
  }
};

// Helper function to format SSN
export const formatSSN = (ssn: string): string => {
  if (!ssn) return '';
  // Remove all non-digit characters
  const digits = ssn.replace(/\D/g, '');
  
  // Format as XXX-XX-XXXX if it's 9 digits
  if (digits.length === 9) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }
  
  return ssn; // Return original if not standard format
};

// Build PersonalData section from application data and mappings
export const buildPersonalData = (applicationData: any, mappings: any): PersonalData => {
  const personalDataMappings = mappings.personalData || {};
  
  return {
    personName: {
      prefix: getFieldValue(applicationData, personalDataMappings.prefix),
      givenName: getFieldValue(applicationData, personalDataMappings.givenName) || 
                 getFieldValue(applicationData, personalDataMappings.firstName), // fallback
      middleName: getFieldValue(applicationData, personalDataMappings.middleName),
      familyName: getFieldValue(applicationData, personalDataMappings.familyName) || 
                  getFieldValue(applicationData, personalDataMappings.lastName), // fallback
      affix: getFieldValue(applicationData, personalDataMappings.affix)
    },
    postalAddress: {
      countryCode: getFieldValue(applicationData, personalDataMappings.countryCode) || 'US',
      municipality: getFieldValue(applicationData, personalDataMappings.municipality) || 
                    getFieldValue(applicationData, personalDataMappings.city), // fallback
      region: getFieldValue(applicationData, personalDataMappings.region) || 
              getFieldValue(applicationData, personalDataMappings.state), // fallback
      postalCode: getFieldValue(applicationData, personalDataMappings.postalCode) || 
                  getFieldValue(applicationData, personalDataMappings.zipCode), // fallback
      address1: getFieldValue(applicationData, personalDataMappings.address1) || 
                getFieldValue(applicationData, personalDataMappings.address), // fallback
      address2: getFieldValue(applicationData, personalDataMappings.address2)
    },
    governmentID: personalDataMappings.governmentId ? {
      value: formatSSN(getFieldValue(applicationData, personalDataMappings.governmentId)),
      countryCode: getFieldValue(applicationData, personalDataMappings.governmentIdCountryCode) || 'US',
      issuingAuthority: getFieldValue(applicationData, personalDataMappings.governmentIdIssuingAuthority) || 'SSA',
      documentType: getFieldValue(applicationData, personalDataMappings.governmentIdDocumentType) || 'SSN'
    } : undefined,
    dateOfBirth: formatDate(getFieldValue(applicationData, personalDataMappings.dateOfBirth)),
    contactData: {
      internetEmailAddress: getFieldValue(applicationData, personalDataMappings.internetEmailAddress) || 
                           getFieldValue(applicationData, personalDataMappings.email), // fallback
      primaryPhone: formatPhoneNumber(getFieldValue(applicationData, personalDataMappings.primaryPhone) || 
                                     getFieldValue(applicationData, personalDataMappings.phone)), // fallback
      secondaryPhone: formatPhoneNumber(getFieldValue(applicationData, personalDataMappings.secondaryPhone)),
      preferredMethod: (['PrimaryPhone', 'SecondaryPhone', 'Email'].includes(getFieldValue(applicationData, personalDataMappings.preferredMethod)) 
        ? getFieldValue(applicationData, personalDataMappings.preferredMethod) 
        : 'PrimaryPhone') as 'PrimaryPhone' | 'SecondaryPhone' | 'Email'
    }
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
    .filter(q => q.answer); // Only include questions with answers
};

// Build DisplayFields section
export const buildDisplayFields = (applicationData: any, displayFields: any[]): DisplayField[] => {
  if (!displayFields || !Array.isArray(displayFields)) return [];
  
  return displayFields
    .filter(f => f.displayPrompt && f.mapping)
    .map(f => ({
      displayPrompt: f.displayPrompt,
      displayValue: getFieldValue(applicationData, f.mapping)
    }))
    .filter(f => f.displayValue); // Only include fields with values
};

// Main function to build complete Tenstreet XML data structure
export const buildTenstreetData = (applicationData: any, mappings: any, config: any): TenstreetData => {
  return {
    authentication: {
      clientId: config.clientId,
      password: config.password,
      service: config.service || 'subject_upload'
    },
    mode: config.mode || 'PROD',
    source: config.source,
    companyId: config.companyId,
    companyName: config.companyName,
    driverId: config.driverId || getFieldValue(applicationData, 'driver_id'),
    personalData: buildPersonalData(applicationData, mappings),
    applicationData: {
      appReferrer: config.appReferrer || '3BI',
      customQuestions: buildCustomQuestions(applicationData, mappings.customQuestions),
      displayFields: buildDisplayFields(applicationData, mappings.displayFields)
    }
  };
};