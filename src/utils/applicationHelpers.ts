export const getApplicantName = (app: any) => {
  if (app.first_name && app.last_name) {
    return `${app.first_name} ${app.last_name}`;
  } else if (app.first_name) {
    return app.first_name;
  } else if (app.last_name) {
    return app.last_name;
  }
  return 'Anonymous Applicant';
};

export const getApplicantEmail = (app: any) => {
  return app.applicant_email || app.email || 'No email provided';
};

export const getApplicantLocation = (app: any) => {
  const city = app.city || '';
  const state = app.state || '';
  
  if (!city && !state) return 'No location provided';
  if (!city) return state;
  if (!state) return city;
  
  // Use state abbreviation if it's longer than 2 characters
  const stateDisplay = state.length > 2 ? state.substring(0, 2).toUpperCase() : state.toUpperCase();
  
  return `${city}, ${stateDisplay}`;
};

export const getClientName = (app: any) => {
  return app.job_listings?.clients?.name || app.job_listings?.client || null;
};

export const getApplicantCategory = (app: any) => {
  const hasCdl = app.cdl?.toLowerCase() === 'yes';
  const hasAge = app.age?.toLowerCase() === 'yes';
  const expValue = app.exp?.toLowerCase() || '';
  
  const hasMoreThan3MonthsExp = 
    expValue.includes('more than 3') || 
    expValue.includes('>3') || 
    expValue.includes('over 3') ||
    expValue.includes('4') || expValue.includes('5') || expValue.includes('6') ||
    expValue.includes('year') || expValue.includes('experienced');
  
  const hasLessThan3MonthsExp = 
    expValue.includes('less than 3') || 
    expValue.includes('<3') || 
    expValue.includes('under 3') ||
    expValue.includes('1') || expValue.includes('2') || 
    expValue.includes('beginner') || expValue.includes('new');

  if (hasCdl && hasAge && hasMoreThan3MonthsExp) {
    return { code: 'D', label: 'Experienced Driver', color: 'bg-green-100 text-green-800' };
  }
  
  if (hasCdl && hasAge && hasLessThan3MonthsExp) {
    return { code: 'SC', label: 'New CDL Holder', color: 'bg-blue-100 text-blue-800' };
  }
  
  if (!hasCdl && hasAge && hasLessThan3MonthsExp) {
    return { code: 'SR', label: 'Student Ready', color: 'bg-yellow-100 text-yellow-800' };
  }

  return { code: 'N/A', label: 'Uncategorized', color: 'bg-gray-100 text-gray-800' };
};

export const filterApplications = (applications: any[], searchTerm: string, categoryFilter: string) => {
  return applications?.filter(app => {
    const applicantName = getApplicantName(app);
    const applicantEmail = getApplicantEmail(app);
    const jobTitle = app.job_listings?.title || app.job_listings?.job_title || '';
    const category = getApplicantCategory(app);
    
    const matchesSearch = (
      applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicantEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesCategory = categoryFilter === 'all' || category.code === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
};

export const getStatusCounts = (applications: any[]) => {
  return applications?.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

export const getCategoryCounts = (applications: any[]) => {
  return applications?.reduce((acc, app) => {
    const category = getApplicantCategory(app);
    acc[category.code] = (acc[category.code] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};