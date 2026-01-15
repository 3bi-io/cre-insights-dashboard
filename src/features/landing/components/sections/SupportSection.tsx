/**
 * Support Section Component
 * Displays unified support features for all users
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Comprehensive Support for All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {supportContent.features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-start gap-3">
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
