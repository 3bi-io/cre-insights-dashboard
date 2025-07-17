import { supabase } from '@/integrations/supabase/client';

export type AIProvider = 'openai' | 'anthropic' | 'basic';
export type DataSensitivity = 'public' | 'internal' | 'sensitive' | 'restricted';

export interface AIRequest {
  prompt: string;
  data: any;
  sensitivity: DataSensitivity;
  requiresAI: boolean;
  context?: string;
  parameters?: AIParameters;
}

export interface AIParameters {
  experienceSensitivity: 'low' | 'medium' | 'high';
  industryFocus: string;
  biasReduction: boolean;
  explainabilityLevel: 'basic' | 'detailed' | 'comprehensive';
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  processingType: 'ai' | 'rule-based' | 'hybrid';
  confidence: number;
  explanation?: string;
  fallbackUsed: boolean;
  processingTime: number;
}

class AIService {
  private preferredProviders: AIProvider[] = ['anthropic', 'openai', 'basic'];
  private maxRetries = 3;
  private timeoutMs = 30000;

  async processRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    // Check if AI processing is required and allowed
    if (!this.shouldUseAI(request)) {
      return this.processWithRules(request, startTime);
    }

    // Try providers in order until one succeeds
    for (let i = 0; i < this.preferredProviders.length; i++) {
      const provider = this.preferredProviders[i];
      
try {
        const result = await this.tryProvider(provider, request);
        return {
          ...result,
          provider,
          fallbackUsed: i > 0,
          processingTime: Date.now() - startTime
        } as AIResponse;
      } catch (error) {
        console.warn(`Provider ${provider} failed:`, error);
        
        // If this is the last provider, throw the error
        if (i === this.preferredProviders.length - 1) {
          throw error;
        }
        
        // Continue to next provider
        continue;
      }
    }

