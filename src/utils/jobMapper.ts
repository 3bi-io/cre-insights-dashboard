
export const mapCsvToJobListing = (csvRow: any, userId: string) => {
  return {
    title: csvRow.job_title || '',
    description: csvRow.job_description || '',
    location: csvRow.city && csvRow.state ? `${csvRow.city}, ${csvRow.state}` : (csvRow.city || csvRow.state || ''),
    budget: csvRow.salary_max ? parseFloat(csvRow.salary_max) : null,
    experience_level: 'entry',
    status: 'active',
    salary_min: csvRow.salary_min ? parseFloat(csvRow.salary_min) : null,
    salary_max: csvRow.salary_max ? parseFloat(csvRow.salary_max) : null,
    salary_type: csvRow.salary_type || null,
    remote_type: null,
    city: csvRow.city || null,
    state: csvRow.state || null,
    client: csvRow.client || null,
    radius: csvRow.radius ? parseInt(csvRow.radius) : null,
    job_id: csvRow.job_id || null,
    dest_city: csvRow.dest_city || null,
    dest_state: csvRow.dest_state || null,
    job_title: csvRow.job_title || null,
    job_description: csvRow.job_description || null,
    url: csvRow.url || null,
    user_id: userId,
  };
};
