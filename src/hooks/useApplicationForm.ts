
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
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
  referral_source: '',
};

export const useApplicationForm = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Capture URL parameters on mount
  useEffect(() => {
    const urlParams: Partial<FormData> = {
      ad_id: searchParams.get('ad_id') || '',
      campaign_id: searchParams.get('campaign_id') || '',
      adset_id: searchParams.get('adset_id') || '',
      job_listing_id: searchParams.get('job_listing_id') || '',
      job_id: searchParams.get('job_id') || '',
      utm_source: searchParams.get('utm_source') || '',
      utm_medium: searchParams.get('utm_medium') || '',
      utm_campaign: searchParams.get('utm_campaign') || '',
      referral_source: document.referrer || '',
    };

    setFormData(prev => ({ ...prev, ...urlParams }));
  }, [searchParams]);

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
    mutationFn: async (data: FormData) => {
      const formattedData = {
        ...data,
        phone: normalizePhoneNumber(data.phone),
        months: data.experience,
        exp: getExperienceValue(data.experience),
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
        throw new Error(errorData.error || 'Failed to submit application');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Application submitted successfully!');
      navigate('/thank-you');
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
  };
};
