
export const mapCsvToJobListing = (csvRow: any, userId: string) => {
  console.log('Mapping CSV row:', csvRow);

  const normalize = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const nmap: Record<string, any> = {};
  Object.keys(csvRow || {}).forEach(k => {
    nmap[normalize(k)] = csvRow[k];
  });

  const getText = (keys: string[], fallback: string = ''): string => {
    for (const k of keys) {
      if (csvRow[k] !== undefined && csvRow[k] !== null && String(csvRow[k]).trim() !== '') {
        return String(csvRow[k]).trim();
      }
      const nk = normalize(k);
      if (nmap[nk] !== undefined && nmap[nk] !== null && String(nmap[nk]).trim() !== '') {
        return String(nmap[nk]).trim();
      }
    }
    return fallback;
  };

  // Title and description
  const jobTitle = getText(['job_title','Job Title','title','Title','position','posting_title','posting title','role','jobname','job name']);
  const rawDescription = getText(['job_summary','summary','description','job_description','job description','desc','details']);

  // Location fields with flexible detection
  const rawLocation = getText(['location','city_state','city / state','city-state','city, state']);
  let city = getText(['city','City','origin_city','origin city','location_city','town']);
  let state = getText(['state','State','origin_state','origin state','province','region','st','statecode','state code']);

  if ((!city || !state) && rawLocation && rawLocation.includes(',')) {
    const [c, s] = rawLocation.split(',').map(p => p.trim());
    if (!city && c) city = c;
    if (!state && s) state = s;
  }
  const location = city && state ? `${city}, ${state}` : (city || state || rawLocation || '');

  // Salary fields
  const salaryMinStr = getText(['salary_min','Salary Min','min_salary','minimum_salary','pay_min','min pay','low_salary','salaryfrom']);
  const salaryMaxStr = getText(['salary_max','Salary Max','max_salary','maximum_salary','pay_max','max pay','high_salary','salaryto']);
  const salaryMin = parseNumber(salaryMinStr);
  const salaryMax = parseNumber(salaryMaxStr);
  const budget = salaryMax ?? salaryMin ?? null;

  // Salary type with normalization
  const rawSalaryType = getText(['salary_type','Salary Type','pay_type','compensation_type','rate_type','wage_type','payperiod','pay period']);
  const validSalaryTypes = ['hourly', 'yearly', 'weekly', 'daily', 'contract', 'monthly'];
  let salaryType: string | null = null;
  if (rawSalaryType) {
    const normalizedType = rawSalaryType.toLowerCase().trim();
    const mapTypes: Record<string, string> = {
      'per hour': 'hourly', 'hour': 'hourly', 'hr': 'hourly',
      'annual': 'yearly', 'annually': 'yearly', 'year': 'yearly', 'yr': 'yearly',
      'day': 'daily',
      'week': 'weekly', 'wk': 'weekly',
      'month': 'monthly', 'mo': 'monthly',
      'contract': 'contract'
    };
    const mapped = mapTypes[normalizedType] || normalizedType;
    salaryType = validSalaryTypes.includes(mapped) ? mapped : null;
    if (!salaryType) {
      console.log(`Invalid salary_type "${rawSalaryType}" found, setting to null`);
    }
  }

  // Other fields
  const radiusStr = getText(['radius','Radius','mile_radius','distance','searchradius']);
  const client = getText(['client','Client','company','employer','brand','account','customer']);
  const jobId = getText(['job_id','Job ID','jobid','req_id','req id','requisition_id','requisition id','posting_id','posting id','jobcode','job code','external_id','external id','id']);
  const dest_city = getText(['dest_city','Dest City','destination_city','destination city','destination']);
  const dest_state = getText(['dest_state','Dest State','destination_state','destination state']);
  const url = getText(['url','URL','link','apply_url','apply url','joburl','postingurl']);

  const mapped = {
    title: jobTitle,
    job_summary: rawDescription || '',
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
    client: client || null,
    radius: parseNumber(radiusStr),
    job_id: jobId || null,
    dest_city: dest_city || null,
    dest_state: dest_state || null,
    job_title: jobTitle,
    url: url || null,
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
