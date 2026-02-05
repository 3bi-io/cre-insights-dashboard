 import React, { useState } from 'react';
 import { cn } from '@/lib/utils';
 import { LogoAvatar, LogoAvatarImage, LogoAvatarFallback } from '@/components/ui/logo-avatar';
 
interface CompanyLogoProps {
  logoUrl?: string | null;
  companyName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
}
 
 /**
  * Unified company logo display component
  * Wraps LogoAvatar with consistent styling and fallback handling
  */
 export const CompanyLogo: React.FC<CompanyLogoProps> = ({
   logoUrl,
   companyName,
   size = 'md',
   className,
 }) => {
   const [hasError, setHasError] = useState(false);
 
  const iconSizeMap: Record<string, 'sm' | 'md' | 'lg' | 'xl' | '2xl'> = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
    xl: 'xl',
    '2xl': '2xl',
    '3xl': '2xl',
  };
 
   const showFallback = !logoUrl || hasError;
 
   return (
     <LogoAvatar size={size} className={cn(className)}>
       {showFallback ? (
         <LogoAvatarFallback iconSize={iconSizeMap[size]} />
       ) : (
         <LogoAvatarImage
           src={logoUrl}
           alt={companyName}
           onError={() => setHasError(true)}
         />
       )}
     </LogoAvatar>
   );
 };