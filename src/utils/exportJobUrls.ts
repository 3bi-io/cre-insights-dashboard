/**
 * Utility to export job URLs with UTM tracking parameters to CSV
 */

import { supabase } from '@/integrations/supabase/client';

interface JobData {
  client_name: string | null;
  job_title: string;
  job_id: string;
  city: string | null;
  state: string | null;
}

const BASE_URL = 'https://applyai.jobs';

export const generateJobUrlsCsv = async (): Promise<string> => {
  const { data: jobs, error } = await supabase
    .from('job_listings')
    .select(`
      id,
      title,
      city,
      state,
      clients (
        name
      )
    `)
    .eq('status', 'active')
    .order('city', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch jobs: ${error.message}`);
  }

  // CSV Headers
  const headers = [
    'Client Name',
    'Job Title',
    'Location',
    'Job ID',
    'Direct Apply URL',
    'Direct Apply URL (with UTM)',
    'X/Twitter Apply URL',
    'LinkedIn Apply URL',
    'Indeed Apply URL',
    'Facebook Apply URL',
    'Email Apply URL',
  ];

  // Generate CSV rows
  const rows = jobs?.map((job: any) => {
    const clientName = job.clients?.name || 'Unassigned';
    const location = [job.city, job.state].filter(Boolean).join(', ') || 'N/A';
    const jobId = job.id;

    return [
      escapeCSV(clientName),
      escapeCSV(job.title),
      escapeCSV(location),
      jobId,
      `${BASE_URL}/apply?job_id=${jobId}`,
      `${BASE_URL}/apply?job_id=${jobId}&utm_source=direct&utm_medium=job_link&utm_campaign=driver_recruitment_2025`,
      `${BASE_URL}/x/apply/${jobId}`,
      `${BASE_URL}/in/apply/${jobId}`,
      `${BASE_URL}/s/indeed/apply/${jobId}`,
      `${BASE_URL}/s/facebook/apply/${jobId}`,
      `${BASE_URL}/s/email/apply/${jobId}`,
    ].join(',');
  }) || [];

  return [headers.join(','), ...rows].join('\n');
};

export const downloadJobUrlsCsv = async (): Promise<void> => {
  const csvContent = await generateJobUrlsCsv();
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `job-urls-with-utm-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

const escapeCSV = (value: string): string => {
  if (!value) return '';
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};
