import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ApplicationHeader } from '@/components/apply/ApplicationHeader';
import { EmbedApplicationForm } from '@/components/apply/EmbedApplicationForm';
import { EmbedThankYou } from '@/components/apply/EmbedThankYou';
import { useEmbedMode } from '@/hooks/useEmbedMode';
import { useApplyContext } from '@/hooks/useApplyContext';
import ZipRecruiterPixel from '@/components/tracking/ZipRecruiterPixel';

interface SubmissionResult {
  applicationId: string;
  clientName?: string;
  clientLogoUrl?: string;
  hasVoiceAgent?: boolean;
}

/**
 * Embeddable Apply Page
 * - Forces light mode for consistent appearance in iframes
 * - Removes navigation elements
 * - Uses postMessage for parent communication
 * - Shows inline thank you instead of redirect
 */
const EmbedApply: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { hideBranding, notifyParent, sendHeight } = useEmbedMode();
  const { clientName, clientLogoUrl, jobTitle, location, source, isLoading: contextLoading } = useApplyContext();
  
  // Track submission state for inline thank you
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Force light mode on mount
  useEffect(() => {
    const root = document.documentElement;
    const originalClasses = root.className;
    
    // Remove dark mode, add light mode
    root.classList.remove('dark');
    root.classList.add('light');
    
    // Also set color-scheme for form elements
    document.body.style.colorScheme = 'light';

    // Cleanup on unmount
    return () => {
      root.className = originalClasses;
      document.body.style.colorScheme = '';
    };
  }, []);

  // Send height updates when content changes
  useEffect(() => {
    sendHeight();
  }, [isSubmitted, contextLoading, sendHeight]);

  // Handle successful submission (called from within the form)
  const handleSubmissionSuccess = useCallback((result: SubmissionResult) => {
    // Merge context logo with result
    setSubmissionResult({
      ...result,
      clientLogoUrl: result.clientLogoUrl || clientLogoUrl || undefined,
    });
    setIsSubmitted(true);
    
    // Notify parent window (using organizationName for backward compatibility with embedders)
    notifyParent({
      type: 'application_submitted',
      applicationId: result.applicationId,
      organizationName: result.clientName,
    });
  }, [notifyParent, clientLogoUrl]);

  // If submitted, show inline thank you
  if (isSubmitted && submissionResult) {
    return (
      <div className="min-h-screen bg-background px-6 sm:px-4">
        <EmbedThankYou
          applicationId={submissionResult.applicationId}
          clientName={submissionResult.clientName}
          clientLogoUrl={submissionResult.clientLogoUrl}
          hasVoiceAgent={submissionResult.hasVoiceAgent}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="container mx-auto px-6 sm:px-4 py-4 sm:py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header with client/job branding */}
          <ApplicationHeader 
            jobTitle={jobTitle}
            clientName={clientName}
            clientLogoUrl={clientLogoUrl}
            location={location}
            source={source}
            isLoading={contextLoading}
          />
          
          {/* Embed Application Form - routes to dedicated outbound agent */}
          <EmbedApplicationForm 
            clientName={clientName} 
            onSubmitSuccess={handleSubmissionSuccess}
          />
          
        </div>
      </div>
      <ZipRecruiterPixel />
    </div>
  );
};

export default EmbedApply;
