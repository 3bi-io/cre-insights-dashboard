/**
 * Application Flow Demo Tab
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { demoApplicationSteps } from './demoContent';

export const FlowDemoTab = () => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Candidate Journey</h2>
        <p className="text-muted-foreground">From application to connection in minutes, not days</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {demoApplicationSteps.map((step, index) => (
          <Card key={index} className="text-center relative">
            <CardContent className="pt-8 pb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <step.icon className="h-8 w-8 text-primary" />
              </div>
              <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Clock className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Speed Matters in Recruitment</h3>
              <p className="text-muted-foreground max-w-xl">
                Studies show that 50% of candidates accept the first offer they receive. 
                With ATS.me, you connect with qualified candidates before your competitors even make contact.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
