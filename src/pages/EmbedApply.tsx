import React, { useEffect, useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ApplicationHeader } from '@/components/apply/ApplicationHeader';
import { ApplicationForm } from '@/components/apply/ApplicationForm';
import { EmbedThankYou } from '@/components/apply/EmbedThankYou';
import { useEmbedMode } from '@/hooks/useEmbedMode';
import { useApplyContext } from '@/hooks/useApplyContext';

interface SubmissionResult {
  applicationId: string;
  organizationName?: string;
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
  const { organizationName, jobTitle, isLoading: contextLoading } = useApplyContext();
  
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
    setSubmissionResult(result);
    setIsSubmitted(true);
    
    // Notify parent window
    notifyParent({
      type: 'application_submitted',
      applicationId: result.applicationId,
      organizationName: result.organizationName,
    });
  }, [notifyParent]);

  // If submitted, show inline thank you
  if (isSubmitted && submissionResult) {
    return (
      <div className="min-h-screen bg-background px-6 sm:px-4">
        <EmbedThankYou
          applicationId={submissionResult.applicationId}
          organizationName={submissionResult.organizationName}
          hasVoiceAgent={submissionResult.hasVoiceAgent}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="container mx-auto px-6 sm:px-4 py-4 sm:py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header with org/job branding */}
          <ApplicationHeader />
          
          {/* Application Form */}
          <ApplicationForm organizationName={organizationName} />
          
        </div>
      </div>
    </div>
  );
};

export default EmbedApply;
