import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileText, Plus, X } from 'lucide-react';
import { TenstreetFieldSelect } from './TenstreetFieldSelect';

interface CustomQuestion {
  questionId: string;
  question: string;
  mapping: string;
}

interface TenstreetCustomQuestionsProps {
  questions: CustomQuestion[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof CustomQuestion, value: string) => void;
}

export const TenstreetCustomQuestions: React.FC<TenstreetCustomQuestionsProps> = ({
  questions,
  onAdd,
  onRemove,
  onUpdate,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Custom Questions Mapping
          <Button onClick={onAdd} size="sm" variant="outline" className="ml-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">
            No custom questions configured. Click "Add Question" to create one.
          </p>
        )}
        {questions.map((question, index) => (
          <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="flex-1">
              <div className="space-y-2">
                <Label>Question ID</Label>
                <Input
                  value={question.questionId}
                  onChange={(e) => onUpdate(index, 'questionId', e.target.value)}
                  placeholder="Question ID"
                />
              </div>
            </div>
            <div className="flex-[2]">
              <div className="space-y-2">
                <Label>Question Text</Label>
                <Input
                  value={question.question}
                  onChange={(e) => onUpdate(index, 'question', e.target.value)}
                  placeholder="Question text"
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="space-y-2">
                <Label>Field Mapping</Label>
                <TenstreetFieldSelect
                  value={question.mapping}
                  onChange={(value) => onUpdate(index, 'mapping', value)}
                />
              </div>
            </div>
            <Button 
              onClick={() => onRemove(index)} 
              variant="outline" 
              size="sm"
              className="text-destructive hover:text-destructive/90"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
