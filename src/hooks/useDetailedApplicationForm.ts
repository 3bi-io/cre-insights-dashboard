import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { normalizePhoneNumber } from '@/utils/phoneNormalizer';
import { format } from 'date-fns';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { useClientFieldConfig } from '@/hooks/useClientFieldConfig';
import { logger } from '@/lib/logger';

export interface EmployerEntry {
  companyName: string;
  phone: string;
  startDate: string;
  endDate: string;
  city: string;
  state: string;
}

// Serializable version for localStorage (dates as strings)
interface SerializableFormData extends Omit<DetailedFormData, 
  'dateOfBirth' | 'cdlExpirationDate' | 'militaryStartDate' | 'militaryEndDate' | 
  'preferredStartDate' | 'medicalCardExpiration' | 'dotPhysicalDate'
> {
  dateOfBirth: string | null;
  cdlExpirationDate: string | null;
  militaryStartDate: string | null;
  militaryEndDate: string | null;
  preferredStartDate: string | null;
  medicalCardExpiration: string | null;
  dotPhysicalDate: string | null;
}

export interface DetailedFormData {
  // Personal Information
  prefix: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  dateOfBirth: Date | null;
  ssn: string;
  governmentId: string;
  governmentIdType: string;
  
  // Contact Information
  email: string;
  phone: string;
  secondaryPhone: string;
  preferredContactMethod: string;
  
  // Address
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Emergency Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  
  // CDL & Licensing
  cdl: string;
  cdlClass: string;
  cdlEndorsements: string[];
  cdlExpirationDate: Date | null;
  cdlState: string;
  drivingExperienceYears: string;
  
  // Experience & Background
  experience: string;
  accidentHistory: string;
  violationHistory: string;
  employers: EmployerEntry[];
  educationLevel: string;
  
  // Military Service
  militaryService: string;
  militaryBranch: string;
  militaryStartDate: Date | null;
  militaryEndDate: Date | null;
  veteranStatus: string;
  
  // Background & Legal
  convictedFelony: string;
  felonyDetails: string;
  workAuthorization: string;
  
  // Work Preferences
  canWorkWeekends: string;
  canWorkNights: string;
  willingToRelocate: string;
  preferredStartDate: Date | null;
  salaryExpectations: string;
  
  // Medical & Certifications
  medicalCardExpiration: Date | null;
  hazmatEndorsement: string;
  passportCard: string;
  twicCard: string;
  dotPhysicalDate: Date | null;
  
  // Application Details
  howDidYouHear: string;
  referralSource: string;
  
  // Consents & Agreements
  over21: string;
  canPassDrugTest: string;
  canPassPhysical: string;
  drugConsent: boolean;
  dataConsent: boolean;
  ageVerification: boolean;
  agreePrivacyPolicy: boolean;
  consentToSms: boolean;
  consentToEmail: boolean;
  backgroundCheckConsent: boolean;
}

const initialFormData: DetailedFormData = {
  // Personal Information
  prefix: '',
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  dateOfBirth: null,
  ssn: '',
  governmentId: '',
  governmentIdType: 'drivers_license',
  
  // Contact Information
  email: '',
  phone: '',
  secondaryPhone: '',
  preferredContactMethod: 'phone',
  
  // Address
  address1: '',
  address2: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'US',
  
  // Emergency Contact
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: '',
  
  // CDL & Licensing
  cdl: '',
  cdlClass: '',
  cdlEndorsements: [],
  cdlExpirationDate: null,
  cdlState: '',
  drivingExperienceYears: '',
  
  // Experience & Background
  experience: '',
  accidentHistory: '',
  violationHistory: '',
  employers: [
    { companyName: '', phone: '', startDate: '', endDate: '', city: '', state: '' },
    { companyName: '', phone: '', startDate: '', endDate: '', city: '', state: '' },
    { companyName: '', phone: '', startDate: '', endDate: '', city: '', state: '' },
  ],
  educationLevel: '',
  
  // Military Service
  militaryService: '',
  militaryBranch: '',
  militaryStartDate: null,
  militaryEndDate: null,
  veteranStatus: '',
  
  // Background & Legal
  convictedFelony: '',
  felonyDetails: '',
  workAuthorization: '',
  
  // Work Preferences
  canWorkWeekends: '',
  canWorkNights: '',
  willingToRelocate: '',
  preferredStartDate: null,
  salaryExpectations: '',
  
  // Medical & Certifications
  medicalCardExpiration: null,
  hazmatEndorsement: '',
  passportCard: '',
  twicCard: '',
  dotPhysicalDate: null,
  
  // Application Details
  howDidYouHear: '',
  referralSource: '',
  
  // Consents & Agreements
  over21: '',
  canPassDrugTest: '',
  canPassPhysical: '',
  drugConsent: false,
  dataConsent: false,
  ageVerification: false,
  agreePrivacyPolicy: false,
  consentToSms: false,
  consentToEmail: false,
  backgroundCheckConsent: false,
};

