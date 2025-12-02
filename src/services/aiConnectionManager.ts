import { supabase } from '@/integrations/supabase/client';

export type AIProvider = 'openai' | 'anthropic' | 'elevenlabs' | 'grok';

export interface AIConnectionStatus {
  provider: AIProvider;
  isConnected: boolean;
  lastChecked: Date;
  latency?: number;
  error?: string;
  model?: string;
}

export interface AIProviderConfig {
  provider: AIProvider;
  model: string;
  testMessage: string;
  timeout: number;
}

class AIConnectionManager {
  private connectionStatus: Map<AIProvider, AIConnectionStatus> = new Map();
  private checkInterval: number | null = null;

  // Provider configurations with latest models
  private providerConfigs: Record<AIProvider, AIProviderConfig> = {
    openai: {
      provider: 'openai',
      model: 'gpt-5-2025-08-07', // Latest flagship model
      testMessage: 'Test connection - respond with "OK"',
      timeout: 10000
    },
    anthropic: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514', // Latest Claude model
      testMessage: 'Test connection - respond with "OK"',
      timeout: 10000
    },
    elevenlabs: {
      provider: 'elevenlabs',
      model: 'eleven_multilingual_v2', // Latest ElevenLabs model
      testMessage: 'Test agent connection',
      timeout: 15000
    },
    grok: {
      provider: 'grok',
      model: 'grok-2-1212', // Latest Grok model
      testMessage: 'Test connection - respond with "OK"',
      timeout: 10000
    }
  };

  async checkConnection(provider: AIProvider): Promise<AIConnectionStatus> {
    const config = this.providerConfigs[provider];
    const startTime = Date.now();
    
    try {
      let response;
      let isConnected = false;
      
      switch (provider) {
        case 'openai':
          response = await supabase.functions.invoke('openai-chat', {
            body: {
              message: config.testMessage,
              model: config.model
            }
          });
          isConnected = !response.error && response.data && (response.data.generatedText || response.data.choices);
          break;
          
        case 'anthropic':
          response = await supabase.functions.invoke('anthropic-chat', {
            body: {
              message: config.testMessage,
              model: config.model
            }
          });
          isConnected = !response.error && response.data && response.data.generatedText;
          break;
          
        case 'elevenlabs':
          // ElevenLabs requires a valid agent ID to test
          // We use a dummy ID - if we get "not found" it means API key is valid
          response = await supabase.functions.invoke('elevenlabs-agent', {
            body: {
              agentId: 'connection-test'
            }
          });
          // If we get a 404 "not found" error, it means the API key is valid
          // (authentication passed, just the agent doesn't exist)
          if (response.data?.error?.includes('not found') || 
              response.data?.success === true) {
            isConnected = true;
          } else if (response.error?.message?.includes('not configured')) {
            isConnected = false;
          } else {
            // Any other response means the edge function is reachable
            isConnected = !response.error;
          }
          break;
          
        case 'grok':
          // Grok expects messages array format
          response = await supabase.functions.invoke('grok-chat', {
            body: {
              messages: [{ role: 'user', content: config.testMessage }],
              model: config.model,
              stream: false
            }
          });
          isConnected = !response.error && response.data && (response.data.choices || response.data.content);
          break;
      }

      const latency = Date.now() - startTime;
      
      const status: AIConnectionStatus = {
        provider,
        isConnected,
        lastChecked: new Date(),
        latency,
        model: config.model
      };

      if (response.error) {
        status.error = response.error.message;
        status.isConnected = false;
      } else if (!isConnected && response.data?.error) {
        status.error = response.data.error;
      }

      this.connectionStatus.set(provider, status);
      return status;
      
    } catch (error) {
      const status: AIConnectionStatus = {
        provider,
        isConnected: false,
        lastChecked: new Date(),
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Connection failed',
        model: config.model
      };
      
      this.connectionStatus.set(provider, status);
      return status;
    }
  }

  async checkAllConnections(): Promise<AIConnectionStatus[]> {
    console.log('Checking all AI provider connections...');
    
    const providers: AIProvider[] = ['openai', 'anthropic', 'elevenlabs', 'grok'];
    const results = await Promise.allSettled(
      providers.map(provider => this.checkConnection(provider))
    );
    
    const statuses = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          provider: providers[index],
          isConnected: false,
          lastChecked: new Date(),
          error: result.reason?.message || 'Unknown error'
        };
      }
    });
    
    console.log('AI connection status:', statuses);
    return statuses;
  }

  getConnectionStatus(provider: AIProvider): AIConnectionStatus | null {
    return this.connectionStatus.get(provider) || null;
  }

  getAllConnectionStatuses(): AIConnectionStatus[] {
    return Array.from(this.connectionStatus.values());
  }

  startPeriodicChecks(intervalMs: number = 300000) { // 5 minutes default
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    this.checkInterval = window.setInterval(() => {
      this.checkAllConnections();
    }, intervalMs);
    
    // Initial check
    this.checkAllConnections();
  }

  stopPeriodicChecks() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Update provider configuration
  updateProviderConfig(provider: AIProvider, config: Partial<AIProviderConfig>) {
    this.providerConfigs[provider] = {
      ...this.providerConfigs[provider],
      ...config
    };
  }

  // Get recommended provider based on connection status and performance
  getRecommendedProvider(): AIProvider | null {
    const statuses = this.getAllConnectionStatuses();
    const connectedProviders = statuses.filter(s => s.isConnected);
    
    if (connectedProviders.length === 0) {
      return null;
    }
    
    // Prefer providers with lower latency
    connectedProviders.sort((a, b) => (a.latency || Infinity) - (b.latency || Infinity));
    
    return connectedProviders[0].provider;
  }

  // Force refresh all connections
  async refreshAllConnections(): Promise<void> {
    console.log('Refreshing all AI platform connections...');
    
    // Clear existing status
    this.connectionStatus.clear();
    
    // Check all connections
    await this.checkAllConnections();
    
    console.log('AI platform connections refreshed');
  }

  // Get provider health summary
  getHealthSummary(): {
    totalProviders: number;
    connectedProviders: number;
    healthPercentage: number;
    fastestProvider: AIProvider | null;
    avgLatency: number;
  } {
    const statuses = this.getAllConnectionStatuses();
    const connected = statuses.filter(s => s.isConnected);
    const latencies = connected.map(s => s.latency).filter(l => l !== undefined) as number[];
    
    return {
      totalProviders: statuses.length,
      connectedProviders: connected.length,
      healthPercentage: statuses.length > 0 ? (connected.length / statuses.length) * 100 : 0,
      fastestProvider: connected.length > 0 ? this.getRecommendedProvider() : null,
      avgLatency: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0
    };
  }
}

// Singleton instance
export const aiConnectionManager = new AIConnectionManager();