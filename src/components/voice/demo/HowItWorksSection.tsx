import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Variable, Bot, Phone, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: FileText,
    title: 'Application Data',
    description: 'Candidate submits application with personal details, CDL info, and qualifications',
  },
  {
    icon: Variable,
    title: 'Extract Variables',
    description: 'System extracts key data points like name, experience, and certifications',
  },
  {
    icon: Bot,
    title: 'Configure Agent',
    description: 'AI agent receives dynamic variables to personalize the conversation',
  },
  {
    icon: Phone,
    title: 'Outbound Call',
    description: 'Agent calls the candidate with context-aware, personalized dialogue',
  },
];

const HowItWorksSection: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">How It Works</CardTitle>
        <CardDescription>
          The flow from application to personalized voice call
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="flex flex-col items-center text-center p-4 bg-muted/30 rounded-lg h-full">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-medium text-sm mb-2">{step.title}</h4>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default HowItWorksSection;
