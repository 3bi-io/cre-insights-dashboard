import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Phone, Zap } from 'lucide-react';
import { useOrganizationFeatures } from '@/hooks/useOrganizationFeatures';
import { AIFeatureCard } from './AIFeatureCard';
import { toast } from 'sonner';

export const AIFeaturesList = () => {
  const {
    hasOpenAIAccess,
    hasAnthropicAccess,
    hasVoiceAgent,
    hasElevenLabsAccess,
  } = useOrganizationFeatures();

  const handleFeatureAction = (featureName: string) => {
    toast.info(`${featureName} Configuration`, {
      description: 'Feature configuration will be available in a future update.'
    });
  };

  const aiFeatures = [
    {
      name: 'OpenAI Chat',
      description: 'AI-powered chat and content generation using GPT models',
      enabled: hasOpenAIAccess(),
      icon: Bot,
      action: 'Configure GPT',
      onAction: () => handleFeatureAction('OpenAI Chat')
    },
    {
      name: 'Anthropic Claude',
      description: 'Advanced AI analytics and reasoning with Claude models',
      enabled: hasAnthropicAccess(),
      icon: Zap,
      action: 'Configure Claude',
      onAction: () => handleFeatureAction('Anthropic Claude')
    },
    {
      name: 'Voice Agent',
      description: 'AI-powered applicant screening and phone interviews',
      enabled: hasVoiceAgent(),
      icon: Phone,
      action: 'Setup Voice Agent',
      onAction: () => handleFeatureAction('Voice Agent')
    },
    {
      name: 'ElevenLabs Voice',
      description: 'Advanced voice synthesis and speech processing',
      enabled: hasElevenLabsAccess(),
      icon: Phone,
      action: 'Configure Voice AI',
      onAction: () => handleFeatureAction('ElevenLabs Voice')
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          AI Features & Services
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiFeatures.map((feature) => (
            <AIFeatureCard
              key={feature.name}
              {...feature}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};