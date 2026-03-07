/**
 * Platform Overview Demo Tab
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { demoPlatformFeatures } from './demoContent';

export const PlatformDemoTab = () => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Platform Overview</h2>
        <p className="text-muted-foreground">Everything you need to manage your recruitment pipeline</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Comprehensive Features</CardTitle>
            <CardDescription>All the tools you need in one platform</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {demoPlatformFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>{feature.label}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
            <CardDescription>Results our customers achieve</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-4xl font-bold text-primary mb-1">&lt;3 min</div>
              <div className="text-sm text-muted-foreground">Average callback time</div>
            </div>
            <div className="text-center p-4 bg-green-500/5 rounded-lg">
              <div className="text-4xl font-bold text-green-600 mb-1">40%</div>
              <div className="text-sm text-muted-foreground">Higher contact rates</div>
            </div>
            <div className="text-center p-4 bg-blue-500/5 rounded-lg">
              <div className="text-4xl font-bold text-blue-600 mb-1">60%</div>
              <div className="text-sm text-muted-foreground">Reduction in cost-per-hire</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
