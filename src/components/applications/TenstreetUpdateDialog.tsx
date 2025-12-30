import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const updateSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  notes: z.string().optional(),
  // Personal Information
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  middleName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  ssn: z.string().optional(),
  gender: z.string().optional(),
  // Contact Information
  phoneNumber: z.string().optional(),
  alternatePhone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  // Address Information
  address: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  // Driver Information
  driverLicenseNumber: z.string().optional(),
  driverLicenseState: z.string().optional(),
  driverLicenseExpiration: z.string().optional(),
  cdlNumber: z.string().optional(),
  cdlState: z.string().optional(),
  cdlExpiration: z.string().optional(),
  cdlClass: z.string().optional(),
  endorsements: z.string().optional(),
  restrictions: z.string().optional(),
  // Experience Information
  yearsExperience: z.string().optional(),
  monthsExperience: z.string().optional(),
  truckingExperience: z.string().optional(),
  hazmatEndorsement: z.string().optional(),
  // Medical Information
  medicalCertExpiration: z.string().optional(),
  dotPhysicalExpiration: z.string().optional(),
  drugTestResult: z.string().optional(),
  lastDrugTest: z.string().optional(),
  // Background Information
  veteranStatus: z.string().optional(),
  felonyConviction: z.string().optional(),
  movingViolations: z.string().optional(),
  accidentHistory: z.string().optional(),
  // Employment Information
  currentEmployer: z.string().optional(),
  employmentStatus: z.string().optional(),
  desiredSalary: z.string().optional(),
  availableStartDate: z.string().optional(),
  willingToRelocate: z.string().optional(),
  preferredRoute: z.string().optional(),
  // Emergency Contact
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  // Consent and Agreement
  consentToContact: z.string().optional(),
  backgroundCheckConsent: z.string().optional(),
  drugTestConsent: z.string().optional(),
  privacyPolicyAccepted: z.string().optional(),
});

type UpdateFormData = z.infer<typeof updateSchema>;

interface TenstreetUpdateDialogProps {
  application: any;
  trigger?: React.ReactNode;
}

