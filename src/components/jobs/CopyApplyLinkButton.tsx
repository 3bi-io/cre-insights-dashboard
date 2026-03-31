import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link2, Copy, Check, ExternalLink, Twitter, Eye, Facebook, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useJobShortLinks } from '@/hooks/useJobShortLinks';
import { SITE_URL } from '@/config/siteConfig';

interface CopyApplyLinkButtonProps {
  jobId: string;
  jobTitle?: string;
  organizationId?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'icon';
}

export const CopyApplyLinkButton: React.FC<CopyApplyLinkButtonProps> = ({
  jobId,
  jobTitle,
  organizationId,
  variant = 'ghost',
  size = 'sm',
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const { toast } = useToast();
  const { buildApplyUrl, buildXApplyUrl, buildFacebookApplyUrl, buildTikTokApplyUrl, createShortLink, isCreating } = useJobShortLinks();

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setCopiedType(type);
      toast({
        title: 'Copied!',
        description: `${type} link copied to clipboard`,
      });
      setTimeout(() => {
        setCopied(false);
        setCopiedType(null);
      }, 2000);
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy manually',
        variant: 'destructive',
      });
    }
  };

  const handleCopyStandard = () => {
    const url = buildApplyUrl(jobId);
    copyToClipboard(url, 'Standard');
  };

  const handleCopyXLink = () => {
    const url = buildXApplyUrl(jobId);
    copyToClipboard(url, 'X Hiring');
  };

  const handleCopyWithUTM = (source: string) => {
    const url = buildApplyUrl(jobId, {
      utmSource: source.toLowerCase(),
      utmMedium: 'job_board',
    });
    copyToClipboard(url, source);
  };

  const handleCreateShortLink = async () => {
    const shortLink = await createShortLink({
      jobListingId: jobId,
      organizationId,
      utmSource: 'short_link',
    });

    if (shortLink) {
      const url = `${window.location.origin}/j/${shortLink.short_code}`;
      copyToClipboard(url, 'Short link');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Link2 className="w-4 h-4" />
          )}
          {size !== 'icon' && <span className="ml-1">Copy Link</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => {
          const url = `${SITE_URL}/jobs/${jobId}`;
          copyToClipboard(url, 'Live Preview');
        }}>
          <Eye className="w-4 h-4 mr-2" />
          Live Preview Link
          {copiedType === 'Live Preview' && <Check className="w-4 h-4 ml-auto text-green-500" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleCopyStandard}>
          <Copy className="w-4 h-4 mr-2" />
          Standard Apply Link
          {copiedType === 'Standard' && <Check className="w-4 h-4 ml-auto text-green-500" />}
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleCopyXLink}>
          <Twitter className="w-4 h-4 mr-2" />
          X Hiring Link
          {copiedType === 'X Hiring' && <Check className="w-4 h-4 ml-auto text-green-500" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleCreateShortLink} disabled={isCreating}>
          <ExternalLink className="w-4 h-4 mr-2" />
          {isCreating ? 'Creating...' : 'Create Short Link'}
          {copiedType === 'Short link' && <Check className="w-4 h-4 ml-auto text-green-500" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => handleCopyWithUTM('LinkedIn')}>
          <Copy className="w-4 h-4 mr-2" />
          LinkedIn (with UTM)
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleCopyWithUTM('Indeed')}>
          <Copy className="w-4 h-4 mr-2" />
          Indeed (with UTM)
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleCopyWithUTM('Facebook')}>
          <Copy className="w-4 h-4 mr-2" />
          Facebook (with UTM)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
