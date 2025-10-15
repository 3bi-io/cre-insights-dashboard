/**
 * LLM Model Select Component
 * Reusable dropdown for selecting AI models with categorization
 */

import React from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { LLM_MODEL_OPTIONS, LLMModel } from '../types';

interface LLMModelSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  description?: string;
  required?: boolean;
}

export const LLMModelSelect: React.FC<LLMModelSelectProps> = ({
  value,
  onValueChange,
  label = 'LLM Model',
  description = 'Choose the AI model powering your voice agent\'s responses',
  required = false
}) => {
  // Group models by category
  const openaiModels = LLM_MODEL_OPTIONS.filter(m => m.category === 'openai');
  const anthropicModels = LLM_MODEL_OPTIONS.filter(m => m.category === 'anthropic');
  const xaiModels = LLM_MODEL_OPTIONS.filter(m => m.category === 'xai');

  return (
    <div className="space-y-2">
      {label && <Label htmlFor="llm_model">{label}</Label>}
      <Select value={value} onValueChange={onValueChange} required={required}>
        <SelectTrigger id="llm_model">
          <SelectValue placeholder="Select LLM model" />
        </SelectTrigger>
        <SelectContent>
          {openaiModels.length > 0 && (
            <SelectGroup>
              <SelectLabel>OpenAI Models</SelectLabel>
              {openaiModels.map(model => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          
          {anthropicModels.length > 0 && (
            <SelectGroup>
              <SelectLabel>Anthropic Claude</SelectLabel>
              {anthropicModels.map(model => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          
          {xaiModels.length > 0 && (
            <SelectGroup>
              <SelectLabel>xAI Grok</SelectLabel>
              {xaiModels.map(model => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
};
