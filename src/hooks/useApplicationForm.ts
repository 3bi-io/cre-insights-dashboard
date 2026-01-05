import { useState, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { normalizePhoneNumber } from '@/utils/phoneNormalizer';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zip: string;
  over21: string;
  cdl: string;
  experience: string;
  drug: string;
  veteran: string;
  consent: string;
  privacy: string;
  // URL tracking parameters
  ad_id: string;
  campaign_id: string;
  adset_id: string;
  job_listing_id: string;
  job_id: string;
  org_slug: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  referral_source: string;
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  city: '',
  state: '',
  zip: '',
  over21: '',
  cdl: '',
  experience: '',
  drug: '',
  veteran: '',
  consent: '',
  privacy: '',
  // URL tracking parameters
  ad_id: '',
  campaign_id: '',
  adset_id: '',
  job_listing_id: '',
  job_id: '',
  org_slug: '',
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
  referral_source: '',
};

interface SubmitResponse {
  message: string;
  applicationId: string;
  organizationName?: string;
  hasVoiceAgent?: boolean;
}

export const useApplicationForm = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Capture URL parameters on mount (case-insensitive for common variations)
  useEffect(() => {
    // Helper to get param with case variations
    const getParam = (...names: string[]): string => {
      for (const name of names) {
        const value = searchParams.get(name);
        if (value) return value;
      }
      return '';
    };

    const urlParams: Partial<FormData> = {
      ad_id: getParam('ad_id', 'adId', 'AdID', 'ad'),
      campaign_id: getParam('campaign_id', 'campaignId', 'CampaignID', 'campaign'),
      adset_id: getParam('adset_id', 'adsetId', 'AdsetID', 'adset'),
      job_listing_id: getParam('job_listing_id', 'jobListingId', 'JobListingID', 'job', 'job_id', 'jobId'),
      job_id: getParam('job_id', 'jobId', 'JobID'),
      org_slug: getParam('org', 'organization', 'org_slug'),
      utm_source: getParam('utm_source', 'utmSource', 'source'),
      utm_medium: getParam('utm_medium', 'utmMedium', 'medium'),
      utm_campaign: getParam('utm_campaign', 'utmCampaign', 'campaign_name'),
      referral_source: document.referrer || '',
    };

    setFormData(prev => ({ ...prev, ...urlParams }));
  }, [searchParams]);

  // Calculate current step based on filled fields
  useEffect(() => {
    const hasPersonalInfo = formData.firstName && formData.lastName && formData.email && formData.phone && formData.zip && formData.over21;
    const hasCDLInfo = formData.cdl && formData.experience;
    const hasBackgroundInfo = formData.drug;
    const hasConsent = formData.consent && formData.privacy;

    if (hasConsent) setCurrentStep(4);
    else if (hasBackgroundInfo) setCurrentStep(4);
    else if (hasCDLInfo) setCurrentStep(3);
    else if (hasPersonalInfo) setCurrentStep(2);
    else setCurrentStep(1);
  }, [formData]);

  const getExperienceValue = useCallback((months: string) => {
    if (!months) return '';
    
    const monthsNum = parseInt(months);
    if (monthsNum < 3) {
      return 'Less than 3 months';
    } else {
      return 'More than 3 months';
    }
  }, []);

  const validateForm = useCallback((): boolean => {
    // Required personal fields
    if (!formData.firstName.trim()) {
      toast.error('Please enter your first name');
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error('Please enter your last name');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Please enter your email');
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error('Please enter your phone number');
      return false;
    }
    if (!formData.zip.trim()) {
      toast.error('Please enter your ZIP code');
      return false;
    }

    // Required screening fields
    const requiredFields = [
      { field: 'over21' as keyof FormData, label: 'age verification' },
      { field: 'cdl' as keyof FormData, label: 'CDL status' },
      { field: 'experience' as keyof FormData, label: 'experience' },
      { field: 'drug' as keyof FormData, label: 'drug test response' },
      { field: 'consent' as keyof FormData, label: 'SMS consent' },
      { field: 'privacy' as keyof FormData, label: 'privacy policy agreement' },
    ];

    for (const { field, label } of requiredFields) {
      if (!formData[field]) {
        toast.error(`Please select ${label}`);
        return false;
      }
    }

    return true;
  }, [formData]);

  const submitApplication = useMutation({
    mutationFn: async (data: FormData): Promise<SubmitResponse> => {
      // Calculate driving experience years from months
      const monthsNum = parseInt(data.experience) || 0;
      const drivingExperienceYears = Math.floor(monthsNum / 12);

      const formattedData = {
        ...data,
        phone: normalizePhoneNumber(data.phone),
        months: data.experience, // Store as numeric string
        exp: getExperienceValue(data.experience),
        driving_experience_years: drivingExperienceYears,
      };

      const response = await fetch('https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/submit-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle duplicate application (409 Conflict)
        if (response.status === 409) {
          throw new Error(errorData.error || 'You have already applied to this position recently.');
        }
        
        throw new Error(errorData.error || 'Failed to submit application');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Application submitted successfully! Check your email for confirmation.');
      navigate('/thank-you', { 
        state: { 
          organizationName: data.organizationName,
          hasVoiceAgent: data.hasVoiceAgent
        } 
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit application');
    },
  });

  const handleInputChange = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    submitApplication.mutate(formData);
  }, [formData, submitApplication, validateForm]);

  return {
    formData,
    handleInputChange,
    handleSubmit,
    isSubmitting: submitApplication.isPending,
    currentStep,
  };
};