// Helper to convert form data for storage
const serializeFormData = (data: DetailedFormData): SerializableFormData => ({
  ...data,
  dateOfBirth: data.dateOfBirth?.toISOString() || null,
  cdlExpirationDate: data.cdlExpirationDate?.toISOString() || null,
  militaryStartDate: data.militaryStartDate?.toISOString() || null,
  militaryEndDate: data.militaryEndDate?.toISOString() || null,
  preferredStartDate: data.preferredStartDate?.toISOString() || null,
  medicalCardExpiration: data.medicalCardExpiration?.toISOString() || null,
  dotPhysicalDate: data.dotPhysicalDate?.toISOString() || null,
});

// Helper to restore form data from storage
const deserializeFormData = (data: SerializableFormData): DetailedFormData => ({
  ...data,
  dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
  cdlExpirationDate: data.cdlExpirationDate ? new Date(data.cdlExpirationDate) : null,
  militaryStartDate: data.militaryStartDate ? new Date(data.militaryStartDate) : null,
  militaryEndDate: data.militaryEndDate ? new Date(data.militaryEndDate) : null,
  preferredStartDate: data.preferredStartDate ? new Date(data.preferredStartDate) : null,
  medicalCardExpiration: data.medicalCardExpiration ? new Date(data.medicalCardExpiration) : null,
  dotPhysicalDate: data.dotPhysicalDate ? new Date(data.dotPhysicalDate) : null,
});

