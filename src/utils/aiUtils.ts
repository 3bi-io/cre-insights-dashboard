// AI utility functions for processing and formatting responses

export interface AIRequest {
  message: string;
  model?: string;
  systemPrompt?: string;
  includeAnalytics?: boolean;
}

export interface AIResponse {
  generatedText: string;
  source: 'openai' | 'analytics' | 'fallback';
  model?: string;
  data?: any;
}

export const buildOpenAIRequest = (
  message: string,
  options: {
    model?: 'fast' | 'smart' | 'reasoning';
    systemPrompt?: string;
    includeAnalytics?: boolean;
  } = {}
): AIRequest => {
  const modelMap = {
    'fast': 'gpt-4o-mini',
    'smart': 'gpt-4o',
    'reasoning': 'o1-mini'
  };

  return {
    message,
    model: options.model ? modelMap[options.model] : 'gpt-4o',
    systemPrompt: options.systemPrompt,
    includeAnalytics: options.includeAnalytics || false
  };
};

export const formatAIResponse = (response: any): string => {
  if (typeof response === 'string') {
    return response;
  }

  if (response && typeof response.generatedText === 'string') {
    return response.generatedText;
  }

  if (response && typeof response.response === 'string') {
    return response.response;
  }

  console.warn('Unexpected AI response format:', response);
  return 'I apologize, but I couldn\'t process your request properly. Please try again.';
};

export const detectAnalyticsIntent = (message: string): boolean => {
  const analyticsKeywords = [
    'how many', 'total', 'count', 'analytics', 'data', 'metrics', 'performance',
    'applications', 'jobs', 'spending', 'budget', 'clients', 'platforms',
    'breakdown', 'distribution', 'trends', 'compare', 'analysis', 'show me',
    'what are', 'list', 'average', 'cost', 'roi', 'conversion', 'summary'
  ];
  
  return analyticsKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );
};

export const getPageSpecificPrompt = (page: string): string => {
  const prompts: Record<string, string> = {
    'dashboard': `You are helping a user analyze their recruitment marketing dashboard. Focus on:
    - Overall performance metrics and KPIs
    - Trend analysis and insights
    - Cost efficiency and ROI
    - Application conversion rates
    - Platform performance comparison`,
    
    'applications': `You are helping a user analyze application data. Focus on:
    - Application volume and trends
    - Source analysis and conversion rates
    - Candidate quality metrics
    - Application status breakdowns
    - Geographic and demographic insights`,
    
    'jobs': `You are helping a user analyze job listing performance. Focus on:
    - Job posting effectiveness
    - Platform performance comparison
    - Budget allocation and spending
    - Application rates per job
    - Job category performance`,
    
    'clients': `You are helping a user analyze client relationships and data. Focus on:
    - Client portfolio overview
    - Client activity and engagement
    - Revenue and relationship metrics
    - Client segmentation insights
    - Opportunity identification`,
    
    'platforms': `You are helping a user analyze platform performance. Focus on:
    - Platform ROI and effectiveness
    - Cost per application by platform
    - Platform-specific metrics
    - Performance benchmarking
    - Platform optimization recommendations`,
    
    'settings': `You are helping a user understand system configuration and analytics. Focus on:
    - System usage patterns
    - User activity insights
    - Configuration optimization
    - Performance monitoring
    - Security and access patterns`
  };

  return prompts[page] || prompts['dashboard'];
};

export const formatMetrics = (value: number, type: 'currency' | 'percentage' | 'number' = 'number'): string => {
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    
    case 'percentage':
      return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(value / 100);
    
    default:
      return new Intl.NumberFormat('en-US').format(value);
  }
};

export const generateQuickSuggestions = (page: string): string[] => {
  const suggestions: Record<string, string[]> = {
    'dashboard': [
      'Show me this month\'s performance summary',
      'Compare application trends over time',
      'What\'s my cost per application?'
    ],
    'applications': [
      'How many applications this week?',
      'Which sources perform best?',
      'Show application status breakdown'
    ],
    'jobs': [
      'Which jobs have the highest application rates?',
      'Compare platform performance',
      'Show my top spending jobs'
    ],
    'clients': [
      'Show client activity summary',
      'Which clients are most active?',
      'Analyze client distribution'
    ],
    'platforms': [
      'Compare platform ROI',
      'Show cost per application by platform',
      'Which platforms perform best?'
    ]
  };

  return suggestions[page] || suggestions['dashboard'];
};