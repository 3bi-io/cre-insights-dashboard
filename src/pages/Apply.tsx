import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Truck, User, MapPin, FileText } from 'lucide-react';

const Apply = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const jobId = searchParams.get('job');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    zipCode: '',
    cdl: '',
    experience: '',
    drugConsent: false,
    dataConsent: false,
    ageVerification: false,
  });

  const submitApplication = useMutation({
    mutationFn: async (data: typeof formData) => {
      const applicationData = {
        first_name: data.firstName,
        last_name: data.lastName,
        full_name: `${data.firstName} ${data.lastName}`,
        applicant_email: data.email,
        phone: data.phone,
        city: data.city,
        state: data.state,
        zip: data.zipCode,
        cdl: data.cdl,
        exp: data.experience,
        drug: data.drugConsent ? 'yes' : 'no',
        consent: data.dataConsent ? 'yes' : 'no',
        age: data.ageVerification ? 'yes' : 'no',
        job_id: jobId,
        status: 'pending',
        applied_at: new Date().toISOString(),
        source: 'Direct Application',
      };

      const { error } = await supabase
        .from('applications')
        .insert([applicationData]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted!",
        description: "Thank you for your application. We'll be in touch soon.",
      });
      navigate('/');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
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
        description: "Please agree to all consent requirements.",
        variant: "destructive",
      });
      return;
    }

    submitApplication.mutate(formData);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Truck className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Quick Apply</h1>
          </div>
          <p className="text-muted-foreground mb-4">
            Join our team! Fill out this quick form to get started.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/apply/detailed">
              Need a more detailed application? Click here
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Application Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="phone">Phone Number *</Label>
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
              </div>

              {/* Location */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Location</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </div>
              </div>

              {/* Experience & Qualifications */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Experience & Qualifications</h3>
                </div>
                
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
                    <Label htmlFor="experience">Driving Experience</Label>
                    <Select value={formData.experience} onValueChange={(value) => handleInputChange('experience', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level..." />
                      </SelectTrigger>
                      <SelectContent>
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
              </div>

              {/* Consent & Agreements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Required Agreements</h3>
                
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
                      I certify that I am at least 21 years of age *
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitApplication.isPending}
                  className="flex-1"
                >
                  {submitApplication.isPending ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Apply;