export const useDetailedApplicationForm = (clientLogoUrl?: string | null, clientId?: string | null) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const jobId = searchParams.get('job_id') || searchParams.get('job_listing_id') || searchParams.get('jobId') || searchParams.get('job');
  const { isFieldRequired } = useClientFieldConfig(clientId ?? null);
  
  // Support app_id from URL query params (SMS verification link flow)
  const appIdFromUrl = searchParams.get('app_id') || searchParams.get('appId');

  // Check for prefill data from quick-apply route state
  const prefillData = (location.state as { prefill?: Record<string, unknown> } | null)?.prefill;
  
  // Track existing application ID for update mode (from short form → thank you → detailed, or SMS link)
  const existingApplicationId = appIdFromUrl || (prefillData?.applicationId as string) || null;

  const [formData, setFormData] = useState<DetailedFormData>(() => {
    if (!prefillData) return initialFormData;
    return {
      ...initialFormData,
      firstName: (prefillData.firstName as string) || '',
      lastName: (prefillData.lastName as string) || '',
      email: (prefillData.email as string) || '',
      phone: (prefillData.phone as string) || '',
      city: (prefillData.city as string) || '',
      state: (prefillData.state as string) || '',
      zipCode: (prefillData.zip as string) || '',
      cdl: (prefillData.cdl as string) || '',
      cdlClass: (prefillData.cdlClass as string) || '',
      cdlEndorsements: (prefillData.cdlEndorsements as string[]) || [],
      experience: (prefillData.experience as string) || '',
      canPassDrugTest: (prefillData.drug as string) || '',
      consentToSms: prefillData.consent === 'yes' || prefillData.consent === 'Yes',
      over21: (prefillData.over21 as string) || '',
      veteranStatus: (prefillData.veteran as string) || '',
    };
  });

  // Fetch existing application data when arriving via SMS link (app_id in URL)
  // Uses edge function to bypass RLS — anonymous users can't query applications directly
  useEffect(() => {
    if (!appIdFromUrl || prefillData) return; // Skip if we already have prefill data from route state
    
    const fetchExistingApplication = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/get-application-prefill`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${anonKey}`,
            },
            body: JSON.stringify({ app_id: appIdFromUrl }),
          }
        );
        
        if (!response.ok) {
          logger.warn('Failed to fetch application for SMS prefill', { status: response.status });
          return;
        }
        
        const { data } = await response.json();
        if (!data) {
          logger.warn('No data returned for SMS prefill');
          return;
        }

        setFormData(prev => ({
          ...prev,
          firstName: data.first_name || prev.firstName,
          lastName: data.last_name || prev.lastName,
          email: data.applicant_email || prev.email,
          phone: data.phone || prev.phone,
          city: data.city || prev.city,
          state: data.state || prev.state,
          zipCode: data.zip || prev.zipCode,
          address1: data.address_1 || prev.address1,
          address2: data.address_2 || prev.address2,
          country: data.country || prev.country,
          cdl: data.cdl || prev.cdl,
          cdlClass: data.cdl_class || prev.cdlClass,
          cdlEndorsements: data.cdl_endorsements || prev.cdlEndorsements,
          experience: data.exp || prev.experience,
          consentToSms: data.consent_to_sms === 'yes',
          over21: data.over_21 || prev.over21,
          veteranStatus: data.veteran || prev.veteranStatus,
        }));

        logger.info('Pre-filled detailed form from existing application via SMS link');
      } catch (err) {
        logger.error('Error fetching application for SMS prefill', err as Error);
      }
    };

    fetchExistingApplication();
  }, [appIdFromUrl, prefillData]);
  
  // Serializable version for persistence
  const [serializedData, setSerializedData] = useState<SerializableFormData>(() => 
    serializeFormData(initialFormData)
  );

  // Sync serialized data when form data changes
  const handleFormUpdate = useCallback((newData: DetailedFormData) => {
    setFormData(newData);
    setSerializedData(serializeFormData(newData));
  }, []);

  // Form persistence for auto-save
  const {
    hasDraft,
    lastSaved,
    restoreDraft: restoreSerializedDraft,
    clearDraft,
    discardDraft,
  } = useFormPersistence(serializedData, (data) => {
    const restored = deserializeFormData(data);
    setFormData(restored);
    setSerializedData(data);
  }, {
    key: 'detailed_application',
    expiryHours: 48, // Longer expiry for detailed form
  });

  // Wrap restoreDraft to handle deserialization
  const restoreDraft = useCallback(() => {
    const success = restoreSerializedDraft();
    return success;
  }, [restoreSerializedDraft]);

  const handleInputChange = useCallback((field: string, value: unknown) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      setSerializedData(serializeFormData(newData));
      return newData;
    });
  }, []);

  const handleEndorsementToggle = useCallback((endorsement: string) => {
    setFormData(prev => {
      const currentEndorsements = prev.cdlEndorsements;
      if (currentEndorsements.includes(endorsement)) {
        return { ...prev, cdlEndorsements: currentEndorsements.filter(e => e !== endorsement) };
      } else {
        return { ...prev, cdlEndorsements: [...currentEndorsements, endorsement] };
      }
    });
  }, []);

  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1: {
        const base = !!(formData.firstName && formData.lastName);
        if (!base) return false;
        if (isFieldRequired('dateOfBirth') && !formData.dateOfBirth) return false;
        if (isFieldRequired('ssn') && !formData.ssn) return false;
        return true;
      }
      case 2: {
        const base = !!(formData.email && formData.phone);
        if (!base) return false;
        if (isFieldRequired('address1') && !formData.address1) return false;
        return true;
      }
      case 3: {
        if (!formData.cdl) return false;
        if (isFieldRequired('experience') && !formData.experience) return false;
        if (formData.cdl === 'yes' && isFieldRequired('cdlClass') && !formData.cdlClass) return false;
        if (isFieldRequired('medicalCardExpiration') && !formData.medicalCardExpiration) return false;
        if (isFieldRequired('accidentHistory') && !formData.accidentHistory) return false;
        if (isFieldRequired('violationHistory') && !formData.violationHistory) return false;
        return true;
      }
      case 4: {
        if (isFieldRequired('employers')) {
          const hasEmployer = formData.employers.some(e => e.companyName && e.startDate && e.endDate);
          if (!hasEmployer) return false;
        }
        return true;
      }
      case 5: {
        if (isFieldRequired('convictedFelony') && !formData.convictedFelony) return false;
        return true;
      }
      case 6:
        return !!(formData.drugConsent && formData.dataConsent && formData.ageVerification && formData.agreePrivacyPolicy && formData.backgroundCheckConsent);
      default:
        return true;
    }
  }, [formData, isFieldRequired]);

  const submitApplication = useMutation({
    mutationFn: async (data: DetailedFormData) => {
      // Capture URL tracking parameters
      const getParam = (...names: string[]): string | undefined => {
        for (const name of names) {
          const value = searchParams.get(name);
          if (value) return value;
        }
        return undefined;
      };

      // Build application payload matching edge function schema
      const applicationData: Record<string, unknown> = {
        // If we have an existing application from the short form, send it for update mode
        existing_application_id: existingApplicationId || undefined,
        
        // Required fields
        first_name: data.firstName,
        last_name: data.lastName,
        applicant_email: data.email,
        phone: normalizePhoneNumber(data.phone),
        
        // Job reference - pass both for resolution by edge function
        job_listing_id: jobId || undefined,
        job_id: jobId || undefined,
        
        // URL tracking parameters (source attribution)
        utm_source: getParam('utm_source', 'utmSource', 'source'),
        utm_medium: getParam('utm_medium', 'utmMedium', 'medium'),
        utm_campaign: getParam('utm_campaign', 'utmCampaign', 'campaign_name'),
        ad_id: getParam('ad_id', 'adId', 'AdID', 'ad'),
        campaign_id: getParam('campaign_id', 'campaignId', 'CampaignID', 'campaign'),
        adset_id: getParam('adset_id', 'adsetId', 'AdsetID', 'adset'),
        organization_id: getParam('organization_id', 'organizationId', 'org_id'),
        client_id: getParam('client_id', 'clientId'),
        referral_source: document.referrer || undefined,
        fbclid: getParam('fbclid') || undefined,
        gclid: getParam('gclid') || undefined,
        
        // Location
        city: data.city || undefined,
        state: data.state || undefined,
        zip: data.zipCode || undefined,
        address_1: data.address1 || undefined,
        address_2: data.address2 || undefined,
        country: data.country || 'US',
        
        // Personal extended fields
        prefix: data.prefix || undefined,
        middle_name: data.middleName || undefined,
        suffix: data.suffix || undefined,
        date_of_birth: data.dateOfBirth ? format(data.dateOfBirth, 'yyyy-MM-dd') : undefined,
        ssn: data.ssn || undefined,
        government_id: data.governmentId || undefined,
        government_id_type: data.governmentIdType || undefined,
        
        // Secondary contact
        secondary_phone: normalizePhoneNumber(data.secondaryPhone) || undefined,
        preferred_contact_method: data.preferredContactMethod || undefined,
        
        // Emergency contact
        emergency_contact_name: data.emergencyContactName || undefined,
        emergency_contact_phone: normalizePhoneNumber(data.emergencyContactPhone) || undefined,
        emergency_contact_relationship: data.emergencyContactRelationship || undefined,
        
        // CDL & Experience
        cdl: data.cdl || undefined,
        cdl_class: data.cdlClass || undefined,
        cdl_endorsements: data.cdlEndorsements.length > 0 ? data.cdlEndorsements : undefined,
        cdl_expiration_date: data.cdlExpirationDate ? format(data.cdlExpirationDate, 'yyyy-MM-dd') : undefined,
        cdl_state: data.cdlState || undefined,
        driving_experience_years: data.drivingExperienceYears ? parseInt(data.drivingExperienceYears) : undefined,
        exp: data.experience || undefined,
        
        // Background
        accident_history: data.accidentHistory || undefined,
        violation_history: data.violationHistory || undefined,
        employment_history: data.employers.some(e => e.companyName) ? JSON.stringify(data.employers.filter(e => e.companyName)) : undefined,
        education_level: data.educationLevel || undefined,
        
        // Military
        military_service: data.militaryService || undefined,
        military_branch: data.militaryBranch || undefined,
        military_start_date: data.militaryStartDate ? format(data.militaryStartDate, 'yyyy-MM-dd') : undefined,
        military_end_date: data.militaryEndDate ? format(data.militaryEndDate, 'yyyy-MM-dd') : undefined,
        veteran: data.veteranStatus || undefined,
        
        // Legal & Background
        convicted_felony: data.convictedFelony || undefined,
        felony_details: data.felonyDetails || undefined,
        work_authorization: data.workAuthorization || undefined,
        
        // Work preferences
        can_work_weekends: data.canWorkWeekends || undefined,
        can_work_nights: data.canWorkNights || undefined,
        willing_to_relocate: data.willingToRelocate || undefined,
        preferred_start_date: data.preferredStartDate ? format(data.preferredStartDate, 'yyyy-MM-dd') : undefined,
        salary_expectations: data.salaryExpectations || undefined,
        
        // Medical & Certifications
        medical_card_expiration: data.medicalCardExpiration ? format(data.medicalCardExpiration, 'yyyy-MM-dd') : undefined,
        hazmat_endorsement: data.hazmatEndorsement || undefined,
        passport_card: data.passportCard || undefined,
        twic_card: data.twicCard || undefined,
        dot_physical_date: data.dotPhysicalDate ? format(data.dotPhysicalDate, 'yyyy-MM-dd') : undefined,
        
        // Application details
        how_did_you_hear: data.howDidYouHear || undefined,
        
        // Consents (convert booleans to strings for consistency)
        over21: data.over21 || undefined,
        can_pass_drug_test: data.canPassDrugTest || undefined,
        can_pass_physical: data.canPassPhysical || undefined,
        drug: data.drugConsent ? 'yes' : 'no',
        consent: data.dataConsent ? 'yes' : 'no',
        agree_privacy_policy: data.agreePrivacyPolicy ? 'yes' : 'no',
        consent_to_sms: data.consentToSms ? 'yes' : 'no',
        consent_to_email: data.consentToEmail ? 'yes' : 'no',
        background_check_consent: data.backgroundCheckConsent ? 'yes' : 'no',
      };

      // Call the edge function instead of direct insert
      const response = await fetch(
        'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/submit-application',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(applicationData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(result.error || 'You have already applied recently.');
        }
        throw new Error(result.error || 'Failed to submit application');
      }

      return result;
    },
    onSuccess: (data) => {
      // Clear draft on successful submission
      clearDraft();
      toast({
        title: "Application Submitted Successfully!",
        description: "Thank you for your detailed application. We'll review it and be in touch soon.",
      });
      navigate('/thank-you', {
        state: {
          organizationName: data.organizationName,
          organizationId: data.organizationId,
          hasVoiceAgent: data.hasVoiceAgent,
          logoUrl: clientLogoUrl,
          source: searchParams.get('utm_source') || searchParams.get('utmSource') || searchParams.get('source') || '',
          clientId: searchParams.get('client_id') || searchParams.get('clientId') || '',
        }
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
      logger.error('Application submission error', error);
    },
  });

  const handleSubmit = useCallback(() => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.drugConsent || !formData.dataConsent || !formData.ageVerification) {
      toast({
        title: "Consent Required",
        description: "Please agree to all required consents.",
        variant: "destructive",
      });
      return;
    }

    submitApplication.mutate(formData);
  }, [formData, toast, submitApplication]);

  return {
    formData,
    handleInputChange,
    handleEndorsementToggle,
    handleSubmit,
    validateStep,
    isSubmitting: submitApplication.isPending,
    jobId,
    // Draft persistence
    hasDraft,
    lastSaved,
    restoreDraft,
    discardDraft,
  };
};
