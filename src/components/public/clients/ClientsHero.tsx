import React from 'react';
import { HeroBackground } from '@/components/shared';
import transportHero from '@/assets/hero/transport-hero.png';

interface ClientsHeroProps {
  totalCompanies: number;
}

export const ClientsHero: React.FC<ClientsHeroProps> = ({ totalCompanies }) => {
  return (
    <HeroBackground
      imageSrc={transportHero}
      imageAlt="Digital transportation technology with connected circuits representing modern fleet operations"
      variant="compact"
      overlayVariant="dark"
      overlayOpacity={70}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2 lg:mb-4 text-black">
            Find Your Next Employer
          </h1>
          <span className="inline-block text-base lg:text-xl text-black font-medium bg-white rounded-full px-6 py-2 mb-3">
            {totalCompanies.toLocaleString()} companies hiring now
          </span>
        </div>
      </div>
    </HeroBackground>
  );
};