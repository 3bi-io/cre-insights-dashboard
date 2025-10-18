import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCountryCheck } from '@/hooks/useCountryCheck';

interface CountryBlockWrapperProps {
  children: React.ReactNode;
}

const CountryBlockWrapper: React.FC<CountryBlockWrapperProps> = ({ children }) => {
  const { isBlocked, checked } = useCountryCheck();

  // Show loading while checking (prevents flash of content)
  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to access denied page if blocked
  if (isBlocked) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
};

export default CountryBlockWrapper;
