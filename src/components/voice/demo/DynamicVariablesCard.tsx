import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Variable, FileText, User, Briefcase } from 'lucide-react';

interface DynamicVariable {
  name: string;
  value: string;
  source: 'application' | 'job_listing' | 'organization';
}

const dynamicVariables: DynamicVariable[] = [
  { name: 'applicant_first_name', value: 'Cody', source: 'application' },
  { name: 'applicant_city', value: 'Weatherford, Texas', source: 'application' },
  { name: 'has_cdl', value: 'Yes (Class A)', source: 'application' },
  { name: 'years_experience', value: '1 year', source: 'application' },
  { name: 'drug_test_status', value: 'Willing to pass', source: 'application' },
  { name: 'veteran_status', value: 'Yes', source: 'application' },
];

const sourceIcons = {
  application: User,
  job_listing: Briefcase,
  organization: FileText,
};

const sourceColors = {
  application: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  job_listing: 'bg-green-500/10 text-green-600 border-green-500/20',
  organization: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

const DynamicVariablesCard: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Variable className="h-5 w-5 text-primary" />
          Dynamic Variables
        </CardTitle>
        <CardDescription>
          Data passed to personalize the AI agent's conversation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dynamicVariables.map((variable, index) => {
            const SourceIcon = sourceIcons[variable.source];
            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <code className="text-sm font-mono bg-background px-2 py-1 rounded border">
                    {variable.name}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{variable.value}</span>
                  <Badge variant="outline" className={sourceColors[variable.source]}>
                    <SourceIcon className="h-3 w-3 mr-1" />
                    {variable.source.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">How it works:</strong> When initiating an outbound call, 
            these variables are extracted from the applicant's data and passed to the AI agent. 
            The agent uses them to personalize the conversation naturally.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DynamicVariablesCard;
