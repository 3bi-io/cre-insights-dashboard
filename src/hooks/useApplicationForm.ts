
import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
};

export const useApplicationForm = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const navigate = useNavigate();

  const formatPhoneNumber = useCallback((phone: string) => {
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length === 10) {
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    return `+1${digits}`;
  }, []);

  const getExperienceValue = useCallback((months: string) => {
    if (!months) return '';
    
    const monthsNum = parseInt(months);
    if (monthsNum < 3) {
      return 'Less than 3 months';
    } else {
      return 'More than 3 months';
    }
  }, []);

  const submitApplication = useMutation({
    mutationFn: async (data: FormData) => {
      const formattedData = {
        ...data,
        phone: formatPhoneNumber(data.phone),
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
    submitApplication.mutate(formData);
  }, [formData, submitApplication]);

  return {
    formData,
    handleInputChange,
    handleSubmit,
    isSubmitting: submitApplication.isPending,
  };
};
