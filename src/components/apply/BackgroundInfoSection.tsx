import React from 'react';
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle, XCircle, Medal } from 'lucide-react';
import { SelectionButtonGroup } from './SelectionButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ScreeningQuestion } from '@/hooks/useScreeningQuestions';

interface BackgroundInfoSectionProps {
  formData: {
    drug: string;
    veteran: string;
  };
  onInputChange: (name: string, value: string) => void;
  isActive?: boolean;
  screeningQuestions?: ScreeningQuestion[];
  screeningAnswers?: Record<string, string>;
  onScreeningAnswerChange?: (questionId: string, value: string) => void;
}

const DRUG_TEST_OPTIONS = [
  { 
    value: 'Yes', 
    label: 'Yes, I can pass a drug test', 
    description: 'DOT-compliant testing',
    icon: <CheckCircle className="h-5 w-5" />
  },
  { 
    value: 'No', 
    label: 'No', 
    icon: <XCircle className="h-5 w-5" />
  },
];

const VETERAN_OPTIONS = [
  { 
    value: 'Yes', 
    label: 'Yes, I served in the military', 
    description: 'Thank you for your service!',
    icon: <Medal className="h-5 w-5" />
  },
  { 
    value: 'No', 
    label: 'No, I am not a veteran', 
  },
];

export const BackgroundInfoSection = React.memo(({ formData, onInputChange, isActive, screeningQuestions, screeningAnswers, onScreeningAnswerChange }: BackgroundInfoSectionProps) => {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="text-center pb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
          <Shield className="h-6 w-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          A few quick questions
        </h2>
        <p className="text-muted-foreground mt-1">
          Standard screening questions - almost done!
        </p>
      </div>
      
      {/* Drug Test */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Can you pass a DOT drug test? <span className="text-destructive">*</span>
        </Label>
        <SelectionButtonGroup
          name="drug-test"
          label="Drug Test"
          options={DRUG_TEST_OPTIONS}
          value={formData.drug}
          onChange={(value) => onInputChange('drug', value)}
          columns={2}
        />
        <p className="text-xs text-muted-foreground text-center">
          All CDL drivers must pass a DOT-compliant drug screening
        </p>
      </div>

      {/* Veteran Status */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Are you a military veteran?
        </Label>
        <SelectionButtonGroup
          name="veteran-status"
          label="Veteran Status"
          options={VETERAN_OPTIONS}
          value={formData.veteran}
          onChange={(value) => onInputChange('veteran', value)}
          columns={2}
        />
      </div>

      {/* Inline Screening Questions */}
      {screeningQuestions && screeningQuestions.length > 0 && (
        <div className="space-y-4 pt-2 border-t border-border">
          {screeningQuestions.map((q) => (
            <div key={q.id} className="space-y-2">
              <Label htmlFor={`screening-${q.id}`} className="text-sm font-medium">
                {q.question}
                {q.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Select
                value={screeningAnswers?.[q.id] || ''}
                onValueChange={(value) => onScreeningAnswerChange?.(q.id, value)}
              >
                <SelectTrigger id={`screening-${q.id}`} className="w-full">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {q.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

BackgroundInfoSection.displayName = 'BackgroundInfoSection';
