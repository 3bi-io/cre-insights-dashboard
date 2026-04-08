/**
 * Map AI Assistant Panel
 * Inline AI Job Search Guide with context-aware insights, quick actions, and conversation
 */

import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Send, ChevronDown, ChevronUp, MapPin, Navigation, Globe, Briefcase, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMapContextOptional } from './MapContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMapAIChat, type MapContextForAI, type ParsedAction } from '@/hooks/useMapAIChat';
import type { JobMapFilters } from '@/hooks/useJobMapData';
import type { DisplayMode } from './constants';

interface MapAIAssistantPanelProps {
  totalJobs: number;
  uniqueLocations: number;
  jobsWithLocation: number;
  exactCount: number;
  stateCount: number;
  countryCount: number;
  visibleJobs: number;
  filters: JobMapFilters;
  displayMode: DisplayMode;
  companies: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  isLoading?: boolean;
  onFiltersChange: (filters: JobMapFilters) => void;
  onDisplayModeChange: (mode: DisplayMode) => void;
}

const QUICK_ACTIONS = [
  { label: 'Strongest markets', prompt: 'What are the strongest hiring markets on this map right now? Where should I focus my job search?' },
  { label: 'Exact locations', action: 'filter_exact_only' as const },
  { label: 'Compare companies', prompt: 'Compare the top companies hiring in the current view. Which ones have the most positions and where?' },
  { label: 'Refine my search', prompt: 'Help me refine my job search based on the current map. What filters or strategies would help me find the best opportunities?' },
  { label: 'Summarize area', prompt: 'Summarize the job opportunities visible in this area. What types of roles are available and where are they concentrated?' },
];

