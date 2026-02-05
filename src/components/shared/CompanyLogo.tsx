 import React, { useState } from 'react';
 import { cn } from '@/lib/utils';
 import { LogoAvatar, LogoAvatarImage, LogoAvatarFallback } from '@/components/ui/logo-avatar';
 
 interface CompanyLogoProps {
   logoUrl?: string | null;
   companyName: string;
   size?: 'sm' | 'md' | 'lg' | 'xl';
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
 
   const iconSizeMap: Record<string, 'sm' | 'md' | 'lg'> = {
     sm: 'sm',
     md: 'md',
     lg: 'lg',
     xl: 'lg',
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