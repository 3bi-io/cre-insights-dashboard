/**
 * Integrations Section Component
 * Displays available platform integrations
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { SectionWrapper } from '../shared/SectionWrapper';
import { SectionHeader } from '../shared/SectionHeader';
import { integrationsContent } from '../../content/integrations.content';

const IntegrationsSection = () => {
  return (
    <SectionWrapper>
      <SectionHeader 
        title={integrationsContent.title}
        description={integrationsContent.description}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {integrationsContent.categories.map((category, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {category.title}
              </h3>
              <ul className="space-y-2">
                {category.integrations.map((integration, idx) => (
                  <li key={idx} className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                    {integration}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <p className="text-muted-foreground mb-4">
          {integrationsContent.footerText}
        </p>
        <Link to="/features">
          <Button variant="outline" className="group">
            {integrationsContent.ctaText}
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </SectionWrapper>
  );
};

export default IntegrationsSection;