export const MapAIAssistantPanel = memo(function MapAIAssistantPanel({
  totalJobs,
  uniqueLocations,
  jobsWithLocation,
  exactCount,
  stateCount,
  countryCount,
  visibleJobs,
  filters,
  displayMode,
  companies,
  categories,
  isLoading,
  onFiltersChange,
  onDisplayModeChange,
}: MapAIAssistantPanelProps) {
  const mapContext = useMapContextOptional();
  const isMobileFallback = useIsMobile();
  const isMobile = mapContext?.isMobile ?? isMobileFallback;

  const STORAGE_KEY = 'map-assistant-expanded';

  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) return stored === 'true';
    } catch { /* ignore */ }
    return false; // minimized by default
  });
  const [inputValue, setInputValue] = useState('');

  const toggleExpanded = useCallback((next: boolean) => {
    setIsExpanded(next);
    try { localStorage.setItem(STORAGE_KEY, String(next)); } catch { /* ignore */ }
  }, []);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const mappedPercentage = totalJobs > 0
    ? Math.round((visibleJobs / totalJobs) * 100)
    : 100;

  const topCompanyNames = companies.slice(0, 5).map(c => c.name).join(', ');
  const topCategoryNames = categories.slice(0, 5).map(c => c.name).join(', ');

  const aiContext: MapContextForAI = {
    totalJobs,
    uniqueLocations,
    exactCount,
    stateCount,
    countryCount,
    visibleJobs,
    mappedPercentage,
    searchTerm: filters.searchTerm,
    companyFilter: filters.clientFilter ? companies.find(c => c.id === filters.clientFilter)?.name : undefined,
    categoryFilter: filters.categoryFilter ? categories.find(c => c.id === filters.categoryFilter)?.name : undefined,
    exactOnly: filters.exactOnly,
    topCompanies: topCompanyNames,
    topCategories: topCategoryNames,
    displayMode,
  };

  const {
    messages,
    isStreaming,
    initialInsight,
    initialActions,
    isInsightLoading,
    error,
    sendMessage,
  } = useMapAIChat(aiContext);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isStreaming) return;
    sendMessage(inputValue.trim());
    setInputValue('');
  }, [inputValue, isStreaming, sendMessage]);

  const handleQuickAction = useCallback((action: typeof QUICK_ACTIONS[0]) => {
    if ('action' in action && action.action === 'filter_exact_only') {
      onFiltersChange({ ...filters, exactOnly: !filters.exactOnly });
      return;
    }
    if ('prompt' in action && action.prompt) {
      sendMessage(action.prompt);
      if (!isExpanded) setIsExpanded(true);
    }
  }, [filters, onFiltersChange, sendMessage, isExpanded]);

  const handleAction = useCallback((action: ParsedAction) => {
    switch (action.type) {
      case 'filter_exact_only':
        onFiltersChange({ ...filters, exactOnly: true });
        break;
      case 'search':
        if (action.value) onFiltersChange({ ...filters, searchTerm: action.value });
        break;
      case 'clear_filters':
        onFiltersChange({});
        break;
      case 'density_mode':
        onDisplayModeChange('density');
        break;
      case 'detail_mode':
        onDisplayModeChange('detail');
        break;
    }
  }, [filters, onFiltersChange, onDisplayModeChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          'absolute z-[1000] bg-background/95 backdrop-blur-md rounded-lg shadow-lg border border-border animate-pulse',
          isMobile ? 'bottom-4 left-4 right-4 p-3' : 'bottom-4 left-4 p-3 w-80'
        )}
      >
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // Mobile collapsed state
  if (isMobile && !isExpanded) {
    return (
      <div className="absolute bottom-16 left-4 right-4 z-[1000]" role="complementary" aria-label="AI Job Search Guide">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full bg-background/95 backdrop-blur-md rounded-lg shadow-lg border border-border px-3 py-2.5 flex items-center gap-2 text-left transition-all duration-200 active:scale-[0.98]"
        >
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold">{visibleJobs}</span>
              <span className="text-muted-foreground">jobs</span>
              <span className="text-muted-foreground">·</span>
              <span className="font-semibold">{uniqueLocations}</span>
              <span className="text-muted-foreground">loc</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{mappedPercentage}%</span>
            </div>
            {initialInsight && (
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {initialInsight.slice(0, 60)}…
              </p>
            )}
          </div>
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'absolute z-[1000] bg-background/95 backdrop-blur-md rounded-lg shadow-lg border border-border/50 flex flex-col transition-all duration-200',
        isMobile
          ? 'bottom-16 left-2 right-2 max-h-[55vh]'
          : 'bottom-4 left-4 w-[360px] max-h-[45vh]'
      )}
      role="complementary"
      aria-label="AI Job Search Guide"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">AI Job Search Guide</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Context strip */}
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground mr-2">
            <span className="flex items-center gap-0.5">
              <Briefcase className="w-3 h-3" />
              {visibleJobs}
            </span>
            <span>·</span>
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              {uniqueLocations}
            </span>
            <span>·</span>
            <span>{mappedPercentage}%</span>
          </div>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsExpanded(false)}
              aria-label="Collapse assistant"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Context strip (mobile) */}
      {isMobile && (
        <div className="flex items-center justify-center gap-3 px-3 py-1.5 bg-muted/30 text-[10px] text-muted-foreground border-b border-border/30 shrink-0">
          <span className="flex items-center gap-1">
            <Briefcase className="w-3 h-3" /> {visibleJobs} jobs
          </span>
          <span className="flex items-center gap-1">
            <Navigation className="w-3 h-3 text-emerald-500" /> {exactCount}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-amber-500" /> {stateCount}
          </span>
          {countryCount > 0 && (
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-blue-500" /> {countryCount}
            </span>
          )}
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
            {mappedPercentage}%
          </Badge>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-2 space-y-3">
        {/* Initial insight */}
        {(isInsightLoading || initialInsight) && (
          <div className="text-sm text-foreground/90 leading-relaxed">
            {isInsightLoading && !initialInsight ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-xs">Analyzing job market…</span>
              </div>
            ) : (
              <p className="text-xs leading-relaxed">{initialInsight}</p>
            )}
          </div>
        )}

        {/* Quick actions */}
        <div className="flex flex-wrap gap-1.5">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action)}
              disabled={isStreaming}
              className={cn(
                'text-[11px] px-2.5 py-1.5 rounded-full border transition-all duration-150',
                'hover:bg-primary/10 hover:border-primary/30 hover:text-primary',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                action.action === 'filter_exact_only' && filters.exactOnly
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-muted/50 border-border text-muted-foreground',
              )}
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Conversation thread */}
        {messages.map((msg) => (
          <div key={msg.id} className={cn('text-xs', msg.role === 'user' ? 'text-right' : '')}>
            {msg.role === 'user' ? (
              <div className="inline-block bg-primary text-primary-foreground rounded-lg px-3 py-2 max-w-[85%] text-left">
                {msg.content}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-muted/50 rounded-lg px-3 py-2 leading-relaxed">
                  {msg.content}
                </div>
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {msg.actions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleAction(action)}
                        className="text-[10px] px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Thinking…</span>
          </div>
        )}

        {error && (
          <div className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 p-2 shrink-0">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about jobs in this area…"
            disabled={isStreaming}
            className="h-9 text-xs min-h-[36px] md:min-h-[36px] md:h-9"
            aria-label="Ask the AI assistant"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || isStreaming}
            className="h-9 w-9 min-h-[36px] min-w-[36px] shrink-0"
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
});

export default MapAIAssistantPanel;
