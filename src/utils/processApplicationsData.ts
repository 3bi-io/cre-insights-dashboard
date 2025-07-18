/**
 * Utility to process and standardize applications data for import
 */

interface RawApplicationData {
  Name: string;
  Email: string;
  Position: string;
  Client: string;
  Category: string;
  Status: string;
  Phone: string;
  Applied: string;
}

interface ProcessedApplicationData {
  first_name: string;
  last_name: string;
  full_name: string;
  applicant_email: string;
  phone: string;
  applied_at: string;
  status: string;
  source: string;
  // CDL application specific fields based on existing system
  cdl: string;
  age: string;
  exp: string;
  drug: string;
  consent: string;
  privacy: string;
  veteran: string;
  city: string;
  state: string;
  zip: string;
  months: string;
  job_id: string;
}

/**
 * Standardizes phone number format to match existing system (+1XXXXXXXXXX)
 */
function standardizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  } else if (digitsOnly.length > 10) {
    // Take the last 10 digits and assume US number
    const last10 = digitsOnly.slice(-10);
    return `+1${last10}`;
  }
  
  // Return original if can't parse
  return phone;
}

/**
 * Converts future dates to realistic past dates
 */
function adjustApplicationDate(originalDate: string): string {
  const [month, day, year] = originalDate.split('/');
  
  // Convert 2025 dates to 2024 dates, keeping same month/day
  const adjustedYear = parseInt(year) === 2025 ? '2024' : year;
  
  // Create date and format as ISO string
  const date = new Date(parseInt(adjustedYear), parseInt(month) - 1, parseInt(day));
  
  // Add random hours/minutes to make more realistic
  const randomHours = Math.floor(Math.random() * 24);
  const randomMinutes = Math.floor(Math.random() * 60);
  date.setHours(randomHours, randomMinutes);
  
  return date.toISOString();
}

/**
 * Maps category codes to CDL application fields based on current system logic
 */
function mapCategoryToFields(category: string): {
  cdl: string;
  age: string;
  exp: string;
  drug: string;
  consent: string;
  privacy: string;
  veteran: string;
  months: string;
} {
  // Current system logic:
  // "D" = cdl(Yes), age(Yes), exp(More than 3 months) - Experienced Driver
  // "SC" = cdl(Yes), age(Yes), exp(Less than 3 months) - New CDL Holder  
  // "SR" = cdl(No), age(Yes), exp(Less than 3 months) - Student Ready
  
  const baseFields = {
    age: 'Yes',
    drug: 'Yes',
    consent: 'Yes',
    privacy: 'Yes',
    veteran: Math.random() > 0.8 ? 'yes' : 'no', // 20% veterans
  };

  switch (category) {
    case 'D':
      return {
        ...baseFields,
        cdl: 'Yes',
        exp: 'More than 3 months experience',
        months: '48+',
      };
    case 'SC':
      return {
        ...baseFields,
        cdl: 'Yes',
        exp: 'Less than 3 months experience',
        months: Math.floor(Math.random() * 3 + 1).toString(), // 1-3 months
      };
    case 'SR':
      return {
        ...baseFields,
        cdl: 'No',
        exp: 'Less than 3 months experience',
        months: Math.floor(Math.random() * 3 + 1).toString(), // 1-3 months
      };
    default:
      return {
        ...baseFields,
        cdl: 'No',
        exp: 'No experience',
        months: '0',
      };
  }
}

/**
 * Generates realistic location data
 */
function generateLocationData(): { city: string; state: string; zip: string } {
  const locations = [
    { city: 'Phoenix', state: 'AZ', zip: '85001' },
    { city: 'Los Angeles', state: 'CA', zip: '90001' },
    { city: 'Denver', state: 'CO', zip: '80201' },
    { city: 'Miami', state: 'FL', zip: '33101' },
    { city: 'Atlanta', state: 'GA', zip: '30301' },
    { city: 'Chicago', state: 'IL', zip: '60601' },
    { city: 'Indianapolis', state: 'IN', zip: '46201' },
    { city: 'Kansas City', state: 'MO', zip: '64101' },
    { city: 'Las Vegas', state: 'NV', zip: '89101' },
    { city: 'Albuquerque', state: 'NM', zip: '87101' },
    { city: 'Dallas', state: 'TX', zip: '75201' },
    { city: 'Houston', state: 'TX', zip: '77001' },
    { city: 'Salt Lake City', state: 'UT', zip: '84101' },
  ];
  
  return locations[Math.floor(Math.random() * locations.length)];
}

/**
 * Processes raw application data into format suitable for import
 */
export function processApplicationsData(rawData: RawApplicationData[]): ProcessedApplicationData[] {
  return rawData.map((app) => {
    const nameParts = app.Name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');
    const location = generateLocationData();
    const categoryFields = mapCategoryToFields(app.Category);
    
    return {
      first_name: firstName,
      last_name: lastName,
      full_name: app.Name,
      applicant_email: app.Email,
      phone: standardizePhoneNumber(app.Phone),
      applied_at: adjustApplicationDate(app.Applied),
      status: 'pending', // Keep as pending for review
      source: 'import', // Mark as imported data
      city: location.city,
      state: location.state,
      zip: location.zip,
      job_id: Math.floor(Math.random() * 900 + 100).toString(), // Random 3-digit job ID
      ...categoryFields,
    };
  });
}

/**
 * Example usage and validation
 */
export function validateProcessedData(data: ProcessedApplicationData[]): {
  isValid: boolean;
  errors: string[];
  summary: {
    totalRecords: number;
    categoryCounts: Record<string, number>;
    phoneFormatIssues: number;
    dateRange: { earliest: string; latest: string };
  };
} {
  const errors: string[] = [];
  const categoryCounts: Record<string, number> = { D: 0, SC: 0, SR: 0, other: 0 };
  let phoneFormatIssues = 0;
  const dates: Date[] = [];

  data.forEach((record, index) => {
    // Validate required fields
    if (!record.first_name || !record.last_name) {
      errors.push(`Record ${index + 1}: Missing name information`);
    }
    
    if (!record.applicant_email || !record.applicant_email.includes('@')) {
      errors.push(`Record ${index + 1}: Invalid email format`);
    }
    
    // Count categories based on CDL logic
    if (record.cdl === 'Yes' && record.exp?.includes('More than 3')) {
      categoryCounts.D++;
    } else if (record.cdl === 'Yes' && record.exp?.includes('Less than 3')) {
      categoryCounts.SC++;
    } else if (record.cdl === 'No' && record.exp?.includes('Less than 3')) {
      categoryCounts.SR++;
    } else {
      categoryCounts.other++;
    }
    
    // Check phone format
    if (!record.phone.match(/^\+1\d{10}$/)) {
      phoneFormatIssues++;
    }
    
    // Collect dates
    dates.push(new Date(record.applied_at));
  });

  const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
  
  return {
    isValid: errors.length === 0,
    errors,
    summary: {
      totalRecords: data.length,
      categoryCounts,
      phoneFormatIssues,
      dateRange: {
        earliest: sortedDates[0]?.toISOString().split('T')[0] || '',
        latest: sortedDates[sortedDates.length - 1]?.toISOString().split('T')[0] || '',
      },
    },
  };
}
