/**
 * ClientLogoMarquee - Infinite scrolling client logos social proof
 * Pulls from public_client_info view dynamically
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ClientInfo {
  id: string;
  name: string;
  logo_url: string | null;
}

const ClientLogoMarquee = () => {
  const { data: clients = [] } = useQuery({
    queryKey: ['public-client-logos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_client_info')
        .select('id, name, logo_url')
        .not('logo_url', 'is', null)
        .limit(20);
      if (error) throw error;
      return (data as ClientInfo[]) || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  if (clients.length < 3) return null;

  // Double the array for seamless infinite scroll
  const doubled = [...clients, ...clients];

  return (
    <section className="py-10 md:py-14 bg-muted/20 border-y border-border/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-widest"
        >
          Trusted by industry leaders
        </motion.p>
      </div>

      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee gap-12 md:gap-16 items-center">
          {doubled.map((client, i) => (
            <div
              key={`${client.id}-${i}`}
              className="flex-shrink-0 flex items-center justify-center h-12 w-32 md:h-14 md:w-40 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
            >
              {client.logo_url ? (
                <img
                  src={client.logo_url}
                  alt={`${client.name} logo`}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
                  {client.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClientLogoMarquee;
