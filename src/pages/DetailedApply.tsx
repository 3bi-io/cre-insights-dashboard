import React from 'react';
import { DetailedApplicationForm } from '@/components/apply/detailed';
import ZipRecruiterPixel from '@/components/tracking/ZipRecruiterPixel';

const DetailedApply = () => {
  return (
    <>
      <DetailedApplicationForm />
      <ZipRecruiterPixel />
    </>
  );
};

export default DetailedApply;
