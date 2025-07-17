import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Phone, MessageSquare, Loader2, CheckCircle, ArrowRight } from 'lucide-react';

const phoneAuthSchema = z.object({
  phoneNumber: z.string().min(10, 'Please enter a valid phone number'),
});

const verificationSchema = z.object({
  token: z.string().length(6, 'Verification code must be 6 digits'),
});

const applicationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(5, 'ZIP code is required'),
  cdlClass: z.string().optional(),
  yearsExperience: z.string().min(1, 'Experience is required'),
  employmentType: z.string().min(1, 'Employment type is required'),
  availableStartDate: z.string().min(1, 'Start date is required'),
  consent: z.boolean().refine(val => val === true, 'You must agree to be contacted'),
});

type PhoneAuthForm = z.infer<typeof phoneAuthSchema>;
type VerificationForm = z.infer<typeof verificationSchema>;
type ApplicationForm = z.infer<typeof applicationSchema>;

type Step = 'phone-auth' | 'verification' | 'application' | 'success';

const IntelliApply = () => {
  const [currentStep, setCurrentStep] = useState<Step>('phone-auth');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const phoneForm = useForm<PhoneAuthForm>({
    resolver: zodResolver(phoneAuthSchema),
    defaultValues: { phoneNumber: '' },
  });

  const verificationForm = useForm<VerificationForm>({
    resolver: zodResolver(verificationSchema),
    defaultValues: { token: '' },
  });

  const applicationForm = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      dateOfBirth: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      cdlClass: '',
      yearsExperience: '',
      employmentType: '',
      availableStartDate: '',
      consent: false,
    },
  });

  const handleSendVerification = async (data: PhoneAuthForm) => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('sms-auth', {
        body: {
          action: 'send_magic_link',
          phoneNumber: data.phoneNumber,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setPhoneNumber(data.phoneNumber);
      setCurrentStep('verification');
      toast({
        title: "Verification Code Sent",
        description: "Please check your phone for the 6-digit verification code.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyToken = async (data: VerificationForm) => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('sms-auth', {
        body: {
          action: 'verify_token',
          phoneNumber: phoneNumber,
          token: data.token,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setSessionToken(response.data.sessionToken);
      setCurrentStep('application');
      toast({
        title: "Phone Verified",
        description: "You can now complete your application.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Invalid verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitApplication = async (data: ApplicationForm) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('applications').insert({
        first_name: data.firstName,
        last_name: data.lastName,
        full_name: `${data.firstName} ${data.lastName}`,
        applicant_email: data.email,
        phone: phoneNumber,
        city: data.city,
        state: data.state,
        zip: data.zipCode,
        age: 'yes', // Assuming they provided DOB
        exp: data.yearsExperience,
        consent: data.consent ? 'yes' : 'no',
        source: 'IntelliApply SMS',
        status: 'pending',
        notes: `Employment Type: ${data.employmentType}, CDL Class: ${data.cdlClass || 'None'}, Available Start: ${data.availableStartDate}`,
        applied_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      setCurrentStep('success');
      toast({
        title: "Application Submitted",
        description: "Thank you! We'll contact you soon about next steps.",
      });

      // Send confirmation call
      await supabase.functions.invoke('sms-auth', {
        body: {
          action: 'make_call',
          phoneNumber: phoneNumber,
          message: `Hello ${data.firstName}, thank you for applying with IntelliApp. We have received your application and will contact you within 24 hours with next steps. Have a great day!`,
        },
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderPhoneAuth = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Phone className="w-6 h-6" />
          IntelliApply
        </CardTitle>
        <p className="text-muted-foreground">Enter your phone number to get started</p>
      </CardHeader>
      <CardContent>
        <Form {...phoneForm}>
          <form onSubmit={phoneForm.handleSubmit(handleSendVerification)} className="space-y-4">
            <FormField
              control={phoneForm.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="+1 (555) 123-4567" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Verification Code
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  const renderVerification = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Verify Your Phone</CardTitle>
        <p className="text-muted-foreground">
          Enter the 6-digit code sent to {phoneNumber}
        </p>
      </CardHeader>
      <CardContent>
        <Form {...verificationForm}>
          <form onSubmit={verificationForm.handleSubmit(handleVerifyToken)} className="space-y-4">
            <FormField
              control={verificationForm.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Code</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="123456" 
                      maxLength={6}
                      className="text-center text-2xl tracking-widest"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify Code
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  const renderApplication = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Application</CardTitle>
        <p className="text-muted-foreground">Please fill out all required information</p>
      </CardHeader>
      <CardContent>
        <Form {...applicationForm}>
          <form onSubmit={applicationForm.handleSubmit(handleSubmitApplication)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={applicationForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={applicationForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={applicationForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={applicationForm.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={applicationForm.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={applicationForm.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={applicationForm.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={applicationForm.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={applicationForm.control}
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
                        <SelectItem value="none">No CDL</SelectItem>
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
                control={applicationForm.control}
                name="yearsExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Experience *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select experience" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">No experience</SelectItem>
                        <SelectItem value="1">Less than 1 year</SelectItem>
                        <SelectItem value="2">1-2 years</SelectItem>
                        <SelectItem value="3">3-5 years</SelectItem>
                        <SelectItem value="5+">5+ years</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={applicationForm.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Employment Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="temporary">Temporary</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={applicationForm.control}
                name="availableStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Start Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center space-x-2">
              <FormField
                control={applicationForm.control}
                name="consent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="mt-1"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm">
                        I consent to be contacted via phone, SMS, or email regarding this application and future opportunities *
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  const renderSuccess = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <CardTitle className="text-green-600">Application Submitted!</CardTitle>
        <p className="text-muted-foreground">
          Thank you for applying. We'll contact you within 24 hours with next steps.
        </p>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          You should receive a confirmation call shortly.
        </p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          className="w-full"
        >
          Submit Another Application
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">IntelliApply</h1>
          <p className="text-xl text-gray-600">Smart application process powered by SMS verification</p>
        </div>

        {currentStep === 'phone-auth' && renderPhoneAuth()}
        {currentStep === 'verification' && renderVerification()}
        {currentStep === 'application' && renderApplication()}
        {currentStep === 'success' && renderSuccess()}
      </div>
    </div>
  );
};

export default IntelliApply;