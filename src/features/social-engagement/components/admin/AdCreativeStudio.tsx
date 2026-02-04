import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Loader2, Save, RotateCcw, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { BenefitToggleGroup } from './BenefitToggle';
import { AdPreviewCard } from './AdPreviewCard';
import { PlatformPreviewTabs } from './PlatformPreviewTabs';
import { ExportMenu } from './ExportMenu';
import { SavedCreativesGallery } from './SavedCreativesGallery';
import { useAdCreative } from '../../hooks/useAdCreative';
import { validateContent, PLATFORM_LIMITS, getCharacterCount } from '../../utils/platformLimits';
import { 
  JOB_TYPES, 
  BENEFIT_OPTIONS, 
  ASPECT_RATIOS, 
  MEDIA_TYPES,
  type JobType,
  type BenefitId,
  type AspectRatio,
  type MediaType,
  type SocialBeaconPlatform,
} from '../../config/socialBeacons.config';
import type { AdCreativeConfig } from '../../types/adCreative.types';

interface AdCreativeStudioProps {
  organizationId?: string;
}

const DEFAULT_CONFIG: AdCreativeConfig = {
  jobType: 'regional',
  benefits: [],
  mediaType: 'ai_image',
  aspectRatio: '16:9',
  targetPlatforms: ['x', 'facebook'],
};

export function AdCreativeStudio({ organizationId }: AdCreativeStudioProps) {
  const [config, setConfig] = useState<AdCreativeConfig>(DEFAULT_CONFIG);
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<SocialBeaconPlatform>('x');
  const [activeTab, setActiveTab] = useState<'create' | 'gallery'>('create');

  const { 
    isGenerating, 
    currentPreview, 
    generateCreative, 
    saveCreative, 
    clearPreview,
    setCurrentPreview,
  } = useAdCreative(organizationId);

  const handleBenefitToggle = useCallback((benefitId: string) => {
    setConfig(prev => ({
      ...prev,
      benefits: prev.benefits.includes(benefitId as BenefitId)
        ? prev.benefits.filter(b => b !== benefitId)
        : [...prev.benefits, benefitId as BenefitId],
    }));
  }, []);

  const handleGenerate = async () => {
    await generateCreative({
      ...config,
      companyName: companyName || undefined,
      location: location || undefined,
      salaryRange: salaryRange || undefined,
      customPrompt: customPrompt || undefined,
    });
  };

  const handleSave = () => {
    if (currentPreview) {
      saveCreative.mutate(currentPreview);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    setCompanyName('');
    setLocation('');
    setSalaryRange('');
    setCustomPrompt('');
    clearPreview();
  };

  // Get content validation for selected platform
  const contentValidation = currentPreview 
    ? validateContent(
        selectedPlatform,
        currentPreview.content.headline,
        currentPreview.content.body,
        currentPreview.content.hashtags
      )
    : null;

  const platformLimit = PLATFORM_LIMITS[selectedPlatform];
  const bodyCharCount = currentPreview 
    ? getCharacterCount(currentPreview.content.body, platformLimit?.bodyLimit || 280)
    : null;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'create' | 'gallery')}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="create">
            <Sparkles className="h-4 w-4 mr-2" />
            Create New
          </TabsTrigger>
          <TabsTrigger value="gallery">
            <ImageIcon className="h-4 w-4 mr-2" />
            Saved Creatives
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Configuration Panel */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Ad Creative Generator
                </CardTitle>
                <CardDescription>
                  Configure your job ad and let AI generate compelling content with images
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Job Type */}
                <div className="space-y-2">
                  <Label htmlFor="jobType">Job Type</Label>
                  <Select
                    value={config.jobType}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, jobType: value as JobType }))}
                  >
                    <SelectTrigger id="jobType">
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex flex-col">
                            <span>{type.label}</span>
                            <span className="text-xs text-muted-foreground">{type.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Company Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      placeholder="Your Company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="City, State"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salaryRange">Salary Range (Optional)</Label>
                  <Input
                    id="salaryRange"
                    placeholder="$70,000 - $85,000/year"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                  />
                </div>

                {/* Benefits Selection */}
                <div className="space-y-2">
                  <Label>Key Benefits (Select all that apply)</Label>
                  <BenefitToggleGroup
                    benefits={BENEFIT_OPTIONS.map(b => ({ id: b.id, label: b.label, icon: b.icon }))}
                    selectedBenefits={config.benefits}
                    onToggle={handleBenefitToggle}
                    disabled={isGenerating}
                  />
                </div>

                {/* Media Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mediaType">Media Type</Label>
                    <Select
                      value={config.mediaType}
                      onValueChange={(value) => setConfig(prev => ({ ...prev, mediaType: value as MediaType }))}
                    >
                      <SelectTrigger id="mediaType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEDIA_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                    <Select
                      value={config.aspectRatio}
                      onValueChange={(value) => setConfig(prev => ({ ...prev, aspectRatio: value as AspectRatio }))}
                    >
                      <SelectTrigger id="aspectRatio">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASPECT_RATIOS.map((ratio) => (
                          <SelectItem key={ratio.id} value={ratio.id}>
                            <div className="flex flex-col">
                              <span>{ratio.label}</span>
                              <span className="text-xs text-muted-foreground">{ratio.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Custom Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="customPrompt">Additional Instructions (Optional)</Label>
                  <Textarea
                    id="customPrompt"
                    placeholder="Add any specific details or tone preferences..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button 
                    onClick={handleGenerate}
                    disabled={isGenerating || config.benefits.length === 0}
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Creative
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleReset}
                    disabled={isGenerating}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview Panel */}
            <div className="space-y-4">
              {/* Platform Preview Tabs */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Preview as
                </Label>
                <PlatformPreviewTabs
                  selectedPlatform={selectedPlatform}
                  onPlatformChange={setSelectedPlatform}
                />
              </div>

              {/* Character Count & Warnings */}
              {currentPreview && contentValidation && (
                <div className="space-y-2">
                  {bodyCharCount && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Body characters</span>
                      <span className={bodyCharCount.exceeded ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                        {bodyCharCount.count} / {platformLimit?.bodyLimit || 280}
                        {bodyCharCount.exceeded && ' (exceeds limit)'}
                      </span>
                    </div>
                  )}
                  {!contentValidation.valid && (
                    <div className="flex items-start gap-2 p-2 rounded-md bg-warning/10 border border-warning/20">
                      <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        {contentValidation.warnings.map((warning, idx) => (
                          <p key={idx} className="text-xs text-warning">{warning}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <AdPreviewCard 
                preview={currentPreview}
                platform={selectedPlatform}
                isLoading={isGenerating}
              />

              {currentPreview && (
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleSave}
                    disabled={saveCreative.isPending}
                  >
                    {saveCreative.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Creative
                  </Button>
                  <ExportMenu preview={currentPreview} />
                </div>
              )}

              {/* Image generation indicator */}
              {config.mediaType === 'ai_image' && (
                <p className="text-xs text-muted-foreground text-center">
                  ✨ AI will generate a custom image with your creative
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="mt-6">
          <SavedCreativesGallery 
            organizationId={organizationId}
            onSelectCreative={(creative) => {
              // Switch to create tab to show preview
              setActiveTab('create');
            }}
            onCreateNew={() => setActiveTab('create')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
