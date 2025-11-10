import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Star, CircleDot } from 'lucide-react';

interface PlanBadgeProps {
  planType: 'free' | 'starter' | 'professional' | 'enterprise';
  size?: 'sm' | 'md' | 'lg';
}

const PlanBadge = ({ planType, size = 'md' }: PlanBadgeProps) => {
  const config = {
    free: {
      label: 'Free',
      icon: CircleDot,
      className: 'bg-muted text-muted-foreground',
    },
    starter: {
      label: 'Starter',
      icon: Star,
      className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    professional: {
      label: 'Professional',
      icon: Zap,
      className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    enterprise: {
      label: 'Enterprise',
      icon: Crown,
      className: 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400',
    },
  };

  const { label, icon: Icon, className } = config[planType];
  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';

  return (
    <Badge variant="secondary" className={`${className} ${textSize} font-medium`}>
      <Icon className={`mr-1 ${iconSize}`} />
      {label}
    </Badge>
  );
};

export default PlanBadge;
