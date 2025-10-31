import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface TruthContractRequest {
  content: string;
  prompt: string;
  context?: any;
  provider: string;
  model: string;
  userId?: string;
  sessionId?: string;
}

export interface TruthContractValidation {
  isValid: boolean;
  score: number; // 0-100
  violations: TruthViolation[];
  recommendations: string[];
  sources?: string[];
  uncertainties?: string[];
  factChecks?: FactCheck[];
}

export interface TruthViolation {
  type: 'factual_error' | 'misleading_claim' | 'unsupported_assertion' | 'bias_detected' | 'incomplete_response' | 'harmful_content';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence?: string;
  correction?: string;
}

export interface FactCheck {
  claim: string;
  verification: 'verified' | 'disputed' | 'unverifiable' | 'false';
  confidence: number;
  sources: string[];
}

export interface TruthContractConfig {
  enableFactChecking: boolean;
  enableBiasDetection: boolean;
  enableCompletenessValidation: boolean;
  enableSourceAttribution: boolean;
  minimumTruthScore: number;
  maxRetries: number;
  fallbackToHuman: boolean;
}

class TruthContractService {
  private config: TruthContractConfig = {
    enableFactChecking: true,
    enableBiasDetection: true,
    enableCompletenessValidation: true,
    enableSourceAttribution: true,
    minimumTruthScore: 85,
    maxRetries: 3,
    fallbackToHuman: false
  };

  private truthPromptTemplate = `
TRUTH CONTRACT VALIDATION SYSTEM
================================

You are a Truth Contract Validator. Your role is to ensure absolute truthfulness, completeness, and ethical compliance in AI responses.

CORE PRINCIPLES:
1. NEVER fabricate, invent, or speculate on facts
2. ALWAYS acknowledge uncertainty when information cannot be verified
3. PROVIDE complete responses that address all aspects of the request
4. IDENTIFY and mitigate potential biases
5. ATTRIBUTE sources when making claims
6. REFUSE to provide harmful, misleading, or incomplete information

VALIDATION CRITERIA:
- Factual Accuracy: All claims must be verifiable or clearly marked as uncertain
- Completeness: Response must thoroughly address the user's request
- Bias Detection: Identify and correct any prejudicial language or assumptions
- Source Attribution: Provide credible sources for factual claims
- Ethical Compliance: Ensure content promotes beneficial outcomes

RESPONSE FORMAT:
{
  "validation": {
    "isValid": boolean,
    "score": number (0-100),
    "violations": [array of violations],
    "recommendations": [array of improvement suggestions]
  },
  "correctedContent": "If violations found, provide corrected version",
  "factChecks": [array of fact verifications],
  "sources": [array of source attributions],
  "uncertainties": [array of acknowledged uncertainties]
}

CONTENT TO VALIDATE:
Prompt: {prompt}
AI Response: {content}
Context: {context}
Provider: {provider}
Model: {model}

Validate this content according to the Truth Contract principles.
`;

  async validateResponse(request: TruthContractRequest): Promise<TruthContractValidation> {
    try {
      logger.info('Truth Contract validation started', {
        provider: request.provider,
        model: request.model,
        userId: request.userId,
        sessionId: request.sessionId
      });

      // Primary validation using AI
      const validation = await this.performAIValidation(request);

      // Secondary checks
      const biasCheck = await this.detectBias(request.content);
      const completenessCheck = await this.validateCompleteness(request.content, request.prompt);
      const factualityCheck = await this.performFactChecking(request.content);

      // Combine all validations
      const combinedValidation = this.combineValidations(validation, biasCheck, completenessCheck, factualityCheck);

      // Log validation results
      logger.info('Truth Contract validation completed', {
        score: combinedValidation.score,
        violationCount: combinedValidation.violations.length,
        isValid: combinedValidation.isValid
      });

      // Store validation for auditing
      await this.storeValidationRecord(request, combinedValidation);

      return combinedValidation;

    } catch (error) {
      logger.error('Truth Contract validation failed', error);
      
      // Return safe fallback validation
      return {
        isValid: false,
        score: 0,
        violations: [{
          type: 'factual_error',
          severity: 'critical',
          description: 'Unable to validate response due to technical error',
          evidence: error.message
        }],
        recommendations: ['Manual review required', 'Consider alternative AI provider']
      };
    }
  }

