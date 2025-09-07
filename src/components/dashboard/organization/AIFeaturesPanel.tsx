import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  Phone, 
  Zap,
  MessageSquare,
  BarChart3,
  Settings
} from 'lucide-react';
import { useOrganizationFeatures } from '@/hooks/useOrganizationFeatures';

export const AIFeaturesPanel = () => {
  const {
    hasOpenAIAccess,
    hasAnthropicAccess,
    hasVoiceAgent,
    hasElevenLabsAccess,
    hasAIAccess
  } = useOrganizationFeatures();

  const aiFeatures = [
    {
      name: 'OpenAI Chat',
      description: 'AI-powered chat and content generation',
      enabled: hasOpenAIAccess(),
      icon: Bot,
      action: 'Configure GPT Models'
    },
    {
      name: 'Anthropic Claude',
      description: 'Advanced AI analytics and reasoning',
      enabled: hasAnthropicAccess(),
      icon: Zap,
      action: 'Configure Claude Models'
    },
    {
      name: 'Voice Agent',
      description: 'AI-powered applicant screening calls',
      enabled: hasVoiceAgent(),
      icon: Phone,
      action: 'Setup Voice Agent'
    },
    {
      name: 'ElevenLabs Voice',
      description: 'Voice synthesis and speech processing',
      enabled: hasElevenLabsAccess(),
      icon: Phone,
      action: 'Configure Voice AI'
    }
  ];

  if (!hasAIAccess()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No AI Features Available</h3>
            <p className="text-sm text-muted-foreground">
              Contact your administrator to enable AI-powered features for your organization.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI Features Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={feature.name} 
                  className={`p-4 ${feature.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${feature.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{feature.name}</span>
                          <Badge variant={feature.enabled ? 'default' : 'secondary'}>
                            {feature.enabled ? 'Active' : 'Disabled'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant={feature.enabled ? 'outline' : 'ghost'} 
                      size="sm"
                      disabled={!feature.enabled}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {feature.action}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {hasAIAccess() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              AI Chat Interface
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">AI Assistant</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your AI-powered recruitment assistant is ready to help with applicant screening, 
                  job posting optimization, and candidate insights.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <BarChart3 className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-lg font-bold">87%</div>
                  <div className="text-xs text-muted-foreground">Accuracy Rate</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <MessageSquare className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <div className="text-lg font-bold">1,234</div>
                  <div className="text-xs text-muted-foreground">Conversations</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <Phone className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-lg font-bold">456</div>
                  <div className="text-xs text-muted-foreground">Voice Calls</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};