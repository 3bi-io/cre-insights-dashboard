import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { HeroBackground } from '@/components/shared';
import transportHero from '@/assets/hero/transport-hero.png';

interface ClientsHeroProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  totalCompanies: number;
}

export const ClientsHero: React.FC<ClientsHeroProps> = ({ searchTerm, onSearchChange, totalCompanies }) => {
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
            Companies Hiring Now
          </h1>
          <span className="inline-block text-base lg:text-xl text-black font-medium bg-white rounded-full px-6 py-2 mb-3">
            Browse top employers in the transportation industry
          </span>
          <div>
            <span className="inline-block text-base lg:text-xl text-black font-medium bg-white rounded-full px-6 py-2 mb-4 lg:mb-6">
              {totalCompanies.toLocaleString()} Companies Enrolled
            </span>
          </div>
          
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search companies by name or location..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12 h-12 text-base bg-background border-border"
            />
          </div>
        </div>
      </div>
    </HeroBackground>
  );
};