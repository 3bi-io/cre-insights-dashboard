/**
 * Embed Code Snippet Component
 * 
 * Displays copyable widget code with syntax highlighting and instructions.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Copy, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateWidgetCode, generateWidgetCodeWithOptions } from '@/hooks/useEmbedTokens';

interface EmbedCodeSnippetProps {
  token: string;
  jobTitle?: string;
}

export function EmbedCodeSnippet({ token, jobTitle }: EmbedCodeSnippetProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const basicCode = generateWidgetCode(token);
  const customCode = generateWidgetCodeWithOptions(token, {
    containerId: 'my-job-form',
    minHeight: 700,
  });

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Code copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please select and copy the code manually.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="relative">
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
              <code>{basicCode}</code>
            </pre>
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => handleCopy(basicCode)}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>

          <div className="flex items-start gap-2 p-3 bg-info/10 rounded-lg text-sm">
            <Info className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
            <div className="text-foreground">
              Paste this code anywhere in your HTML where you want the {jobTitle ? `"${jobTitle}"` : 'job'} application form to appear.
            </div>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <div className="relative">
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
              <code>{customCode}</code>
            </pre>
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => handleCopy(customCode)}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>

          <div className="space-y-3 text-sm">
            <h4 className="font-medium">Available Options</h4>
            <div className="grid gap-2">
              <div className="flex items-start gap-2">
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">data-container</code>
                <span className="text-muted-foreground">ID of the container element (default: "ats-apply-widget")</span>
              </div>
              <div className="flex items-start gap-2">
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">data-min-height</code>
                <span className="text-muted-foreground">Minimum height in pixels (default: 600)</span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="border-t pt-4">
        <h4 className="font-medium text-sm mb-2">Widget Events</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Listen for these events on the <code className="bg-muted px-1 rounded">window</code> object:
        </p>
        <div className="grid gap-1.5 text-sm">
          <div className="flex gap-2">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">ats_widget_ready</code>
            <span className="text-muted-foreground">Widget loaded successfully</span>
          </div>
          <div className="flex gap-2">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">ats_widget_resize</code>
            <span className="text-muted-foreground">Form height changed</span>
          </div>
          <div className="flex gap-2">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">ats_application_submitted</code>
            <span className="text-muted-foreground">Application submitted successfully</span>
          </div>
          <div className="flex gap-2">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">ats_widget_error</code>
            <span className="text-muted-foreground">Error loading widget</span>
          </div>
        </div>
      </div>
    </div>
  );
}
