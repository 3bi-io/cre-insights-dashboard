/**
 * Job share actions (LinkedIn, X, copy link, native share)
 * Extracted from JobDetailsPage for reusability
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Linkedin, Copy, Check, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface JobShareActionsProps {
  canonicalUrl: string;
  title: string;
  company: string;
  /** 'card' renders inside a Card, 'inline' renders bare buttons */
  variant?: 'card' | 'inline';
}

export const JobShareActions = ({
  canonicalUrl,
  title,
  company,
  variant = 'inline',
}: JobShareActionsProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(canonicalUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}`,
      '_blank'
    );
  };

  const shareOnX = () => {
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(`${title} at ${company}`)}&url=${encodeURIComponent(canonicalUrl)}`,
      '_blank'
    );
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Check out this job: ${title} at ${company}`,
          url: canonicalUrl,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const buttons = (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={shareOnLinkedIn} className="flex-1" aria-label="Share on LinkedIn">
        <Linkedin className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={shareOnX} className="flex-1" aria-label="Share on X">
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </Button>
      <Button variant="outline" size="sm" onClick={handleCopyLink} className="flex-1" aria-label="Copy link">
        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
      </Button>
      <Button variant="outline" size="sm" onClick={handleShare} className="flex-1 sm:hidden" aria-label="Share">
        <Share2 className="h-4 w-4" />
      </Button>
    </div>
  );

  if (variant === 'card') {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium text-muted-foreground mb-3">Share this job</p>
          {buttons}
        </CardContent>
      </Card>
    );
  }

  return buttons;
};
