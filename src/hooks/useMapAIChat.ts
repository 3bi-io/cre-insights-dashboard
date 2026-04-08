/**
 * Map AI Chat Hook
 * Streaming chat with map-context injection for the AI Job Search Guide
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { JobMapFilters } from '@/hooks/useJobMapData';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: ParsedAction[];
}

export interface ParsedAction {
  type: string;
  value?: string;
  label: string;
}

export interface MapContextForAI {
  totalJobs: number;
  uniqueLocations: number;
  exactCount: number;
  stateCount: number;
  countryCount: number;
  visibleJobs: number;
  mappedPercentage: number;
  searchTerm?: string;
  companyFilter?: string;
  categoryFilter?: string;
  exactOnly?: boolean;
  topCompanies?: string;
  topCategories?: string;
  displayMode?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/map-ai-chat`;

function parseActions(content: string): ParsedAction[] {
  const actions: ParsedAction[] = [];
  const regex = /\[ACTION:(\w+)(?:\s+"([^"]*)")?\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const type = match[1];
    const value = match[2];
    let label = type.replace(/_/g, ' ');
    if (type === 'filter_exact_only') label = 'Show exact locations only';
    else if (type === 'search') label = `Search "${value}"`;
    else if (type === 'clear_filters') label = 'Clear all filters';
    else if (type === 'density_mode') label = 'Switch to Density mode';
    else if (type === 'detail_mode') label = 'Switch to Detail mode';
    actions.push({ type, value, label });
  }
  return actions;
}

function cleanContent(content: string): string {
  return content.replace(/\[ACTION:\w+(?:\s+"[^"]*")?\]/g, '').trim();
}

let idCounter = 0;
function genId() {
  return `msg-${Date.now()}-${++idCounter}`;
}

export function useMapAIChat(mapContext: MapContextForAI) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [initialInsight, setInitialInsight] = useState<string | null>(null);
  const [initialActions, setInitialActions] = useState<ParsedAction[]>([]);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const insightFetchedRef = useRef(false);
  const contextRef = useRef(mapContext);
  contextRef.current = mapContext;

  const streamRequest = useCallback(async (
    userMessages: { role: string; content: string }[],
    onDelta: (chunk: string) => void,
    onDone: (fullText: string) => void,
    signal?: AbortSignal,
  ) => {
    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: userMessages,
        mapContext: contextRef.current,
      }),
      signal,
    });

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(body.error || `Request failed (${resp.status})`);
    }

    if (!resp.body) throw new Error('No response body');

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIdx);
        buffer = buffer.slice(newlineIdx + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullText += content;
            onDelta(content);
          }
        } catch {
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    // Flush remaining
    if (buffer.trim()) {
      for (let raw of buffer.split('\n')) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);
        if (!raw.startsWith('data: ')) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullText += content;
            onDelta(content);
          }
        } catch { /* ignore */ }
      }
    }

    onDone(fullText);
  }, []);

  // Generate initial insight on first load
  useEffect(() => {
    if (insightFetchedRef.current || mapContext.totalJobs === 0) return;
    insightFetchedRef.current = true;
    setIsInsightLoading(true);

    const controller = new AbortController();
    let accumulated = '';

    streamRequest(
      [{ role: 'user', content: 'Give me a brief overview of the current job market shown on this map. What are the key highlights and what should I explore first?' }],
      (chunk) => {
        accumulated += chunk;
        setInitialInsight(cleanContent(accumulated));
      },
      (fullText) => {
        setInitialInsight(cleanContent(fullText));
        setInitialActions(parseActions(fullText));
        setIsInsightLoading(false);
      },
      controller.signal,
    ).catch((err) => {
      if (err.name !== 'AbortError') {
        setIsInsightLoading(false);
        setInitialInsight('Explore the map to discover job opportunities across the country. Use filters to narrow your search.');
      }
    });

    return () => controller.abort();
  }, [mapContext.totalJobs, streamRequest]);

  const sendMessage = useCallback(async (text: string) => {
    if (isStreaming || !text.trim()) return;

    setError(null);
    const userMsg: ChatMessage = { id: genId(), role: 'user', content: text };
    const assistantId = genId();

    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    const historyForApi = [
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: text },
    ];

    abortRef.current = new AbortController();
    let accumulated = '';

    try {
      await streamRequest(
        historyForApi,
        (chunk) => {
          accumulated += chunk;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.id === assistantId) {
              return prev.map(m => m.id === assistantId ? { ...m, content: cleanContent(accumulated) } : m);
            }
            return [...prev, { id: assistantId, role: 'assistant', content: cleanContent(accumulated) }];
          });
        },
        (fullText) => {
          const actions = parseActions(fullText);
          setMessages(prev =>
            prev.map(m => m.id === assistantId ? { ...m, content: cleanContent(fullText), actions } : m)
          );
          setIsStreaming(false);
        },
        abortRef.current.signal,
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Something went wrong');
        setIsStreaming(false);
      }
    }
  }, [isStreaming, messages, streamRequest]);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    messages,
    isStreaming,
    initialInsight,
    initialActions,
    isInsightLoading,
    error,
    sendMessage,
    cancelStream,
  };
}
