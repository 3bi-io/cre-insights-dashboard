
import React, { Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApplicationForm } from '@/hooks/useApplicationForm';
import { ApplicationFormSkeleton } from './ApplicationFormSkeleton';
import { PersonalInfoSection } from './PersonalInfoSection';
import { CDLInfoSection } from './CDLInfoSection';
import { BackgroundInfoSection } from './BackgroundInfoSection';
import { ConsentSection } from './ConsentSection';

export const ApplicationForm = () => {
  const { formData, handleInputChange, handleSubmit, isSubmitting } = useApplicationForm();

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Suspense fallback={<ApplicationFormSkeleton />}>
            <PersonalInfoSection 
              formData={formData} 
              onInputChange={handleInputChange} 
            />
          </Suspense>

          <Suspense fallback={<ApplicationFormSkeleton />}>
            <CDLInfoSection 
              formData={formData} 
              onInputChange={handleInputChange} 
            />
          </Suspense>

          <Suspense fallback={<ApplicationFormSkeleton />}>
            <BackgroundInfoSection 
              formData={formData} 
              onInputChange={handleInputChange} 
            />
          </Suspense>

          <Suspense fallback={<ApplicationFormSkeleton />}>
            <ConsentSection 
              formData={formData} 
              onInputChange={handleInputChange} 
            />
          </Suspense>

          <div className="flex items-center justify-center pt-6">
            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
