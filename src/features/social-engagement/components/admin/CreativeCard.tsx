import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  MoreVertical, 
  Eye, 
  Trash2, 
  Copy, 
  Send,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { AdCreativeRecord } from '../../types/adCreative.types';

interface CreativeCardProps {
  creative: AdCreativeRecord;
  onPreview?: (creative: AdCreativeRecord) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (creative: AdCreativeRecord) => void;
  onPublish?: (creative: AdCreativeRecord) => void;
  isDeleting?: boolean;
  className?: string;
}

const JOB_TYPE_LABELS: Record<string, string> = {
  long_haul: 'Long Haul',
  regional: 'Regional',
  local: 'Local',
  dedicated: 'Dedicated',
  team: 'Team',
};

const BENEFIT_LABELS: Record<string, string> = {
  sign_on_bonus: 'Sign-on Bonus',
  home_weekly: 'Home Weekly',
  new_equipment: 'New Equipment',
  full_benefits: 'Full Benefits',
  pet_friendly: 'Pet Friendly',
  no_touch_freight: 'No Touch',
  paid_orientation: 'Paid Orientation',
  safety_bonuses: 'Safety Bonus',
  rider_policy: 'Rider Policy',
  direct_deposit: 'Direct Deposit',
  referral_bonus: 'Referral Bonus',
  health_insurance: 'Health Insurance',
};

export function CreativeCard({
  creative,
  onPreview,
  onDelete,
  onDuplicate,
  onPublish,
  isDeleting,
  className,
}: CreativeCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const jobTypeLabel = JOB_TYPE_LABELS[creative.job_type] || creative.job_type;
  const createdAt = new Date(creative.created_at);

  return (
    <>
      <Card className={cn(
        'group relative overflow-hidden transition-all hover:shadow-md',
        isDeleting && 'opacity-50 pointer-events-none',
        className
      )}>
        {/* Image Preview */}
        <div className="aspect-video relative bg-muted overflow-hidden">
          {creative.media_url ? (
            <img 
              src={creative.media_url} 
              alt={creative.headline}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => onPreview?.(creative)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
          </div>

          {/* Job Type Badge */}
          <Badge 
            className="absolute top-2 left-2 bg-background/90 text-foreground"
            variant="outline"
          >
            {jobTypeLabel}
          </Badge>
        </div>

        <CardContent className="p-3">
          {/* Headline */}
          <h4 className="font-medium text-sm line-clamp-2 mb-2">
            {creative.headline}
          </h4>

          {/* Meta info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
            
            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onPreview?.(creative)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate?.(creative)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPublish?.(creative)}>
                  <Send className="mr-2 h-4 w-4" />
                  Publish
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Benefits tags */}
          {creative.benefits && creative.benefits.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {creative.benefits.slice(0, 3).map((benefit, idx) => (
                <Badge 
                  key={idx} 
                  variant="secondary" 
                  className="text-[10px] px-1.5 py-0"
                >
                  {BENEFIT_LABELS[benefit] || benefit.replace(/_/g, ' ')}
                </Badge>
              ))}
              {creative.benefits.length > 3 && (
                <Badge 
                  variant="secondary" 
                  className="text-[10px] px-1.5 py-0"
                >
                  +{creative.benefits.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Creative</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{creative.headline}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.(creative.id);
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}