const TenstreetUpdateDialog: React.FC<TenstreetUpdateDialogProps> = ({ 
  application, 
  trigger 
}) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      status: application.status || 'pending',
      notes: application.notes || '',
      // Personal Information
      firstName: application.first_name || '',
      lastName: application.last_name || '',
      middleName: '',
      dateOfBirth: '',
      ssn: '',
      gender: '',
      // Contact Information
      phoneNumber: application.phone || '',
      alternatePhone: '',
      email: application.applicant_email || '',
      // Address Information
      address: '',
      address2: '',
      city: application.city || '',
      state: application.state || '',
      zipCode: application.zip || '',
      country: 'US',
      // Driver Information
      driverLicenseNumber: '',
      driverLicenseState: '',
      driverLicenseExpiration: '',
      cdlNumber: '',
      cdlState: '',
      cdlExpiration: '',
      cdlClass: '',
      endorsements: '',
      restrictions: '',
      // Experience Information
      yearsExperience: '',
      monthsExperience: application.months || '',
      truckingExperience: application.exp || '',
      hazmatEndorsement: '',
      // Medical Information
      medicalCertExpiration: '',
      dotPhysicalExpiration: '',
      drugTestResult: application.drug || '',
      lastDrugTest: '',
      // Background Information
      veteranStatus: application.veteran || '',
      felonyConviction: '',
      movingViolations: '',
      accidentHistory: '',
      // Employment Information
      currentEmployer: '',
      employmentStatus: '',
      desiredSalary: '',
      availableStartDate: '',
      willingToRelocate: '',
      preferredRoute: '',
      // Emergency Contact
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      // Consent and Agreement
      consentToContact: application.consent || '',
      backgroundCheckConsent: '',
      drugTestConsent: '',
      privacyPolicyAccepted: application.privacy || '',
    },
  });

  const onSubmit = async (data: UpdateFormData) => {
    setIsLoading(true);
    
    try {
      // Prepare the payload for Tenstreet integration
      const payload = {
        action: 'send_application',
        applicationData: {
          id: application.id,
          applicant_id: application.id,
          // Personal Information
          first_name: data.firstName || application.first_name,
          last_name: data.lastName || application.last_name,
          middle_name: data.middleName,
          date_of_birth: data.dateOfBirth,
          ssn: data.ssn,
          gender: data.gender,
          // Contact Information
          email: data.email || application.applicant_email,
          phone: data.phoneNumber || application.phone,
          alternate_phone: data.alternatePhone,
          // Address Information
          address: data.address,
          address2: data.address2,
          city: data.city || application.city,
          state: data.state || application.state,
          zip: data.zipCode || application.zip,
          country: data.country,
          // Driver Information
          driver_license_number: data.driverLicenseNumber,
          driver_license_state: data.driverLicenseState,
          driver_license_expiration: data.driverLicenseExpiration,
          cdl_number: data.cdlNumber,
          cdl_state: data.cdlState,
          cdl_expiration: data.cdlExpiration,
          cdl_class: data.cdlClass,
          endorsements: data.endorsements,
          restrictions: data.restrictions,
          // Experience Information
          years_experience: data.yearsExperience,
          months_experience: data.monthsExperience,
          trucking_experience: data.truckingExperience,
          hazmat_endorsement: data.hazmatEndorsement,
          // Medical Information
          medical_cert_expiration: data.medicalCertExpiration,
          dot_physical_expiration: data.dotPhysicalExpiration,
          drug_test_result: data.drugTestResult,
          last_drug_test: data.lastDrugTest,
          // Background Information
          veteran_status: data.veteranStatus,
          felony_conviction: data.felonyConviction,
          moving_violations: data.movingViolations,
          accident_history: data.accidentHistory,
          // Employment Information
          current_employer: data.currentEmployer,
          employment_status: data.employmentStatus,
          desired_salary: data.desiredSalary,
          available_start_date: data.availableStartDate,
          willing_to_relocate: data.willingToRelocate,
          preferred_route: data.preferredRoute,
          // Emergency Contact
          emergency_contact_name: data.emergencyContactName,
          emergency_contact_phone: data.emergencyContactPhone,
          emergency_contact_relation: data.emergencyContactRelation,
          // Consent and Agreement
          consent_to_contact: data.consentToContact,
          background_check_consent: data.backgroundCheckConsent,
          drug_test_consent: data.drugTestConsent,
          privacy_policy_accepted: data.privacyPolicyAccepted,
          // Application Status and Notes
          status: data.status,
          notes: data.notes,
          // Legacy fields from existing application
          cdl: application.cdl,
          exp: application.exp,
          drug: application.drug,
          age: application.age,
          veteran: application.veteran,
          consent: application.consent,
          privacy: application.privacy,
          job_id: application.job_id,
          applied_at: application.applied_at,
          updated_at: new Date().toISOString(),
        },
        config: {
          client_code: 'DEFAULT_CLIENT',
          source: 'Application Update',
          send_to_tenstreet: true
        }
      };

      const { data: result, error } = await supabase.functions.invoke('tenstreet-integration', {
        body: payload,
      });

      if (error) {
        throw new Error(error.message || 'Failed to send update to Tenstreet');
      }

      toast({
        title: "Update Sent",
        description: "Application update has been sent to Tenstreet successfully.",
      });

      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error sending update to Tenstreet:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send update to Tenstreet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getApplicantName = (app: any) => {
    if (app.first_name && app.last_name) return `${app.first_name} ${app.last_name}`;
    if (app.first_name) return app.first_name;
    if (app.last_name) return app.last_name;
    return 'Anonymous Applicant';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Send to Tenstreet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Update to Tenstreet</DialogTitle>
          <DialogDescription>
            Update application information for {getApplicantName(application)} in Tenstreet system.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Middle name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ssn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Social Security Number</FormLabel>
                      <FormControl>
                        <Input placeholder="XXX-XX-XXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="applicant@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="alternatePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alternate Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 987-6543" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Address Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2</FormLabel>
                      <FormControl>
                        <Input placeholder="Apt, Suite, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Los Angeles" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="CA" maxLength={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="90210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="US" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Driver Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">Driver Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="driverLicenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver License Number</FormLabel>
                      <FormControl>
                        <Input placeholder="License number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="driverLicenseState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver License State</FormLabel>
                      <FormControl>
                        <Input placeholder="CA" maxLength={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="driverLicenseExpiration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver License Expiration</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cdlNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CDL Number</FormLabel>
                      <FormControl>
                        <Input placeholder="CDL number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cdlState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CDL State</FormLabel>
                      <FormControl>
                        <Input placeholder="CA" maxLength={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cdlExpiration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CDL Expiration</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cdlClass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CDL Class</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select CDL class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A">Class A</SelectItem>
                          <SelectItem value="B">Class B</SelectItem>
                          <SelectItem value="C">Class C</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endorsements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endorsements</FormLabel>
                      <FormControl>
                        <Input placeholder="H, N, P, S, T, X (comma separated)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="restrictions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Restrictions</FormLabel>
                      <FormControl>
                        <Input placeholder="License restrictions" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Experience Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">Experience Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="yearsExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input placeholder="5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monthsExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Months of Experience</FormLabel>
                      <FormControl>
                        <Input placeholder="6" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="truckingExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trucking Experience Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select experience level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="less_than_3_months">Less than 3 months</SelectItem>
                          <SelectItem value="3_to_6_months">3-6 months</SelectItem>
                          <SelectItem value="6_months_to_1_year">6 months - 1 year</SelectItem>
                          <SelectItem value="1_to_2_years">1-2 years</SelectItem>
                          <SelectItem value="2_to_5_years">2-5 years</SelectItem>
                          <SelectItem value="more_than_5_years">More than 5 years</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hazmatEndorsement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HAZMAT Endorsement</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="willing_to_get">Willing to get</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Medical Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">Medical Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="medicalCertExpiration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Certificate Expiration</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dotPhysicalExpiration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DOT Physical Expiration</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="drugTestResult"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Drug Test Result</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select result" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pass">Pass</SelectItem>
                          <SelectItem value="fail">Fail</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="not_taken">Not taken</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastDrugTest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Drug Test Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Background Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">Background Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="veteranStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Veteran Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="felonyConviction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Felony Conviction</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="movingViolations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moving Violations (last 3 years)</FormLabel>
                      <FormControl>
                        <Input placeholder="Number of violations" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accidentHistory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accident History (last 3 years)</FormLabel>
                      <FormControl>
                        <Input placeholder="Number of accidents" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Employment Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">Employment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currentEmployer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Employer</FormLabel>
                      <FormControl>
                        <Input placeholder="Current employer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employmentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="employed">Employed</SelectItem>
                          <SelectItem value="unemployed">Unemployed</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="desiredSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desired Salary</FormLabel>
                      <FormControl>
                        <Input placeholder="$55,000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availableStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="willingToRelocate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Willing to Relocate</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="maybe">Maybe</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredRoute"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Route Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select route type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="local">Local</SelectItem>
                          <SelectItem value="regional">Regional</SelectItem>
                          <SelectItem value="otr">Over-the-Road (OTR)</SelectItem>
                          <SelectItem value="dedicated">Dedicated</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emergencyContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyContactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyContactRelation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <FormControl>
                        <Input placeholder="Spouse, Parent, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Application Status and Consent Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">Application Status & Consent</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="follow_up">Follow-up</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="interviewed">Interviewed</SelectItem>
                          <SelectItem value="hired">Hired</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consentToContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consent to Contact</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="backgroundCheckConsent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Background Check Consent</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="drugTestConsent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Drug Test Consent</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="privacyPolicyAccepted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Privacy Policy Accepted</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">Additional Information</h3>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any additional notes or updates..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Send to Tenstreet
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TenstreetUpdateDialog;