import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { normalizePhoneNumber } from '@/utils/phoneNormalizer';
import { 
  Truck, 
  User, 
  MapPin, 
  FileText, 
  Shield, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle
} from 'lucide-react';

const TOTAL_STEPS = 6;

const DetailedApply = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const jobId = searchParams.get('job');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Information
    prefix: '',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    dateOfBirth: null as Date | null,
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
    cdlEndorsements: [] as string[],
    cdlExpirationDate: null as Date | null,
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
    militaryStartDate: null as Date | null,
    militaryEndDate: null as Date | null,
    veteranStatus: '',
    
    // Background & Legal
    convictedFelony: '',
    felonyDetails: '',
    workAuthorization: '',
    
    // Work Preferences
    canWorkWeekends: '',
    canWorkNights: '',
    willingToRelocate: '',
    preferredStartDate: null as Date | null,
    salaryExpectations: '',
    
    // Medical & Certifications
    medicalCardExpiration: null as Date | null,
    hazmatEndorsement: '',
    passportCard: '',
    twicCard: '',
    dotPhysicalDate: null as Date | null,
    
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
  });

  const submitApplication = useMutation({
    mutationFn: async (data: typeof formData) => {
      const applicationData = {
        // Basic info
        prefix: data.prefix || null,
        first_name: data.firstName,
        middle_name: data.middleName || null,
        last_name: data.lastName,
        suffix: data.suffix || null,
        date_of_birth: data.dateOfBirth ? format(data.dateOfBirth, 'yyyy-MM-dd') : null,
        ssn: data.ssn || null,
        government_id: data.governmentId || null,
        government_id_type: data.governmentIdType || null,
        
        // Contact
        applicant_email: data.email,
        phone: normalizePhoneNumber(data.phone),
        secondary_phone: normalizePhoneNumber(data.secondaryPhone),
        preferred_contact_method: data.preferredContactMethod,
        
        // Address
        address_1: data.address1 || null,
        address_2: data.address2 || null,
        city: data.city || null,
        state: data.state || null,
        zip: data.zipCode || null,
        country: data.country,
        
        // Emergency contact
        emergency_contact_name: data.emergencyContactName || null,
        emergency_contact_phone: normalizePhoneNumber(data.emergencyContactPhone),
        emergency_contact_relationship: data.emergencyContactRelationship || null,
        
        // CDL & License
        cdl: data.cdl,
        cdl_class: data.cdlClass || null,
        cdl_endorsements: data.cdlEndorsements.length > 0 ? data.cdlEndorsements : null,
        cdl_expiration_date: data.cdlExpirationDate ? format(data.cdlExpirationDate, 'yyyy-MM-dd') : null,
        cdl_state: data.cdlState || null,
        driving_experience_years: data.drivingExperienceYears ? parseInt(data.drivingExperienceYears) : null,
        
        // Experience
        exp: data.experience,
        accident_history: data.accidentHistory || null,
        violation_history: data.violationHistory || null,
        employment_history: data.employmentHistory ? data.employmentHistory : null,
        education_level: data.educationLevel || null,
        
        // Military
        military_service: data.militaryService || null,
        military_branch: data.militaryBranch || null,
        military_start_date: data.militaryStartDate ? format(data.militaryStartDate, 'yyyy-MM-dd') : null,
        military_end_date: data.militaryEndDate ? format(data.militaryEndDate, 'yyyy-MM-dd') : null,
        veteran: data.veteranStatus || null,
        
        // Background
        convicted_felony: data.convictedFelony || null,
        felony_details: data.felonyDetails || null,
        work_authorization: data.workAuthorization || null,
        
        // Work preferences
        can_work_weekends: data.canWorkWeekends || null,
        can_work_nights: data.canWorkNights || null,
        willing_to_relocate: data.willingToRelocate || null,
        preferred_start_date: data.preferredStartDate ? format(data.preferredStartDate, 'yyyy-MM-dd') : null,
        salary_expectations: data.salaryExpectations || null,
        
        // Medical & Certifications
        medical_card_expiration: data.medicalCardExpiration ? format(data.medicalCardExpiration, 'yyyy-MM-dd') : null,
        hazmat_endorsement: data.hazmatEndorsement || null,
        passport_card: data.passportCard || null,
        twic_card: data.twicCard || null,
        dot_physical_date: data.dotPhysicalDate ? format(data.dotPhysicalDate, 'yyyy-MM-dd') : null,
        
        // Application source
        how_did_you_hear: data.howDidYouHear || null,
        referral_source: data.referralSource || null,
        
        // Consents
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
        
        // Application metadata
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
      console.error('Application submission error:', error);
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    // Validate required fields
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
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const DatePickerField = ({ 
    label, 
    value, 
    onChange, 
    placeholder = "Select date" 
  }: { 
    label: string; 
    value: Date | null; 
    onChange: (date: Date | null) => void;
    placeholder?: string;
  }) => (
    <div>
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value || undefined}
            onSelect={(date) => onChange(date || null)}
            className="pointer-events-auto"
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="prefix">Prefix</Label>
                  <Select value={formData.prefix} onValueChange={(value) => handleInputChange('prefix', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mr">Mr.</SelectItem>
                      <SelectItem value="mrs">Mrs.</SelectItem>
                      <SelectItem value="ms">Ms.</SelectItem>
                      <SelectItem value="dr">Dr.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Your first name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    value={formData.middleName}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                    placeholder="Middle name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Your last name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="suffix">Suffix</Label>
                  <Select value={formData.suffix} onValueChange={(value) => handleInputChange('suffix', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jr">Jr.</SelectItem>
                      <SelectItem value="sr">Sr.</SelectItem>
                      <SelectItem value="ii">II</SelectItem>
                      <SelectItem value="iii">III</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DatePickerField
                  label="Date of Birth"
                  value={formData.dateOfBirth}
                  onChange={(date) => handleInputChange('dateOfBirth', date)}
                />
                <div>
                  <Label htmlFor="ssn">SSN (Last 4 digits)</Label>
                  <Input
                    id="ssn"
                    value={formData.ssn}
                    onChange={(e) => handleInputChange('ssn', e.target.value)}
                    placeholder="1234"
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="governmentId">Government ID Number</Label>
                  <Input
                    id="governmentId"
                    value={formData.governmentId}
                    onChange={(e) => handleInputChange('governmentId', e.target.value)}
                    placeholder="ID number"
                  />
                </div>
                <div>
                  <Label htmlFor="governmentIdType">ID Type</Label>
                  <Select value={formData.governmentIdType} onValueChange={(value) => handleInputChange('governmentIdType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drivers_license">Driver's License</SelectItem>
                      <SelectItem value="state_id">State ID</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Contact & Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Primary Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="secondaryPhone">Secondary Phone</Label>
                  <Input
                    id="secondaryPhone"
                    type="tel"
                    value={formData.secondaryPhone}
                    onChange={(e) => handleInputChange('secondaryPhone', e.target.value)}
                    placeholder="(555) 987-6543"
                  />
                </div>
                <div>
                  <Label htmlFor="preferredContactMethod">Preferred Contact Method</Label>
                  <Select value={formData.preferredContactMethod} onValueChange={(value) => handleInputChange('preferredContactMethod', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Primary Phone</SelectItem>
                      <SelectItem value="secondary_phone">Secondary Phone</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Home Address</h4>
                <div>
                  <Label htmlFor="address1">Address Line 1</Label>
                  <Input
                    id="address1"
                    value={formData.address1}
                    onChange={(e) => handleInputChange('address1', e.target.value)}
                    placeholder="123 Main Street"
                  />
                </div>
                <div>
                  <Label htmlFor="address2">Address Line 2</Label>
                  <Input
                    id="address2"
                    value={formData.address2}
                    onChange={(e) => handleInputChange('address2', e.target.value)}
                    placeholder="Apt, Suite, etc."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Your city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      placeholder="12345"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="MX">Mexico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="emergencyContactName">Full Name</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                      placeholder="Emergency contact name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactPhone">Phone Number</Label>
                    <Input
                      id="emergencyContactPhone"
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                    <Select value={formData.emergencyContactRelationship} onValueChange={(value) => handleInputChange('emergencyContactRelationship', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                CDL & Driving Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cdl">Do you have a CDL?</Label>
                  <Select value={formData.cdl} onValueChange={(value) => handleInputChange('cdl', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="experience">Commercial Driving Experience</Label>
                  <Select value={formData.experience} onValueChange={(value) => handleInputChange('experience', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no experience">No Experience</SelectItem>
                      <SelectItem value="less than 3 months">Less than 3 months</SelectItem>
                      <SelectItem value="3-6 months">3-6 months</SelectItem>
                      <SelectItem value="6-12 months">6-12 months</SelectItem>
                      <SelectItem value="1-2 years">1-2 years</SelectItem>
                      <SelectItem value="2-5 years">2-5 years</SelectItem>
                      <SelectItem value="5+ years">5+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.cdl === 'yes' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="cdlClass">CDL Class</Label>
                      <Select value={formData.cdlClass} onValueChange={(value) => handleInputChange('cdlClass', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">Class A</SelectItem>
                          <SelectItem value="B">Class B</SelectItem>
                          <SelectItem value="C">Class C</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="cdlState">CDL State</Label>
                      <Input
                        id="cdlState"
                        value={formData.cdlState}
                        onChange={(e) => handleInputChange('cdlState', e.target.value)}
                        placeholder="State abbreviation"
                        maxLength={2}
                      />
                    </div>
                    <DatePickerField
                      label="CDL Expiration Date"
                      value={formData.cdlExpirationDate}
                      onChange={(date) => handleInputChange('cdlExpirationDate', date)}
                    />
                  </div>

                  <div>
                    <Label>CDL Endorsements (select all that apply)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                      {['H', 'N', 'P', 'S', 'T', 'X'].map((endorsement) => (
                        <div key={endorsement} className="flex items-center space-x-2">
                          <Checkbox
                            id={`endorsement-${endorsement}`}
                            checked={formData.cdlEndorsements.includes(endorsement)}
                            onCheckedChange={(checked) => {
                              const currentEndorsements = formData.cdlEndorsements;
                              if (checked) {
                                handleInputChange('cdlEndorsements', [...currentEndorsements, endorsement]);
                              } else {
                                handleInputChange('cdlEndorsements', currentEndorsements.filter(e => e !== endorsement));
                              }
                            }}
                          />
                          <Label htmlFor={`endorsement-${endorsement}`}>{endorsement}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="drivingExperienceYears">Total Years of Driving Experience</Label>
                  <Input
                    id="drivingExperienceYears"
                    type="number"
                    min="0"
                    max="50"
                    value={formData.drivingExperienceYears}
                    onChange={(e) => handleInputChange('drivingExperienceYears', e.target.value)}
                    placeholder="Years"
                  />
                </div>
                <div>
                  <Label htmlFor="hazmatEndorsement">HAZMAT Endorsement</Label>
                  <Select value={formData.hazmatEndorsement} onValueChange={(value) => handleInputChange('hazmatEndorsement', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="willing_to_obtain">Willing to obtain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="accidentHistory">Accident History (last 3 years)</Label>
                  <Textarea
                    id="accidentHistory"
                    value={formData.accidentHistory}
                    onChange={(e) => handleInputChange('accidentHistory', e.target.value)}
                    placeholder="Please describe any accidents in the last 3 years, or enter 'None'"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="violationHistory">Moving Violation History (last 3 years)</Label>
                  <Textarea
                    id="violationHistory"
                    value={formData.violationHistory}
                    onChange={(e) => handleInputChange('violationHistory', e.target.value)}
                    placeholder="Please describe any moving violations in the last 3 years, or enter 'None'"
                    rows={3}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DatePickerField
                  label="Medical Card Expiration"
                  value={formData.medicalCardExpiration}
                  onChange={(date) => handleInputChange('medicalCardExpiration', date)}
                />
                <DatePickerField
                  label="Last DOT Physical"
                  value={formData.dotPhysicalDate}
                  onChange={(date) => handleInputChange('dotPhysicalDate', date)}
                />
                <div>
                  <Label htmlFor="twicCard">TWIC Card</Label>
                  <Select value={formData.twicCard} onValueChange={(value) => handleInputChange('twicCard', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="willing_to_obtain">Willing to obtain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Employment & Education History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="employmentHistory">Previous Employment</Label>
                <Textarea
                  id="employmentHistory"
                  value={formData.employmentHistory}
                  onChange={(e) => handleInputChange('employmentHistory', e.target.value)}
                  placeholder="Please describe your previous employment history, including company names, positions held, dates of employment, and reasons for leaving."
                  rows={4}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Describe your work history in detail
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="educationLevel">Education Level</Label>
                  <Select value={formData.educationLevel} onValueChange={(value) => handleInputChange('educationLevel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="less_than_high_school">Less than High School</SelectItem>
                      <SelectItem value="high_school">High School Diploma/GED</SelectItem>
                      <SelectItem value="some_college">Some College</SelectItem>
                      <SelectItem value="associates">Associate's Degree</SelectItem>
                      <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                      <SelectItem value="masters">Master's Degree</SelectItem>
                      <SelectItem value="doctorate">Doctorate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="workAuthorization">Work Authorization Status</Label>
                  <Select value={formData.workAuthorization} onValueChange={(value) => handleInputChange('workAuthorization', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us_citizen">US Citizen</SelectItem>
                      <SelectItem value="permanent_resident">Permanent Resident</SelectItem>
                      <SelectItem value="work_visa">Work Visa</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Military Service</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="militaryService">Military Service</Label>
                    <Select value={formData.militaryService} onValueChange={(value) => handleInputChange('militaryService', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="veteranStatus">Veteran Status</Label>
                    <Select value={formData.veteranStatus} onValueChange={(value) => handleInputChange('veteranStatus', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.militaryService === 'yes' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="militaryBranch">Branch of Service</Label>
                      <Select value={formData.militaryBranch} onValueChange={(value) => handleInputChange('militaryBranch', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="army">Army</SelectItem>
                          <SelectItem value="navy">Navy</SelectItem>
                          <SelectItem value="air_force">Air Force</SelectItem>
                          <SelectItem value="marines">Marines</SelectItem>
                          <SelectItem value="coast_guard">Coast Guard</SelectItem>
                          <SelectItem value="space_force">Space Force</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DatePickerField
                      label="Service Start Date"
                      value={formData.militaryStartDate}
                      onChange={(date) => handleInputChange('militaryStartDate', date)}
                    />
                    <DatePickerField
                      label="Service End Date"
                      value={formData.militaryEndDate}
                      onChange={(date) => handleInputChange('militaryEndDate', date)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Background & Work Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-semibold">Background Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="convictedFelony">Have you been convicted of a felony?</Label>
                    <Select value={formData.convictedFelony} onValueChange={(value) => handleInputChange('convictedFelony', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="passportCard">Passport Card</Label>
                    <Select value={formData.passportCard} onValueChange={(value) => handleInputChange('passportCard', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="willing_to_obtain">Willing to obtain</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.convictedFelony === 'yes' && (
                  <div>
                    <Label htmlFor="felonyDetails">Please provide details</Label>
                    <Textarea
                      id="felonyDetails"
                      value={formData.felonyDetails}
                      onChange={(e) => handleInputChange('felonyDetails', e.target.value)}
                      placeholder="Please describe the nature and date of conviction"
                      rows={3}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Work Preferences</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="canWorkWeekends">Can you work weekends?</Label>
                    <Select value={formData.canWorkWeekends} onValueChange={(value) => handleInputChange('canWorkWeekends', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="sometimes">Sometimes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="canWorkNights">Can you work nights?</Label>
                    <Select value={formData.canWorkNights} onValueChange={(value) => handleInputChange('canWorkNights', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="sometimes">Sometimes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="willingToRelocate">Willing to relocate?</Label>
                    <Select value={formData.willingToRelocate} onValueChange={(value) => handleInputChange('willingToRelocate', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="depends">Depends on location</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DatePickerField
                    label="Preferred Start Date"
                    value={formData.preferredStartDate}
                    onChange={(date) => handleInputChange('preferredStartDate', date)}
                  />
                  <div>
                    <Label htmlFor="salaryExpectations">Salary Expectations</Label>
                    <Input
                      id="salaryExpectations"
                      value={formData.salaryExpectations}
                      onChange={(e) => handleInputChange('salaryExpectations', e.target.value)}
                      placeholder="e.g., $50,000-$60,000"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">How did you hear about us?</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="howDidYouHear">Source</Label>
                    <Select value={formData.howDidYouHear} onValueChange={(value) => handleInputChange('howDidYouHear', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="job_board">Job Board</SelectItem>
                        <SelectItem value="company_website">Company Website</SelectItem>
                        <SelectItem value="social_media">Social Media</SelectItem>
                        <SelectItem value="referral">Employee Referral</SelectItem>
                        <SelectItem value="recruiter">Recruiter</SelectItem>
                        <SelectItem value="job_fair">Job Fair</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="referralSource">Referral Source (if applicable)</Label>
                    <Input
                      id="referralSource"
                      value={formData.referralSource}
                      onChange={(e) => handleInputChange('referralSource', e.target.value)}
                      placeholder="Name or source details"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Consents & Agreements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-semibold">Physical & Medical Requirements</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="over21">Are you over 21?</Label>
                    <Select value={formData.over21} onValueChange={(value) => handleInputChange('over21', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="canPassDrugTest">Can you pass a drug test?</Label>
                    <Select value={formData.canPassDrugTest} onValueChange={(value) => handleInputChange('canPassDrugTest', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="canPassPhysical">Can you pass a DOT physical?</Label>
                    <Select value={formData.canPassPhysical} onValueChange={(value) => handleInputChange('canPassPhysical', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Required Agreements *</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="drugConsent"
                      checked={formData.drugConsent}
                      onCheckedChange={(checked) => handleInputChange('drugConsent', checked as boolean)}
                    />
                    <Label htmlFor="drugConsent" className="text-sm">
                      I consent to drug screening as required by company policy *
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dataConsent"
                      checked={formData.dataConsent}
                      onCheckedChange={(checked) => handleInputChange('dataConsent', checked as boolean)}
                    />
                    <Label htmlFor="dataConsent" className="text-sm">
                      I consent to the collection and processing of my personal data for employment purposes *
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ageVerification"
                      checked={formData.ageVerification}
                      onCheckedChange={(checked) => handleInputChange('ageVerification', checked as boolean)}
                    />
                    <Label htmlFor="ageVerification" className="text-sm">
                      I certify that I am at least 18 years of age *
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agreePrivacyPolicy"
                      checked={formData.agreePrivacyPolicy}
                      onCheckedChange={(checked) => handleInputChange('agreePrivacyPolicy', checked as boolean)}
                    />
                    <Label htmlFor="agreePrivacyPolicy" className="text-sm">
                      I agree to the privacy policy and terms of service *
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="backgroundCheckConsent"
                      checked={formData.backgroundCheckConsent}
                      onCheckedChange={(checked) => handleInputChange('backgroundCheckConsent', checked as boolean)}
                    />
                    <Label htmlFor="backgroundCheckConsent" className="text-sm">
                      I consent to a background check and motor vehicle record check *
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Communication Preferences</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="consentToSms"
                      checked={formData.consentToSms}
                      onCheckedChange={(checked) => handleInputChange('consentToSms', checked as boolean)}
                    />
                    <Label htmlFor="consentToSms" className="text-sm">
                      I consent to receive SMS messages regarding my application
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="consentToEmail"
                      checked={formData.consentToEmail}
                      onCheckedChange={(checked) => handleInputChange('consentToEmail', checked as boolean)}
                    />
                    <Label htmlFor="consentToEmail" className="text-sm">
                      I consent to receive email communications regarding my application
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Truck className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Complete Application</h1>
          </div>
          <p className="text-muted-foreground">
            Please complete all sections to submit your comprehensive application.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {currentStep} of {TOTAL_STEPS}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
            >
              Cancel
            </Button>
            
            {currentStep < TOTAL_STEPS ? (
              <Button
                onClick={handleNext}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitApplication.isPending}
                className="flex items-center gap-2"
              >
                {submitApplication.isPending ? 'Submitting...' : 'Submit Application'}
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedApply;
