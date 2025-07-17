import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
const QuickFixGuide = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          Quick Fix Guide
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <h4 className="font-medium">Common Issues</h4>
              <p className="text-sm text-muted-foreground">Check webhook URL format and test connectivity</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-medium">Best Practices</h4>
              <p className="text-sm text-muted-foreground">Use HTTPS endpoints and validate responses</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
export default QuickFixGuide;