import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, MessageSquare, BarChart3, Phone } from 'lucide-react';
import { useOrganizationFeatures } from '@/hooks/useOrganizationFeatures';

export const AIToolsOverview = () => {
  const { hasAIAccess } = useOrganizationFeatures();

  if (!hasAIAccess()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI Tools Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No AI Features Available</h3>
            <p className="text-sm text-muted-foreground">
              Contact your administrator to enable AI-powered features for your organization.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          AI Assistant Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">AI Assistant Status</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your AI-powered recruitment assistant is active and ready to help with applicant screening, 
              job posting optimization, and candidate insights.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <BarChart3 className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <div className="text-lg font-bold">87%</div>
              <div className="text-xs text-muted-foreground">Accuracy Rate</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <div className="text-lg font-bold">1,234</div>
              <div className="text-xs text-muted-foreground">Conversations</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <Phone className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <div className="text-lg font-bold">456</div>
              <div className="text-xs text-muted-foreground">Voice Calls</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};