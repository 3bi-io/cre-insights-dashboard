import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users } from 'lucide-react';

interface ApplicationGeneratorProps {
  appCount: number;
  onCountChange: (count: number) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  disabled: boolean;
}

export const ApplicationGenerator: React.FC<ApplicationGeneratorProps> = ({
  appCount,
  onCountChange,
  onGenerate,
  isGenerating,
  disabled,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Generate Sample Applications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1 max-w-xs">
            <Label htmlFor="appCount">Number of Applications</Label>
            <Input
              id="appCount"
              type="number"
              min="1"
              max="500"
              value={appCount}
              onChange={(e) => onCountChange(parseInt(e.target.value) || 50)}
              className="mt-1"
            />
          </div>
          <Button 
            onClick={onGenerate}
            disabled={disabled || isGenerating}
            variant="default"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Generate {appCount} Applications
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
