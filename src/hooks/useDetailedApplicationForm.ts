import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { normalizePhoneNumber } from '@/utils/phoneNormalizer';
import { format } from 'date-fns';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { logger } from '@/lib/logger';

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
  employmentHistory: string;
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
  employmentHistory: '',
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

export const useDetailedApplicationForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const jobId = searchParams.get('job');

  const [formData, setFormData] = useState<DetailedFormData>(initialFormData);
  
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
      case 1:
        return !!(formData.firstName && formData.lastName);
      case 2:
        return !!(formData.email && formData.phone);
      case 3:
        return !!formData.cdl;
      case 4:
        return true; // Experience section is optional
      case 5:
        return true; // Background section is optional
      case 6:
        return !!(formData.drugConsent && formData.dataConsent && formData.ageVerification && formData.agreePrivacyPolicy && formData.backgroundCheckConsent);
      default:
        return true;
    }
  }, [formData]);

  const submitApplication = useMutation({
    mutationFn: async (data: DetailedFormData) => {
      const applicationData = {
        prefix: data.prefix || null,
        first_name: data.firstName,
        middle_name: data.middleName || null,
        last_name: data.lastName,
        suffix: data.suffix || null,
        date_of_birth: data.dateOfBirth ? format(data.dateOfBirth, 'yyyy-MM-dd') : null,
        ssn: data.ssn || null,
        government_id: data.governmentId || null,
        government_id_type: data.governmentIdType || null,
        
        applicant_email: data.email,
        phone: normalizePhoneNumber(data.phone),
        secondary_phone: normalizePhoneNumber(data.secondaryPhone),
        preferred_contact_method: data.preferredContactMethod,
        
        address_1: data.address1 || null,
        address_2: data.address2 || null,
        city: data.city || null,
        state: data.state || null,
        zip: data.zipCode || null,
        country: data.country,
        
        emergency_contact_name: data.emergencyContactName || null,
        emergency_contact_phone: normalizePhoneNumber(data.emergencyContactPhone),
        emergency_contact_relationship: data.emergencyContactRelationship || null,
        
        cdl: data.cdl,
        cdl_class: data.cdlClass || null,
        cdl_endorsements: data.cdlEndorsements.length > 0 ? data.cdlEndorsements : null,
        cdl_expiration_date: data.cdlExpirationDate ? format(data.cdlExpirationDate, 'yyyy-MM-dd') : null,
        cdl_state: data.cdlState || null,
        driving_experience_years: data.drivingExperienceYears ? parseInt(data.drivingExperienceYears) : null,
        
        exp: data.experience,
        accident_history: data.accidentHistory || null,
        violation_history: data.violationHistory || null,
        employment_history: data.employmentHistory ? data.employmentHistory : null,
        education_level: data.educationLevel || null,
        
        military_service: data.militaryService || null,
        military_branch: data.militaryBranch || null,
        military_start_date: data.militaryStartDate ? format(data.militaryStartDate, 'yyyy-MM-dd') : null,
        military_end_date: data.militaryEndDate ? format(data.militaryEndDate, 'yyyy-MM-dd') : null,
        veteran: data.veteranStatus || null,
        
        convicted_felony: data.convictedFelony || null,
        felony_details: data.felonyDetails || null,
        work_authorization: data.workAuthorization || null,
        
        can_work_weekends: data.canWorkWeekends || null,
        can_work_nights: data.canWorkNights || null,
        willing_to_relocate: data.willingToRelocate || null,
        preferred_start_date: data.preferredStartDate ? format(data.preferredStartDate, 'yyyy-MM-dd') : null,
        salary_expectations: data.salaryExpectations || null,
        
        medical_card_expiration: data.medicalCardExpiration ? format(data.medicalCardExpiration, 'yyyy-MM-dd') : null,
        hazmat_endorsement: data.hazmatEndorsement || null,
        passport_card: data.passportCard || null,
        twic_card: data.twicCard || null,
        dot_physical_date: data.dotPhysicalDate ? format(data.dotPhysicalDate, 'yyyy-MM-dd') : null,
        
        how_did_you_hear: data.howDidYouHear || null,
        referral_source: data.referralSource || null,
        
        over_21: data.over21,
        can_pass_drug_test: data.canPassDrugTest,
        can_pass_physical: data.canPassPhysical,
        drug: data.drugConsent ? 'yes' : 'no',
        consent: data.dataConsent ? 'yes' : 'no',
        age: data.ageVerification ? 'yes' : 'no',
        agree_privacy_policy: data.agreePrivacyPolicy ? 'yes' : 'no',
        consent_to_sms: data.consentToSms ? 'yes' : 'no',
        consent_to_email: data.consentToEmail ? 'yes' : 'no',
        background_check_consent: data.backgroundCheckConsent ? 'yes' : 'no',
        
        job_id: jobId,
        status: 'pending',
        applied_at: new Date().toISOString(),
        source: 'Detailed Application Form',
      };

      const { error } = await supabase
        .from('applications')
        .insert([applicationData]);

      if (error) throw error;
    },
    onSuccess: () => {
      // Clear draft on successful submission
      clearDraft();
      toast({
        title: "Application Submitted Successfully!",
        description: "Thank you for your detailed application. We'll review it and be in touch soon.",
      });
      navigate('/apply/success');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
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