    // Fallback to rule-based processing if all AI providers fail
    return this.processWithRules(request, startTime, true);
  }

  private shouldUseAI(request: AIRequest): boolean {
    // Don't use AI for basic operations or if explicitly disabled
    if (!request.requiresAI) return false;
    
    // Check data sensitivity restrictions
    if (request.sensitivity === 'restricted') return false;
    
    // Check if user has restricted AI processing for this data type
    // This would be checked against user preferences stored in database
    return true;
  }

  private async tryProvider(provider: AIProvider, request: AIRequest): Promise<Partial<AIResponse>> {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), this.timeoutMs)
    );

    const requestPromise = this.makeProviderRequest(provider, request);

    try {
      const result = await Promise.race([requestPromise, timeoutPromise]);
      return result as Partial<AIResponse>;
    } catch (error) {
      throw new Error(`Provider ${provider} failed: ${error.message}`);
    }
  }

  private async makeProviderRequest(provider: AIProvider, request: AIRequest): Promise<Partial<AIResponse>> {
    const sanitizedData = this.sanitizeData(request.data, request.sensitivity);
    
    switch (provider) {
      case 'anthropic':
        return this.callAnthropic(request.prompt, sanitizedData, request.parameters);
      case 'openai':
        return this.callOpenAI(request.prompt, sanitizedData, request.parameters);
      case 'basic':
        return this.processWithRules(request, Date.now());
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async callAnthropic(prompt: string, data: any, parameters?: AIParameters): Promise<Partial<AIResponse>> {
    const response = await supabase.functions.invoke('anthropic-chat', {
      body: {
        message: this.buildPrompt(prompt, data, parameters),
        systemPrompt: this.buildSystemPrompt(parameters),
        model: 'claude-3-5-sonnet-20241022'
      }
    });

    if (response.error) throw new Error(response.error.message);

    return {
      content: response.data.generatedText,
      processingType: 'ai',
      confidence: 0.85,
      explanation: 'Generated using Anthropic Claude with advanced reasoning capabilities'
    };
  }

  private async callOpenAI(prompt: string, data: any, parameters?: AIParameters): Promise<Partial<AIResponse>> {
    const response = await supabase.functions.invoke('openai-chat', {
      body: {
        message: this.buildPrompt(prompt, data, parameters),
        systemPrompt: this.buildSystemPrompt(parameters),
        model: 'gpt-4-turbo'
      }
    });

    if (response.error) throw new Error(response.error.message);

    return {
      content: response.data.generatedText,
      processingType: 'ai',
      confidence: 0.80,
      explanation: 'Generated using OpenAI GPT-4 with broad knowledge and pattern recognition'
    };
  }

  private processWithRules(request: AIRequest, startTime: number, isFallback = false): AIResponse {
    // Implement rule-based processing logic
    let content = '';
    let confidence = 0.95;

    // Example rule-based analysis
    if (request.data.applications) {
      const apps = request.data.applications;
      const totalApps = apps.length;
      const cdlHolders = apps.filter(app => app.cdl === 'Yes').length;
      const experienced = apps.filter(app => app.months === '48+').length;

      content = `Rule-based Analysis:
• Total Applications: ${totalApps}
• CDL Holders: ${cdlHolders} (${((cdlHolders/totalApps)*100).toFixed(1)}%)
• Experienced Candidates: ${experienced} (${((experienced/totalApps)*100).toFixed(1)}%)
• Recommendation: Focus on candidates with both CDL and 48+ months experience`;
    }

    return {
      content,
      provider: 'basic',
      processingType: 'rule-based',
      confidence,
      explanation: isFallback 
        ? 'AI providers unavailable - using rule-based analysis as fallback'
        : 'Using optimized rule-based analysis for cost efficiency',
      fallbackUsed: isFallback,
      processingTime: Date.now() - startTime
    };
  }

  private sanitizeData(data: any, sensitivity: DataSensitivity): any {
    // Remove or mask sensitive information based on sensitivity level
    const sanitized = { ...data };

    if (sensitivity === 'sensitive' || sensitivity === 'restricted') {
      // Remove PII
      if (sanitized.applications) {
        sanitized.applications = sanitized.applications.map(app => ({
          ...app,
          applicant_email: undefined,
          first_name: undefined,
          last_name: undefined,
          full_name: undefined,
          phone: undefined
        }));
      }
    }

    if (sensitivity === 'restricted') {
      // Remove all identifying information
      if (sanitized.applications) {
        sanitized.applications = sanitized.applications.map(app => ({
          cdl: app.cdl,
          exp: app.exp,
          months: app.months,
          veteran: app.veteran,
          city: app.city ? 'CITY_MASKED' : undefined,
          state: app.state
        }));
      }
    }

    return sanitized;
  }

  private buildPrompt(basePrompt: string, data: any, parameters?: AIParameters): string {
    let prompt = basePrompt;

    if (parameters) {
      prompt += `\n\nAnalysis Parameters:
- Experience Sensitivity: ${parameters.experienceSensitivity}
- Industry Focus: ${parameters.industryFocus}
- Bias Reduction: ${parameters.biasReduction ? 'Enabled' : 'Disabled'}
- Explanation Level: ${parameters.explainabilityLevel}`;
    }

    prompt += `\n\nData: ${JSON.stringify(data, null, 2)}`;
    return prompt;
  }

  private buildSystemPrompt(parameters?: AIParameters): string {
    let systemPrompt = 'You are an expert recruitment analyst specializing in applicant tracking and hiring optimization.';

    if (parameters?.biasReduction) {
      systemPrompt += ' Focus on objective, bias-free analysis that promotes fair hiring practices.';
    }

    if (parameters?.industryFocus) {
      systemPrompt += ` Tailor your analysis for the ${parameters.industryFocus} industry.`;
    }

    if (parameters?.explainabilityLevel === 'comprehensive') {
      systemPrompt += ' Provide detailed explanations for all recommendations and insights.';
    }

    return systemPrompt;
  }

  // Method to update provider preferences
  updateProviderPreference(providers: AIProvider[]) {
    this.preferredProviders = providers;
  }

  // Method to check provider health
  async checkProviderHealth(): Promise<Record<AIProvider, boolean>> {
    const health: Record<AIProvider, boolean> = {
      openai: false,
      anthropic: false,
      basic: true // Always available
    };

    // Test each provider with a simple request
    for (const provider of ['openai', 'anthropic'] as AIProvider[]) {
      try {
        await this.tryProvider(provider, {
          prompt: 'Test connectivity',
          data: { test: true },
          sensitivity: 'public',
          requiresAI: true
        });
        health[provider] = true;
      } catch {
        health[provider] = false;
      }
    }

    return health;
  }
}

export const aiService = new AIService();