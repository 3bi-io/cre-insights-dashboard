import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, ExternalLink, Briefcase } from 'lucide-react';
import { useJobGroupAI } from '@/hooks/useJobGroupAI';

interface JobGroupSuggestion {
  name: string;
  description: string;
  recommended_publisher: string;
  job_ids: string[];
  reasoning: string;
  benefits?: string;
}

interface Suggestion {
  id: string;
  suggested_groups: any;
  confidence_score: number;
  status: string;
  created_at: string;
}

interface JobGroupSuggestionsViewProps {
  suggestions: Suggestion[];
}

export const JobGroupSuggestionsView: React.FC<JobGroupSuggestionsViewProps> = ({
  suggestions,
}) => {
  const { acceptSuggestion, rejectSuggestion } = useJobGroupAI(null);

  const getPublisherColor = (publisher: string) => {
    const colors: Record<string, string> = {
      'Indeed': 'bg-blue-500/10 text-blue-500',
      'Indeed Premium': 'bg-purple-500/10 text-purple-500',
      'Facebook': 'bg-blue-600/10 text-blue-600',
      'LinkedIn': 'bg-blue-700/10 text-blue-700',
      'Google Jobs': 'bg-red-500/10 text-red-500',
      'Craigslist': 'bg-purple-600/10 text-purple-600',
    };
    return colors[publisher] || 'bg-muted text-muted-foreground';
  };

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No suggestions available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {suggestions.map((suggestion) => {
        const groups = Array.isArray(suggestion.suggested_groups) 
          ? suggestion.suggested_groups 
          : suggestion.suggested_groups?.groups || [];

        return (
          <Card key={suggestion.id} className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">AI Suggestion</h4>
                  <Badge variant="outline">
                    {Math.round(suggestion.confidence_score * 100)}% confidence
                  </Badge>
                  <Badge variant={suggestion.status === 'pending' ? 'secondary' : 'default'}>
                    {suggestion.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(suggestion.created_at).toLocaleDateString()}
                </p>
              </div>
              
              {suggestion.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acceptSuggestion(suggestion.id)}
                    className="text-green-500 hover:text-green-600"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectSuggestion(suggestion.id)}
                    className="text-destructive hover:text-destructive/90"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {groups.map((group: JobGroupSuggestion, idx: number) => (
                <div key={idx} className="border rounded-lg p-3 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Briefcase className="w-4 h-4 text-primary" />
                        <h5 className="font-medium">{group.name}</h5>
                        <Badge className={getPublisherColor(group.recommended_publisher)}>
                          <ExternalLink className="w-3 h-3 mr-1" />
                          {group.recommended_publisher}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    </div>
                    <Badge variant="outline">{group.job_ids?.length || 0} jobs</Badge>
                  </div>

                  {group.reasoning && (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                      <span className="font-medium">Reasoning:</span> {group.reasoning}
                    </div>
                  )}

                  {group.benefits && (
                    <div className="mt-2 p-2 bg-green-500/5 border border-green-500/20 rounded text-xs text-green-700 dark:text-green-400">
                      <span className="font-medium">Benefits:</span> {group.benefits}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
};