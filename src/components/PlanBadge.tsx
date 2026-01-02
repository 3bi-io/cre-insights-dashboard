/**
 * PlanBadge Component
 * Now shows "Full Access" for all users since subscription tiers have been removed
 */

import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface PlanBadgeProps {
  planType?: 'free' | 'starter' | 'professional' | 'enterprise';
  size?: 'sm' | 'md' | 'lg';
}

const PlanBadge = ({ size = 'md' }: PlanBadgeProps) => {
  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';

  return (
    <Badge 
      variant="secondary" 
      className={`bg-gradient-to-r from-primary/10 to-primary/5 text-primary ${textSize} font-medium`}
    >
      <Sparkles className={`mr-1 ${iconSize}`} />
      Full Access
    </Badge>
  );
};

export default PlanBadge;
