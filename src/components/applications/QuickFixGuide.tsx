
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

const QuickFixGuide = () => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Quick Fix Applied
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800">What's Been Fixed:</span>
          </div>
          <ul className="text-sm text-green-700 space-y-1 ml-6">
            <li>• Auto-creates job listings if they don't exist</li>
            <li>• More flexible job title matching (exact + partial)</li>
            <li>• Better error messages with debug information</li>
            <li>• Handles various field name formats from Zapier</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-800">Try Again Now:</span>
          </div>
          <p className="text-sm text-blue-700 mb-2">
            Your Zapier webhook should now work even if:
          </p>
          <ul className="text-sm text-blue-700 space-y-1 ml-4">
            <li>• The job listing doesn't exist (it will create one)</li>
            <li>• Job title doesn't exactly match (partial matching)</li>
            <li>• Field names are different (auto-detection)</li>
          </ul>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Auto Job Creation
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Flexible Matching
          </Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Better Debugging
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickFixGuide;
