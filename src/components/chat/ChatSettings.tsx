import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AIModel } from './types';

interface ChatSettingsProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
  onBack: () => void;
  isMobile: boolean;
}

export const ChatSettings: React.FC<ChatSettingsProps> = ({
  selectedModel,
  onModelChange,
  onBack,
  isMobile
}) => {
  const modelDescriptions: Record<AIModel, string> = {
    openai: 'Fast, accurate responses with broad knowledge.',
    anthropic: 'Excels at reasoning, analysis, and detailed explanations.',
    grok: 'Real-time knowledge with conversational reasoning.'
  };

  return (
    <div className={`flex-1 p-4 ${isMobile ? 'h-[calc(100dvh-200px)]' : 'h-[460px]'}`}>
      <div className="space-y-4">
        <h3 className="font-medium text-base">AI Model Settings</h3>

        <div className="space-y-2">
          <label className="text-sm font-medium">AI Provider</label>
          <Select value={selectedModel} onValueChange={onModelChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select AI model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">
                <div className="flex items-center gap-2">
                  <span>🤖</span>
                  <span>OpenAI GPT-4</span>
                </div>
              </SelectItem>
              <SelectItem value="anthropic">
                <div className="flex items-center gap-2">
                  <span>🧠</span>
                  <span>Anthropic Claude</span>
                </div>
              </SelectItem>
              <SelectItem value="grok">
                <div className="flex items-center gap-2">
                  <span>⚡</span>
                  <span>xAI Grok</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{modelDescriptions[selectedModel]}</p>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-2">Current Selection</p>
          <Badge variant="outline">
            {selectedModel === 'openai' ? '🤖 OpenAI GPT-4' : selectedModel === 'anthropic' ? '🧠 Anthropic Claude' : '⚡ xAI Grok'}
          </Badge>
        </div>
      </div>

      <div className="mt-6">
        <Button variant="outline" className="w-full" onClick={onBack}>
          Back to Chat
        </Button>
      </div>
    </div>
  );
};
