import { supabase } from '@/integrations/supabase/client';
import { cacheService } from './cacheService';
import { truthContractService, type TruthContractRequest, type TruthContractValidation } from './truthContract';
import { logger } from '@/lib/logger';

export type AIProvider = 'openai' | 'anthropic' | 'grok' | 'basic';
export type DataSensitivity = 'public' | 'internal' | 'sensitive' | 'restricted';

export interface AIRequestData {
  applications?: Array<{
    cdl?: string;
    exp?: string;
    months?: string;
    veteran?: string;
    city?: string;
    state?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export interface AIRequest {
  prompt: string;
  data: AIRequestData;
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
  truthValidation?: TruthContractValidation;
  isValidated: boolean;
  originalContent?: string; // Store original before truth contract corrections
}

class AIService {
  private preferredProviders: AIProvider[] = ['anthropic', 'grok', 'openai', 'basic'];
  private maxRetries = 3;
  private timeoutMs = 30000;

  async processRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = cacheService.getCacheKey(request.data, 'auto', request.parameters);
    const cachedResult = await cacheService.get(cacheKey);
    
    if (cachedResult && typeof cachedResult === 'object' && cachedResult !== null) {
      const cached = cachedResult as AIResponse;
      return {
        content: cached.content || '',
        provider: cached.provider || 'basic',
        processingType: cached.processingType || 'rule-based',
        confidence: cached.confidence || 0,
        explanation: cached.explanation,
        fallbackUsed: false,
        processingTime: Date.now() - startTime,
        truthValidation: cached.truthValidation,
        isValidated: cached.isValidated || false,
        originalContent: cached.originalContent,
      };
    }

    // Check if AI processing is required and allowed
    if (!this.shouldUseAI(request)) {
      const result = this.processWithRules(request, startTime);
      // Cache rule-based results for shorter time
      await cacheService.set(request.data, result, 'basic', request.parameters, 1, 'rule-based');
      return result;
    }

    // Try providers in order until one succeeds
    for (let i = 0; i < this.preferredProviders.length; i++) {
      const provider = this.preferredProviders[i];
      
      try {
        const result = await this.tryProvider(provider, request);
        
        // Apply Truth Contract validation
        const truthValidation = await this.validateWithTruthContract({
          content: result.content || '',
          prompt: request.prompt,
          context: request.data,
          provider: provider,
          model: this.getModelForProvider(provider)
        });

        let finalContent = result.content;
        let isValidated = false;

        // If truth contract validation fails, attempt correction or rejection
        if (!truthValidation.isValid) {
          logger.warn('Truth Contract validation failed', { truthValidation }, 'AIService');
          
          if (truthValidation.score < 50 || truthValidation.violations.some(v => v.severity === 'critical')) {
            // Critical failures - reject and try next provider
            throw new Error(`Truth Contract validation failed with critical violations: ${truthValidation.violations.map(v => v.description).join(', ')}`);
          } else {
            // Attempt correction
            const correctedContent = await this.attemptTruthCorrection(result.content || '', truthValidation);
            if (correctedContent) {
              finalContent = correctedContent;
              isValidated = true;
            }
          }
        } else {
          isValidated = true;
        }

        const response = {
          ...result,
          content: finalContent,
          originalContent: result.content !== finalContent ? result.content : undefined,
          provider,
          fallbackUsed: i > 0,
          processingTime: Date.now() - startTime,
          truthValidation,
          isValidated
        } as AIResponse;

        // Only cache validated responses
        if (isValidated) {
          await cacheService.set(
            request.data, 
            response, 
            provider, 
            request.parameters, 
            24, 
            'ai', 
            response.confidence
          );
        }

        return response;
      } catch (error) {
        logger.warn(`Provider ${provider} failed`, { error }, 'AIService');
        
        // If this is the last provider, throw the error
        if (i === this.preferredProviders.length - 1) {
          throw error;
        }
        
        // Continue to next provider
        continue;
      }
    }

    // Fallback to rule-based processing if all AI providers fail
    const fallbackResult = this.processWithRules(request, startTime, true);
    await cacheService.set(request.data, fallbackResult, 'basic', request.parameters, 1, 'rule-based');
    return fallbackResult;
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
      case 'grok':
        return this.callGrok(request.prompt, sanitizedData, request.parameters);
      case 'basic':
        return this.processWithRules(request, Date.now());
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async callAnthropic(prompt: string, data: AIRequestData, parameters?: AIParameters): Promise<Partial<AIResponse>> {
    const response = await supabase.functions.invoke('anthropic-chat', {
      body: {
        message: this.buildPrompt(prompt, data, parameters),
        systemPrompt: this.buildSystemPrompt(parameters),
        model: 'claude-sonnet-4-5'
      }
    });

    if (response.error) throw new Error(response.error.message);

    return {
      content: response.data.generatedText,
      processingType: 'ai',
      confidence: 0.90,
      explanation: 'Generated using Anthropic Claude Sonnet 4.5 with enhanced reasoning capabilities'
    };
  }

  private async callOpenAI(prompt: string, data: AIRequestData, parameters?: AIParameters): Promise<Partial<AIResponse>> {
    const response = await supabase.functions.invoke('openai-chat', {
      body: {
        message: this.buildPrompt(prompt, data, parameters),
        systemPrompt: this.buildSystemPrompt(parameters),
        model: 'gpt-4o'
      }
    });

    if (response.error) throw new Error(response.error.message);

    return {
      content: response.data.generatedText,
      processingType: 'ai',
      confidence: 0.85,
      explanation: 'Generated using OpenAI GPT-4o with advanced reasoning capabilities'
    };
  }

  private async callGrok(prompt: string, data: AIRequestData, parameters?: AIParameters): Promise<Partial<AIResponse>> {
    const response = await supabase.functions.invoke('grok-chat', {
      body: {
        message: this.buildPrompt(prompt, data, parameters),
        systemPrompt: this.buildSystemPrompt(parameters),
        model: 'grok-2'
      }
    });

    if (response.error) throw new Error(response.error.message);

    return {
      content: response.data.generatedText,
      processingType: 'ai',
      confidence: 0.88,
      explanation: 'Generated using xAI Grok 2 with real-time knowledge and conversational reasoning'
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
      processingTime: Date.now() - startTime,
      isValidated: true, // Rule-based responses are considered validated
      truthValidation: {
        isValid: true,
        score: 95, // High score for rule-based logic
        violations: [],
        recommendations: []
      }
    };
  }

  private sanitizeData(data: AIRequestData, sensitivity: DataSensitivity): AIRequestData {
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

  private buildPrompt(basePrompt: string, data: AIRequestData, parameters?: AIParameters): string {
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

  private async validateWithTruthContract(request: TruthContractRequest): Promise<TruthContractValidation> {
    try {
      return await truthContractService.validateResponse(request);
    } catch (error) {
      logger.error('Truth Contract validation error', error, 'AIService');
      // Return minimal validation on error
      return {
        isValid: false,
        score: 0,
        violations: [{
          type: 'factual_error',
          severity: 'critical',
          description: 'Unable to validate response due to system error'
        }],
        recommendations: ['Manual review required']
      };
    }
  }

  private async attemptTruthCorrection(content: string, validation: TruthContractValidation): Promise<string | null> {
    if (validation.violations.length === 0) return content;

    const correctionPrompt = `
Original content has truth contract violations. Please provide a corrected version that addresses these issues:

VIOLATIONS:
${validation.violations.map(v => `- ${v.type} (${v.severity}): ${v.description}`).join('\n')}

RECOMMENDATIONS:
${validation.recommendations.join('\n')}

ORIGINAL CONTENT:
${content}

Provide only the corrected content that maintains the original intent while fixing all violations.
`;

    try {
      const response = await supabase.functions.invoke('anthropic-chat', {
        body: {
          message: correctionPrompt,
          systemPrompt: 'You are a content corrector. Provide only the corrected content without explanations.',
          model: 'claude-sonnet-4-5'
        }
      });

      if (response.error) return null;
      return response.data.generatedText;
    } catch (error) {
      logger.error('Truth correction failed', error, 'AIService');
      return null;
    }
  }

  private getModelForProvider(provider: AIProvider): string {
    switch (provider) {
      case 'openai':
        return 'gpt-4o';
      case 'anthropic':
        return 'claude-sonnet-4-5';
      case 'grok':
        return 'grok-2';
      default:
        return 'rule-based';
    }
  }

  // Method to check provider health
  async checkProviderHealth(): Promise<Record<AIProvider, boolean>> {
    const health: Record<AIProvider, boolean> = {
      openai: false,
      anthropic: false,
      grok: false,
      basic: true // Always available
    };

    // Test each provider with a simple request
    for (const provider of ['openai', 'anthropic', 'grok'] as AIProvider[]) {
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

  // Truth Contract management methods
  async getTruthContractHealth() {
    return await truthContractService.healthCheck();
  }

  updateTruthContractConfig(config: Record<string, unknown>) {
    truthContractService.updateConfig(config);
  }

  getTruthContractConfig() {
    return truthContractService.getConfig();
  }
}

export const aiService = new AIService();