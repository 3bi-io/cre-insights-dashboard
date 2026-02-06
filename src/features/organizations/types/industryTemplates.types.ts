/**
 * Industry Template Type Definitions
 * Defines industry verticals and their configuration presets
 */

export type IndustryVertical = 
  | 'transportation' 
  | 'healthcare' 
  | 'cyber' 
  | 'trades' 
  | 'general';

export interface AIPromptHints {
  industryContext: string;
  terminology: string[];
  screeningFocus: string[];
}

export interface FeaturePreset {
  name: string;
  enabled: boolean;
  settings?: Record<string, unknown>;
}

export interface IndustryTemplateConfig {
  vertical: IndustryVertical;
  displayName: string;
  description: string;
  icon: string;
  defaultPlatforms: string[];
  defaultFeatures: FeaturePreset[];
  aiPromptHints: AIPromptHints;
}

export interface IndustryTemplate {
  id: string;
  vertical: IndustryVertical;
  display_name: string;
  description: string | null;
  default_platforms: string[];
  default_features: FeaturePreset[];
  ai_prompt_hints: AIPromptHints;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface IndustryVerticalOption {
  value: IndustryVertical;
  label: string;
  description: string;
  icon: string;
  features: string[];
}
