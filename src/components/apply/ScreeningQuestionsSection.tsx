import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ScreeningQuestion } from '@/hooks/useScreeningQuestions';

interface ScreeningQuestionsSectionProps {
  questions: ScreeningQuestion[];
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, value: string) => void;
  isActive?: boolean;
}

export const ScreeningQuestionsSection: React.FC<ScreeningQuestionsSectionProps> = ({
  questions,
  answers,
  onAnswerChange,
  isActive = true,
}) => {
  if (!isActive || questions.length === 0) return null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Screening Questions</h3>
        <p className="text-sm text-muted-foreground">Please answer the following questions to continue.</p>
      </div>

      {questions.map((q) => (
        <div key={q.id} className="space-y-2">
          <Label htmlFor={`screening-${q.id}`} className="text-sm font-medium">
            {q.question}
            {q.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Select
            value={answers[q.id] || ''}
            onValueChange={(value) => onAnswerChange(q.id, value)}
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
  );
};
