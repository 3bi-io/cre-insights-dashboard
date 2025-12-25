import React, { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Dedicated X Hiring Platform Apply Route
 * Route: /x/apply/:jobId
 * 
 * Automatically adds utm_source=x and utm_medium=hiring for tracking
 */
const XApply: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!jobId) {
      navigate('/apply');
      return;
    }

    // Build redirect URL with X-specific UTM params
    const params = new URLSearchParams();
    params.set('job_id', jobId);
    params.set('utm_source', 'x');
    params.set('utm_medium', 'hiring');
    
    // Preserve any additional UTM params from the URL
    const utmCampaign = searchParams.get('utm_campaign') || searchParams.get('campaign');
    if (utmCampaign) params.set('utm_campaign', utmCampaign);

    navigate(`/apply?${params.toString()}`, { replace: true });
  }, [jobId, searchParams, navigate]);

  return null;
};

export default XApply;
