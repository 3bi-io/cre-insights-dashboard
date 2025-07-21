
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, BarChart3, Users, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MetaSpendAnalytics from '@/pages/MetaSpendAnalytics';
import AIAnalytics from '@/pages/AIAnalytics';

const AIAnalysisTab = () => {
  const [activeTab, setActiveTab] = useState('meta-spend');
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">AI Analysis</h2>
          <p className="text-muted-foreground">
            Advanced AI-powered analysis and insights for your data
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="meta-spend" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Meta Spend Analytics
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Application Analytics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="meta-spend" className="mt-6">
          <MetaSpendAnalytics />
        </TabsContent>
        
        <TabsContent value="applications" className="mt-6">
          <AIAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAnalysisTab;
