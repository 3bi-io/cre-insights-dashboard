import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const ShortLinkRedirect: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolveShortLink = async () => {
      if (!shortCode) {
        navigate('/apply');
        return;
      }

      try {
        // Look up the short link
        const { data: shortLink, error: fetchError } = await supabase
          .from('job_short_links')
          .select('job_listing_id, utm_source, utm_medium, utm_campaign')
          .eq('short_code', shortCode)
          .eq('is_active', true)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!shortLink) {
          setError('This link is no longer active or does not exist.');
          return;
        }

        // Increment click count - using raw SQL increment via update
        // Note: This is a fire-and-forget operation
        fetch(`https://auwhcdpppldjlcaxzsme.supabase.co/rest/v1/rpc/increment_short_link_click`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1d2hjZHBwcGxkamxjYXh6c21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDg1NjAsImV4cCI6MjA2NTMyNDU2MH0._K3Se_I9Y5dGmV-42V4MJvj4AqSWouXRTXVArOVASdU',
          },
          body: JSON.stringify({ p_short_code: shortCode }),
        }).catch(() => {});

        // Build redirect URL with UTM params
        const params = new URLSearchParams();
        params.set('job_id', shortLink.job_listing_id);
        
        if (shortLink.utm_source) params.set('utm_source', shortLink.utm_source);
        if (shortLink.utm_medium) params.set('utm_medium', shortLink.utm_medium);
        if (shortLink.utm_campaign) params.set('utm_campaign', shortLink.utm_campaign);

        navigate(`/apply?${params.toString()}`, { replace: true });
      } catch (err) {
        console.error('Error resolving short link:', err);
        setError('Failed to resolve link. Please try again.');
      }
    };

    resolveShortLink();
  }, [shortCode, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold text-foreground">Link Not Found</h1>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="text-primary hover:underline"
          >
            Go to homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Redirecting to application...</p>
      </div>
    </div>
  );
};

export default ShortLinkRedirect;
