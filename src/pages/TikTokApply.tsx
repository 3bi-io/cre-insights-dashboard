import React from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';

/**
 * Dedicated TikTok Apply Route
 * Route: /tt/apply/:jobId
 * 
 * Automatically adds utm_source=tiktok and utm_medium=social for tracking
 */
const TikTokApply: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();

  const params = new URLSearchParams();
  
  if (jobId) {
    params.set('job_id', jobId);
  }
  
  params.set('utm_source', 'tiktok');
  params.set('utm_medium', 'social');
  
  const utmCampaign = searchParams.get('utm_campaign') || searchParams.get('campaign');
  if (utmCampaign) params.set('utm_campaign', utmCampaign);

  return <Navigate to={`/apply?${params.toString()}`} replace />;
};

export default TikTokApply;
