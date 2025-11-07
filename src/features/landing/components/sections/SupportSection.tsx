/**
 * Support Section Component
 * Displays support tiers and options
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionWrapper } from '../shared/SectionWrapper';
import { SectionHeader } from '../shared/SectionHeader';
import { supportContent } from '../../content/support.content';

const SupportSection = () => {
  return (
    <SectionWrapper variant="muted">
      <SectionHeader 
        title={supportContent.title}
        description={supportContent.description}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {supportContent.tiers.map((tier, index) => (
          <Card key={index} className={tier.popular ? 'border-primary shadow-lg' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle>{tier.name}</CardTitle>
                {tier.popular && (
                  <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                )}
              </div>
              <CardDescription>{tier.badge}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tier.features.map((feature, featureIndex) => {
                  const Icon = feature.icon;
                  return (
                    <div key={featureIndex} className="flex items-start gap-3">
                      <div className="mt-1">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{feature.text}</div>
                        <div className="text-sm text-muted-foreground">{feature.detail}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          {supportContent.footer.split('knowledge base')[0]}
          <a href="/resources" className="text-primary hover:underline">knowledge base</a>
          {supportContent.footer.split('knowledge base')[1]}
        </p>
      </div>
    </SectionWrapper>
  );
};

export default SupportSection;