  private async performAIValidation(request: TruthContractRequest): Promise<TruthContractValidation> {
    const validationPrompt = this.truthPromptTemplate
      .replace('{prompt}', request.prompt)
      .replace('{content}', request.content)
      .replace('{context}', JSON.stringify(request.context || {}))
      .replace('{provider}', request.provider)
      .replace('{model}', request.model);

    // Use Claude for validation (most reliable for this task)
    const response = await supabase.functions.invoke('anthropic-chat', {
      body: {
        message: validationPrompt,
        systemPrompt: 'You are a Truth Contract Validator. Respond only with valid JSON.',
        model: 'claude-3-5-sonnet-20241022'
      }
    });

    if (response.error) {
      throw new Error(`Validation failed: ${response.error.message}`);
    }

    try {
      const validationResult = JSON.parse(response.data.generatedText);
      return validationResult.validation;
    } catch (parseError) {
      throw new Error('Invalid validation response format');
    }
  }

  private async detectBias(content: string): Promise<Partial<TruthContractValidation>> {
    if (!this.config.enableBiasDetection) return { violations: [] };

    const biasPrompt = `
Analyze the following content for potential biases:
- Gender bias
- Racial or ethnic bias
- Age bias
- Cultural bias
- Confirmation bias
- Selection bias

Content: ${content}

Respond with JSON: {"biases": [{"type": "string", "severity": "low|medium|high", "description": "string", "evidence": "string"}]}
`;

    try {
      const response = await supabase.functions.invoke('anthropic-chat', {
        body: {
          message: biasPrompt,
          systemPrompt: 'You are a bias detection expert. Respond only with valid JSON.',
          model: 'claude-3-5-sonnet-20241022'
        }
      });

      if (response.error) return { violations: [] };

      const biasResult = JSON.parse(response.data.generatedText);
      return {
        violations: biasResult.biases.map(bias => ({
          type: 'bias_detected' as const,
          severity: bias.severity,
          description: bias.description,
          evidence: bias.evidence
        }))
      };
    } catch (error) {
      logger.warn('Bias detection failed', { error });
      return { violations: [] };
    }
  }

  private async validateCompleteness(content: string, originalPrompt: string): Promise<Partial<TruthContractValidation>> {
    if (!this.config.enableCompletenessValidation) return { violations: [] };

    const completenessPrompt = `
Evaluate if this response completely addresses the original request:

Original Request: ${originalPrompt}
AI Response: ${content}

Check for:
1. All questions answered
2. All requested information provided
3. Appropriate level of detail
4. No important omissions

Respond with JSON: {"isComplete": boolean, "missingElements": ["string"], "score": number}
`;

    try {
      const response = await supabase.functions.invoke('anthropic-chat', {
        body: {
          message: completenessPrompt,
          systemPrompt: 'You are a completeness validator. Respond only with valid JSON.',
          model: 'claude-3-5-sonnet-20241022'
        }
      });

      if (response.error) return { violations: [] };

      const completenessResult = JSON.parse(response.data.generatedText);
      
      if (!completenessResult.isComplete) {
        return {
          violations: [{
            type: 'incomplete_response',
            severity: completenessResult.score < 50 ? 'high' : 'medium',
            description: `Response is incomplete. Missing: ${completenessResult.missingElements.join(', ')}`,
            evidence: `Completeness score: ${completenessResult.score}%`
          }]
        };
      }

      return { violations: [] };
    } catch (error) {
      logger.warn('Completeness validation failed', { error });
      return { violations: [] };
    }
  }

