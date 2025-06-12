
export const mapCsvToJobListing = (csvRow: any, userId: string) => {
  console.log('Mapping CSV row:', csvRow);
  
  // Try multiple possible column names for job title
  const jobTitle = csvRow.job_title || csvRow['Job Title'] || csvRow.title || csvRow.Title || '';
  const description = csvRow.description || csvRow.Description || '';
  
  // Handle location fields more flexibly
  const city = csvRow.city || csvRow.City || csvRow.dest_city || '';
  const state = csvRow.state || csvRow.State || csvRow.dest_state || '';
  const location = city && state ? `${city}, ${state}` : (city || state || '');
  
  // Handle salary fields more flexibly
  const salaryMin = parseNumber(csvRow.salary_min || csvRow['Salary Min'] || csvRow.min_salary);
  const salaryMax = parseNumber(csvRow.salary_max || csvRow['Salary Max'] || csvRow.max_salary);
  const budget = salaryMax || salaryMin || null;
  
  // Handle salary_type with validation
  const rawSalaryType = csvRow.salary_type || csvRow['Salary Type'] || '';
  const validSalaryTypes = ['hourly', 'yearly', 'weekly', 'daily', 'contract'];
  let salaryType = null;
  
  if (rawSalaryType) {
    const normalizedType = rawSalaryType.toLowerCase().trim();
    if (validSalaryTypes.includes(normalizedType)) {
      salaryType = normalizedType;
    } else {
      console.log(`Invalid salary_type "${rawSalaryType}" found, setting to null`);
    }
  }
  
  const mapped = {
    title: jobTitle,
    description: description,
    location: location,
    budget: budget,
    experience_level: 'entry',
    status: 'active',
    salary_min: salaryMin,
    salary_max: salaryMax,
    salary_type: salaryType,
    remote_type: null,
    city: city || null,
    state: state || null,
    client: csvRow.client || csvRow.Client || null,
    radius: parseNumber(csvRow.radius || csvRow.Radius),
    job_id: csvRow.job_id || csvRow['Job ID'] || csvRow.id || null,
    dest_city: csvRow.dest_city || csvRow['Dest City'] || null,
    dest_state: csvRow.dest_state || csvRow['Dest State'] || null,
    job_title: jobTitle,
    url: csvRow.url || csvRow.URL || csvRow.link || null,
    user_id: userId,
  };
  
  console.log('Mapped job listing:', mapped);
  return mapped;
};

// Helper function to parse numbers safely
function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseFloat(String(value).replace(/[$,]/g, ''));
  return isNaN(parsed) ? null : parsed;
}
