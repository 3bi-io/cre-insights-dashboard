import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const Apply = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    zip: '',
    age: '',
    cdl: '',
    experience: '',
    drug: '',
    veteran: '',
    employmentHistory: '',
    consent: '',
    privacy: '',
  });

  const navigate = useNavigate();

  const submitApplication = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/submit-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    submitApplication.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Driver Application</h1>
            <p className="text-muted-foreground">Fill out the form below to apply for driving positions</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information Section */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground border-b pb-2">Personal Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input
                        id="zip"
                        value={formData.zip}
                        onChange={(e) => handleInputChange('zip', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Select value={formData.age} onValueChange={(value) => handleInputChange('age', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your age..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 50 }, (_, i) => 21 + i).map(age => (
                          <SelectItem key={age} value={age.toString()}>{age}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* CDL Information Section */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground border-b pb-2">CDL Information</h2>
                  
                  <div>
                    <Label htmlFor="cdl">Do you have a CDL-A license?</Label>
                    <Select value={formData.cdl} onValueChange={(value) => handleInputChange('cdl', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select CDL status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="permit">Permit only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="experience">Months of CDL-A driving experience?</Label>
                    <Select value={formData.experience} onValueChange={(value) => handleInputChange('experience', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select months of experience..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 48 }, (_, i) => i + 1).map(month => (
                          <SelectItem key={month} value={month.toString()}>{month}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Background Information Section */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground border-b pb-2">Background Information</h2>
                  
                  <div>
                    <Label htmlFor="drug">Can you pass a drug test?</Label>
                    <Select value={formData.drug} onValueChange={(value) => handleInputChange('drug', value)}>
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
                    <Label htmlFor="veteran">Are you a veteran?</Label>
                    <Select value={formData.veteran} onValueChange={(value) => handleInputChange('veteran', value)}>
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

                {/* Employment History Section */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground border-b pb-2">Employment History</h2>
                  
                  <div>
                    <Label htmlFor="employmentHistory">Previous Employment</Label>
                    <Textarea
                      id="employmentHistory"
                      value={formData.employmentHistory}
                      onChange={(e) => handleInputChange('employmentHistory', e.target.value)}
                      placeholder="Please describe your previous employment history..."
                      className="min-h-[120px]"
                    />
                  </div>
                </div>

                {/* Consent Section */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground border-b pb-2">Consent</h2>
                  
                  <div>
                    <Label htmlFor="consent">Do you consent to be contacted by recruiters?</Label>
                    <Select value={formData.consent} onValueChange={(value) => handleInputChange('consent', value)}>
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
                    <Label htmlFor="privacy">Do you agree to our privacy policy?</Label>
                    <Select value={formData.privacy} onValueChange={(value) => handleInputChange('privacy', value)}>
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

                <div className="flex items-center justify-between pt-6">
                  <Link to="/" className="text-primary hover:underline">
                    ← Back to Home
                  </Link>
                  <Button type="submit" disabled={submitApplication.isPending}>
                    {submitApplication.isPending ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Apply;
