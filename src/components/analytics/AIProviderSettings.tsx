
import React from 'react';
import { Settings2, SquareCode, Brain } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface AIProviderSettingsProps {
  aiProvider: 'basic' | 'openai' | 'anthropic';
  setAiProvider: (provider: 'basic' | 'openai' | 'anthropic') => void;
  loading: boolean;
  analyticsProvider?: string;
}

const AIProviderSettings: React.FC<AIProviderSettingsProps> = ({
  aiProvider,
  setAiProvider,
  loading,
  analyticsProvider
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="w-5 h-5" />
          AI Analysis Settings
        </CardTitle>
        <CardDescription>
          Choose your preferred AI provider for enhanced insights and recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">AI Provider</label>
            <Select value={aiProvider} onValueChange={setAiProvider} disabled={loading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select AI provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Analysis Options</SelectLabel>
                  <SelectItem value="basic">
                    <div className="flex items-center gap-2">
                      <SquareCode className="w-4 h-4" />
                      <div>
                        <div>Basic Analytics</div>
                        <div className="text-xs text-muted-foreground">Rule-based analysis only</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="openai">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      <div>
                        <div>OpenAI GPT-4</div>
                        <div className="text-xs text-muted-foreground">Advanced AI insights & recommendations</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="anthropic">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      <div>
                        <div>Anthropic Claude</div>
                        <div className="text-xs text-muted-foreground">Deep reasoning & strategic analysis</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              {aiProvider === 'basic' && <><SquareCode className="w-3 h-3" /> Basic</>}
              {aiProvider === 'openai' && <><Brain className="w-3 h-3" /> OpenAI</>}
              {aiProvider === 'anthropic' && <><Brain className="w-3 h-3" /> Claude</>}
            </Badge>
            {analyticsProvider && analyticsProvider !== aiProvider && (
              <Badge variant="secondary" className="text-xs">
                Update Required
              </Badge>
            )}
          </div>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          {aiProvider === 'basic' && "Basic analytics use rule-based analysis to categorize and summarize your application data."}
          {aiProvider === 'openai' && "OpenAI GPT-4 provides advanced pattern recognition and strategic insights for your recruitment data."}
          {aiProvider === 'anthropic' && "Anthropic Claude excels at deep reasoning and provides detailed strategic recommendations."}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIProviderSettings;
