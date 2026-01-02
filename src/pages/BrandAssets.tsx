import { useState } from 'react';
import { Download, Palette, Image, Globe, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AssetCard, type AssetCardProps } from '@/components/brand/AssetCard';
import { downloadAsset } from '@/utils/assetDownload';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssetCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  assets: Omit<AssetCardProps, 'darkBackground'>[];
  darkBackground?: boolean;
}

const brandAssets: AssetCategory[] = [
  {
    id: 'primary-logos',
    name: 'Primary Logos',
    description: 'Main brand logos for various use cases',
    icon: <Palette className="h-5 w-5" />,
    assets: [
      {
        name: 'Primary Logo',
        filename: 'logo.png',
        path: '/logo.png',
        dimensions: '400×100',
        format: 'png',
        description: 'Main logo for light backgrounds',
      },
      {
        name: 'White Logo',
        filename: 'logo-white.png',
        path: '/logo-white.png',
        dimensions: '400×100',
        format: 'png',
        description: 'Logo for dark backgrounds',
      },
      {
        name: 'Icon Only',
        filename: 'logo-icon.png',
        path: '/logo-icon.png',
        dimensions: '100×100',
        format: 'png',
        description: 'Square icon for compact spaces',
      },
    ],
  },
  {
    id: 'favicons',
    name: 'Favicons & App Icons',
    description: 'Browser tabs, bookmarks, and app icons',
    icon: <Smartphone className="h-5 w-5" />,
    assets: [
      {
        name: 'Favicon',
        filename: 'favicon.png',
        path: '/favicon.png',
        dimensions: '64×64',
        format: 'png',
        description: 'Browser tab icon',
      },
      {
        name: 'Apple Touch Icon',
        filename: 'apple-touch-icon.png',
        path: '/apple-touch-icon.png',
        dimensions: '180×180',
        format: 'png',
        description: 'iOS home screen bookmark',
      },
      {
        name: 'PWA Icon (Large)',
        filename: 'icon-512.png',
        path: '/icon-512.png',
        dimensions: '512×512',
        format: 'png',
        description: 'Progressive Web App icon',
      },
    ],
  },
  {
    id: 'social',
    name: 'Social Media',
    description: 'Images optimized for social sharing',
    icon: <Globe className="h-5 w-5" />,
    assets: [
      {
        name: 'Open Graph Image',
        filename: 'og-image-new.png',
        path: '/og-image-new.png',
        dimensions: '1200×630',
        format: 'png',
        description: 'For Facebook, LinkedIn, and general sharing',
      },
    ],
  },
];

// Assets that should show on dark background
const darkBackgroundAssets = ['logo-white.png'];

const BrandAssets = () => {
  const [openCategories, setOpenCategories] = useState<string[]>(
    brandAssets.map((c) => c.id)
  );
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const toggleCategory = (id: string) => {
    setOpenCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    const allAssets = brandAssets.flatMap((cat) => cat.assets);
    
    try {
      for (const asset of allAssets) {
        await downloadAsset(asset.path, asset.filename);
        // Small delay to prevent browser blocking multiple downloads
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      toast.success(`Downloaded ${allAssets.length} assets`);
    } catch (error) {
      toast.error('Some downloads may have failed');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const totalAssets = brandAssets.reduce((acc, cat) => acc + cat.assets.length, 0);

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Brand Assets</h1>
          <p className="text-muted-foreground mt-1">
            Download official ATS.me logos and brand materials
          </p>
        </div>
        <Button
          size="lg"
          onClick={handleDownloadAll}
          disabled={isDownloadingAll}
          className="gap-2"
        >
          <Download className="h-5 w-5" />
          {isDownloadingAll ? 'Downloading...' : `Download All (${totalAssets})`}
        </Button>
      </div>

      {/* Brand Colors Quick Reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Brand Colors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#1e3a5f] border shadow-sm" />
              <div>
                <p className="font-medium text-sm">Navy Blue</p>
                <p className="text-xs text-muted-foreground">#1E3A5F</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#2dd4bf] border shadow-sm" />
              <div>
                <p className="font-medium text-sm">Teal Accent</p>
                <p className="text-xs text-muted-foreground">#2DD4BF</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-white border shadow-sm" />
              <div>
                <p className="font-medium text-sm">White</p>
                <p className="text-xs text-muted-foreground">#FFFFFF</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Categories */}
      <div className="space-y-4">
        {brandAssets.map((category) => (
          <Collapsible
            key={category.id}
            open={openCategories.includes(category.id)}
            onOpenChange={() => toggleCategory(category.id)}
          >
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {category.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {category.assets.length} {category.assets.length === 1 ? 'asset' : 'assets'}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 text-muted-foreground transition-transform",
                          openCategories.includes(category.id) && "rotate-180"
                        )}
                      />
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.assets.map((asset) => (
                      <AssetCard
                        key={asset.filename}
                        {...asset}
                        darkBackground={darkBackgroundAssets.includes(asset.filename)}
                      />
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>

      {/* Usage Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Image className="h-5 w-5" />
            Usage Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-green-600 dark:text-green-400 font-medium mb-2">✓ Do</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Use the primary logo on light backgrounds</li>
                <li>Use the white logo on dark or colored backgrounds</li>
                <li>Maintain clear space around the logo</li>
                <li>Use official brand colors</li>
              </ul>
            </div>
            <div>
              <h4 className="text-red-600 dark:text-red-400 font-medium mb-2">✗ Don't</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Stretch or distort the logo</li>
                <li>Change the logo colors</li>
                <li>Add effects like shadows or gradients</li>
                <li>Place on busy backgrounds without contrast</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandAssets;
