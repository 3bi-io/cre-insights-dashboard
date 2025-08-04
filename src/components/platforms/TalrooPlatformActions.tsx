import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Globe, Zap } from 'lucide-react';

const TalrooPlatformActions = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/2ba5a3f3-dba1-46c4-8caf-fe192c25c828.png" 
            alt="Talroo" 
            className="w-8 h-8"
          />
          <div>
            <CardTitle className="flex items-center gap-2">
              Talroo Integration
              <Badge variant="outline">Active</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Programmatic job advertising platform
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">-</div>
            <div className="text-sm text-muted-foreground">Active Campaigns</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">-</div>
            <div className="text-sm text-muted-foreground">Monthly Spend</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">-</div>
            <div className="text-sm text-muted-foreground">Applications</div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Platform Features</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-green-500" />
              <span>Programmatic Bidding</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-blue-500" />
              <span>Multi-Channel Distribution</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ExternalLink className="w-4 h-4 text-purple-500" />
              <span>Real-time Analytics</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-orange-500" />
              <span>Performance Optimization</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('https://talroo.com', '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Visit Talroo
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            Setup Integration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TalrooPlatformActions;