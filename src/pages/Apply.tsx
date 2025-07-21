
import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApplicationForm } from '@/hooks/useApplicationForm';

// Lazy load form sections for better performance
const PersonalInfoSection = React.lazy(() => import('@/components/apply/PersonalInfoSection').then(module => ({ default: module.PersonalInfoSection })));
const CDLInfoSection = React.lazy(() => import('@/components/apply/CDLInfoSection').then(module => ({ default: module.CDLInfoSection })));
const BackgroundInfoSection = React.lazy(() => import('@/components/apply/BackgroundInfoSection').then(module => ({ default: module.BackgroundInfoSection })));
const ConsentSection = React.lazy(() => import('@/components/apply/ConsentSection').then(module => ({ default: module.ConsentSection })));

// Loading skeleton component
const SectionSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-6 bg-muted rounded w-1/3"></div>
    <div className="space-y-2">
      <div className="h-4 bg-muted rounded w-1/4"></div>
      <div className="h-10 bg-muted rounded"></div>
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-muted rounded w-1/4"></div>
      <div className="h-10 bg-muted rounded"></div>
    </div>
  </div>
);

const Apply = () => {
  const { formData, handleInputChange, handleSubmit, isSubmitting } = useApplicationForm();

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
                <Suspense fallback={<SectionSkeleton />}>
                  <PersonalInfoSection 
                    formData={formData} 
                    onInputChange={handleInputChange} 
                  />
                </Suspense>

                <Suspense fallback={<SectionSkeleton />}>
                  <CDLInfoSection 
                    formData={formData} 
                    onInputChange={handleInputChange} 
                  />
                </Suspense>

                <Suspense fallback={<SectionSkeleton />}>
                  <BackgroundInfoSection 
                    formData={formData} 
                    onInputChange={handleInputChange} 
                  />
                </Suspense>

                <Suspense fallback={<SectionSkeleton />}>
                  <ConsentSection 
                    formData={formData} 
                    onInputChange={handleInputChange} 
                  />
                </Suspense>

                <div className="flex items-center justify-between pt-6">
                  <Link to="/" className="text-primary hover:underline">
                    ← Back to Home
                  </Link>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
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
