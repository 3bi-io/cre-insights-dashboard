import React from 'react';

interface SubscriptionGateProps {
  children: React.ReactNode;
  feature?: string;
  mode?: 'block' | 'warn';
}

/**
 * SubscriptionGate - now a passthrough component
 * All users have full access, no subscription checks required
 */
const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ children }) => {
  return <>{children}</>;
};

export default SubscriptionGate;
