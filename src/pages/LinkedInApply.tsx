import React from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';

/**
 * Dedicated LinkedIn Apply Route
 * Route: /in/apply/:jobId
 * 
 * Automatically adds utm_source=linkedin and utm_medium=hiring for tracking
 * Uses declarative Navigate for immediate redirect without intermediate render
 */
const LinkedInApply: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();

  // Build redirect URL with LinkedIn-specific UTM params
  const params = new URLSearchParams();
  
  if (jobId) {
    params.set('job_id', jobId);
  }
  
  params.set('utm_source', 'linkedin');
  params.set('utm_medium', 'hiring');
  
  // Preserve any additional UTM params from the URL
  const utmCampaign = searchParams.get('utm_campaign') || searchParams.get('campaign');
  if (utmCampaign) params.set('utm_campaign', utmCampaign);

  // Immediate declarative redirect - no intermediate state/render
  return <Navigate to={`/apply?${params.toString()}`} replace />;
};

export default LinkedInApply;
