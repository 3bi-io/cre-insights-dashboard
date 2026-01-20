import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Users, Plus, X } from 'lucide-react';
import { TenstreetFieldSelect } from './TenstreetFieldSelect';

interface DisplayField {
  displayPrompt: string;
  mapping: string;
}

interface TenstreetDisplayFieldsProps {
  fields: DisplayField[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof DisplayField, value: string) => void;
}

export const TenstreetDisplayFields: React.FC<TenstreetDisplayFieldsProps> = ({
  fields,
  onAdd,
  onRemove,
  onUpdate,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Display Fields Mapping
          <Button onClick={onAdd} size="sm" variant="outline" className="ml-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">
            No display fields configured. Click "Add Field" to create one.
          </p>
        )}
        {fields.map((field, index) => (
          <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="flex-1">
              <div className="space-y-2">
                <Label>Display Prompt</Label>
                <Input
                  value={field.displayPrompt}
                  onChange={(e) => onUpdate(index, 'displayPrompt', e.target.value)}
                  placeholder="Display prompt"
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="space-y-2">
                <Label>Field Mapping</Label>
                <TenstreetFieldSelect
                  value={field.mapping}
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
