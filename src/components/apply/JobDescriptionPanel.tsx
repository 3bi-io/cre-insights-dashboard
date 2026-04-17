import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { renderJobDescription } from '@/utils/markdownRenderer';
import { cn } from '@/lib/utils';

interface JobDescriptionPanelProps {
  description: string | null;
  summary?: string | null;
  jobTitle?: string | null;
}

/**
 * Renders the job description above the short application form.
 * SEO-friendly: content is in DOM (collapsed via max-height, not display:none)
 * so Indeed crawlers can read it.
 */
export const JobDescriptionPanel: React.FC<JobDescriptionPanelProps> = ({
  description,
  summary,
  jobTitle,
}) => {
  const [expanded, setExpanded] = useState(false);

  const content = description || summary || '';
  const html = useMemo(() => renderJobDescription(content), [content]);

  if (!content.trim()) return null;

  return (
    <section
      aria-label={jobTitle ? `About the ${jobTitle} role` : 'About this role'}
      className="mb-4 sm:mb-6 rounded-lg border border-border bg-muted/30 overflow-hidden"
    >
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
        <Briefcase className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-foreground">About this role</h2>
      </header>

      <div
        className={cn(
          'relative px-4 py-3 transition-all duration-300',
          !expanded && 'max-h-48 overflow-hidden sm:max-h-none sm:overflow-visible'
        )}
      >
        <div
          className="prose prose-sm dark:prose-invert max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {!expanded && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-muted/80 to-transparent sm:hidden"
            aria-hidden="true"
          />
        )}
      </div>

      <div className="sm:hidden px-4 pb-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          className="w-full"
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              Show less <ChevronUp className="ml-1 h-4 w-4" />
            </>
          ) : (
            <>
              Read more <ChevronDown className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </section>
  );
};