  private async performFactChecking(content: string): Promise<Partial<TruthContractValidation>> {
    if (!this.config.enableFactChecking) return { factChecks: [] };

    const factCheckPrompt = `
Extract and verify factual claims from this content:

Content: ${content}

For each factual claim:
1. Identify the specific claim
2. Assess verifiability (verified/disputed/unverifiable/false)
3. Rate confidence (0-100)
4. Suggest sources if possible

Respond with JSON: {"claims": [{"claim": "string", "verification": "verified|disputed|unverifiable|false", "confidence": number, "sources": ["string"]}]}
`;

    try {
      const response = await supabase.functions.invoke('anthropic-chat', {
        body: {
          message: factCheckPrompt,
          systemPrompt: 'You are a fact-checking expert. Respond only with valid JSON.',
          model: 'claude-3-5-sonnet-20241022'
        }
      });

      if (response.error) return { factChecks: [] };

      const factCheckResult = JSON.parse(response.data.generatedText);
      
      const violations = factCheckResult.claims
        .filter(claim => claim.verification === 'false' || (claim.verification === 'disputed' && claim.confidence < 30))
        .map(claim => ({
          type: 'factual_error' as const,
          severity: claim.verification === 'false' ? 'critical' : 'high' as const,
          description: `Potentially false or disputed claim: ${claim.claim}`,
          evidence: `Verification: ${claim.verification}, Confidence: ${claim.confidence}%`
        }));

      return {
        factChecks: factCheckResult.claims,
        violations
      };
    } catch (error) {
      logger.warn('Fact checking failed', { error });
      return { factChecks: [] };
    }
  }

  private combineValidations(...validations: Partial<TruthContractValidation>[]): TruthContractValidation {
    const allViolations = validations.flatMap(v => v.violations || []);
    const allRecommendations = validations.flatMap(v => v.recommendations || []);
    const allFactChecks = validations.flatMap(v => v.factChecks || []);
    const allSources = validations.flatMap(v => v.sources || []);
    const allUncertainties = validations.flatMap(v => v.uncertainties || []);

    // Calculate combined score
    const criticalViolations = allViolations.filter(v => v.severity === 'critical').length;
    const highViolations = allViolations.filter(v => v.severity === 'high').length;
    const mediumViolations = allViolations.filter(v => v.severity === 'medium').length;
    const lowViolations = allViolations.filter(v => v.severity === 'low').length;

    let score = 100;
    score -= criticalViolations * 40;
    score -= highViolations * 20;
    score -= mediumViolations * 10;
    score -= lowViolations * 5;
    score = Math.max(0, score);

    const isValid = score >= this.config.minimumTruthScore && criticalViolations === 0;

    if (!isValid) {
      allRecommendations.push(
        'Response failed truth contract validation',
        'Manual review required before use',
        'Consider regenerating with stricter guidelines'
      );
    }

    return {
      isValid,
      score,
      violations: allViolations,
      recommendations: [...new Set(allRecommendations)], // Remove duplicates
      factChecks: allFactChecks,
      sources: [...new Set(allSources)],
      uncertainties: [...new Set(allUncertainties)]
    };
  }

  private async storeValidationRecord(request: TruthContractRequest, validation: TruthContractValidation): Promise<void> {
    try {
      // Log validation for auditing (using console for now since table doesn't exist)
      logger.info('Truth Contract Validation Record', {
        provider: request.provider,
        model: request.model,
        prompt_hash: this.hashString(request.prompt),
        content_hash: this.hashString(request.content),
        validation_score: validation.score,
        is_valid: validation.isValid,
        violation_count: validation.violations.length,
        critical_violations: validation.violations.filter(v => v.severity === 'critical').length,
        user_id: request.userId,
        session_id: request.sessionId,
        created_at: new Date().toISOString()
      });
      
      // TODO: Store in database when truth_contract_validations table is created
      // await supabase.from('truth_contract_validations').insert({...});
    } catch (error) {
      logger.warn('Failed to store validation record', { error });
    }
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Configuration methods
  updateConfig(newConfig: Partial<TruthContractConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Truth Contract configuration updated', newConfig);
  }

  getConfig(): TruthContractConfig {
    return { ...this.config };
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy', details: any }> {
    try {
      const testRequest: TruthContractRequest = {
        content: 'The sky is blue.',
        prompt: 'What color is the sky?',
        provider: 'test',
        model: 'test'
      };

      const validation = await this.validateResponse(testRequest);
      
      return {
        status: validation.isValid ? 'healthy' : 'degraded',
        details: {
          validationWorking: true,
          lastScore: validation.score,
          config: this.config
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          validationWorking: false
        }
      };
    }
  }
}

export const truthContractService = new TruthContractService();