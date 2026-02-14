import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Sparkles, 
  LayoutGrid, 
  List,
  SlidersHorizontal,
  Image as ImageIcon,
} from 'lucide-react';
import { CreativeCard } from './CreativeCard';
import { RocketLaunchButton } from './RocketLaunchButton';
import { useAdCreative } from '../../hooks/useAdCreative';
import type { AdCreativeRecord, GeneratedAd } from '../../types/adCreative.types';
import type { AdCreativeConfig } from '../../types/adCreative.types';

interface SavedCreativesGalleryProps {
  organizationId?: string;
  onSelectCreative?: (creative: AdCreativeRecord) => void;
  onCreateNew?: () => void;
}

export function SavedCreativesGallery({
  organizationId,
  onSelectCreative,
  onCreateNew,
}: SavedCreativesGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJobType, setFilterJobType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const {
    savedCreatives,
    isLoadingCreatives,
    deleteCreative,
    setCurrentPreview,
  } = useAdCreative(organizationId);

  // Filter creatives based on search and job type
  const filteredCreatives = savedCreatives.filter(creative => {
    const matchesSearch = searchQuery === '' || 
      creative.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creative.body.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesJobType = filterJobType === 'all' || creative.job_type === filterJobType;
    
    return matchesSearch && matchesJobType;
  });

  const handlePreview = (creative: AdCreativeRecord) => {
    // Convert record to GeneratedAd format for preview
    const preview: GeneratedAd = {
      config: {
        jobType: creative.job_type as AdCreativeConfig['jobType'],
        benefits: (creative.benefits || []) as AdCreativeConfig['benefits'],
        mediaType: (creative.media_type || 'ai_image') as AdCreativeConfig['mediaType'],
        aspectRatio: (creative.aspect_ratio || '16:9') as AdCreativeConfig['aspectRatio'],
        targetPlatforms: ['x', 'facebook'],
      },
      content: {
        headline: creative.headline,
        body: creative.body,
        hashtags: creative.hashtags || [],
        callToAction: 'Apply Now',
      },
      mediaUrl: creative.media_url || undefined,
      generatedAt: creative.created_at,
      status: 'ready',
    };
    setCurrentPreview(preview);
    onSelectCreative?.(creative);
  };

  const handleDelete = (id: string) => {
    deleteCreative.mutate(id);
  };

  const handleDuplicate = (creative: AdCreativeRecord) => {
    // Set as current preview for editing
    handlePreview(creative);
    onCreateNew?.();
  };

  if (isLoadingCreatives) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Saved Creatives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Saved Creatives
            </CardTitle>
            <CardDescription>
              {savedCreatives.length} creative{savedCreatives.length !== 1 ? 's' : ''} saved
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <RocketLaunchButton
              unpublishedCount={savedCreatives.filter(
                c => !(c as any).status || ['draft', 'ready', 'queued'].includes((c as any).status)
              ).length}
            />
            <Button onClick={onCreateNew} size="sm">
              <Sparkles className="mr-2 h-4 w-4" />
              Create New
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search creatives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterJobType} onValueChange={setFilterJobType}>
            <SelectTrigger className="w-[160px]">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Job type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="long_haul">Long Haul</SelectItem>
              <SelectItem value="regional">Regional</SelectItem>
              <SelectItem value="local">Local</SelectItem>
              <SelectItem value="dedicated">Dedicated</SelectItem>
              <SelectItem value="team">Team</SelectItem>
            </SelectContent>
          </Select>
          <div className="hidden sm:flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredCreatives.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-medium text-muted-foreground mb-2">
              {savedCreatives.length === 0 ? 'No creatives yet' : 'No matching creatives'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {savedCreatives.length === 0 
                ? 'Create your first AI-powered ad creative to get started'
                : 'Try adjusting your search or filters'
              }
            </p>
            {savedCreatives.length === 0 && (
              <Button onClick={onCreateNew}>
                <Sparkles className="mr-2 h-4 w-4" />
                Create First Creative
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className={viewMode === 'grid' 
              ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
              : 'space-y-3'
            }>
              {filteredCreatives.map(creative => (
                <CreativeCard
                  key={creative.id}
                  creative={creative}
                  onPreview={handlePreview}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  isDeleting={deleteCreative.isPending}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
