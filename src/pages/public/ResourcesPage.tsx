/**
 * Resources Page Component
 * Tabbed layout with search, download counts, and gated content pattern
 */

import React, { useState, useMemo } from 'react';
import { SEO } from '@/components/SEO';
import { StructuredData } from '@/components/StructuredData';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, FileText, Download, ExternalLink, Code,
  MessageCircle, Zap, Users, Settings, BarChart3,
  Loader2, Wrench, Video
} from 'lucide-react';
import { toast } from 'sonner';
import { generateFeatureGuidePDF, generateImplementationChecklistPDF, generateBestPracticesPDF } from '@/utils/resourcesPdfGenerator';
import { generateRoiCalculatorXLSX } from '@/utils/roiCalculatorGenerator';
import { logger } from '@/lib/logger';
import { PublicPageHero, FilterBar } from '@/components/shared';
import { buildBreadcrumbSchema } from '@/utils/breadcrumbSchema';
import trustHero from '@/assets/hero/trust-hero.png';
import { motion } from 'framer-motion';

type ResourceTab = 'all' | 'guides' | 'templates' | 'tools' | 'webinars';

const tabs = [
  { id: 'all' as const, label: 'All', icon: BookOpen },
  { id: 'guides' as const, label: 'Guides', icon: FileText },
  { id: 'templates' as const, label: 'Templates', icon: Download },
  { id: 'tools' as const, label: 'Tools', icon: Wrench },
  { id: 'webinars' as const, label: 'Webinars', icon: Video },
];

const ResourcesPage = () => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ResourceTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const gettingStarted = [
    { icon: Zap, title: 'Quick Start Guide', description: 'Get up and running in 15 minutes', duration: '5 min read', link: '/features', badge: 'Popular', step: 1, type: 'guides' as const },
    { icon: Users, title: 'Creating Your First Job', description: 'Browse real job listings as examples', duration: '8 min read', link: '/jobs', step: 2, type: 'guides' as const },
    { icon: Settings, title: 'Account Setup & Configuration', description: 'Get onboarding help from our team', duration: '10 min read', link: '/contact', badge: 'Contact Us', step: 3, type: 'guides' as const },
    { icon: Code, title: 'Integration Setup', description: 'Connect Tenstreet, job boards, and HRIS', duration: '12 min read', link: '/features', step: 4, type: 'tools' as const },
  ];

  const documentation = [
    { icon: FileText, title: 'API Documentation', description: 'Complete API reference and integration guides', link: '/contact', badge: 'Contact Us', type: 'tools' as const },
    { icon: Code, title: 'Webhook Integration', description: 'Set up real-time event notifications', link: '/contact', badge: 'Contact Us', type: 'tools' as const },
    { icon: BarChart3, title: 'Analytics Guide', description: 'Understanding your data and metrics', link: '/features', type: 'guides' as const },
    { icon: Settings, title: 'Admin Configuration', description: 'Advanced settings and customization', link: '/contact', badge: 'Contact Us', type: 'guides' as const },
  ];

  const downloads = [
    { id: 'feature-guide', title: 'Apply AI Feature Guide', size: '~50 KB', format: 'PDF', generator: generateFeatureGuidePDF, downloads: 234, type: 'guides' as const },
    { id: 'implementation', title: 'Implementation Checklist', size: '~45 KB', format: 'PDF', generator: generateImplementationChecklistPDF, downloads: 189, type: 'templates' as const },
    { id: 'roi-calculator', title: 'ROI Calculator Template', size: '~20 KB', format: 'XLSX', generator: generateRoiCalculatorXLSX, downloads: 312, type: 'templates' as const },
    { id: 'best-practices', title: 'Best Practices Guide', size: '~55 KB', format: 'PDF', generator: generateBestPracticesPDF, downloads: 156, type: 'guides' as const },
  ];

  const handleDownload = async (downloadId: string, generator: () => void, title: string) => {
    try {
      setDownloadingId(downloadId);
      generator();
      toast.success(`${title} downloaded successfully`);
    } catch (error) {
      logger.error('Download error:', error);
      toast.error('Failed to generate download. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredGuides = useMemo(() => {
    let items = gettingStarted;
    if (activeTab !== 'all') items = items.filter(i => i.type === activeTab);
    if (searchQuery) { const q = searchQuery.toLowerCase(); items = items.filter(i => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)); }
    return items;
  }, [activeTab, searchQuery]);

  const filteredDocs = useMemo(() => {
    let items = documentation;
    if (activeTab !== 'all') items = items.filter(i => i.type === activeTab);
    if (searchQuery) { const q = searchQuery.toLowerCase(); items = items.filter(i => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)); }
    return items;
  }, [activeTab, searchQuery]);

  const filteredDownloads = useMemo(() => {
    let items = downloads;
    if (activeTab !== 'all') items = items.filter(i => i.type === activeTab);
    if (searchQuery) { const q = searchQuery.toLowerCase(); items = items.filter(i => i.title.toLowerCase().includes(q)); }
    return items;
  }, [activeTab, searchQuery]);

  const breadcrumbs = buildBreadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Resources', href: '/resources' },
  ]);

  const resourcesSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Apply AI Resources & Documentation",
    "numberOfItems": downloads.length,
    "itemListElement": downloads.map((item, index) => ({
      "@type": "ListItem", "position": index + 1,
      "item": { "@type": "DigitalDocument", "name": item.title, "fileFormat": item.format }
    }))
  }), []);

  return (
    <>
      <SEO title="Resources & Documentation | Guides & Best Practices" description="Comprehensive knowledge base for Apply AI. Quick start guides, API docs, and downloadable resources." canonical="https://applyai.jobs/resources" ogImage="https://applyai.jobs/og-resources.png" />
      <StructuredData data={[resourcesSchema, breadcrumbs]} />
      <div className="min-h-screen animate-page-in">
        <PublicPageHero
          imageSrc={trustHero}
          imageAlt="Professional knowledge base and documentation"
          badge="Knowledge Base"
          title="Resources &"
          titleAccent="Documentation"
          subtitle="Guides, tutorials, and best practices for your team"
        />

        <FilterBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as ResourceTab)}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search resources..."
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          {/* Getting Started */}
          {filteredGuides.length > 0 && (
            <section className="mb-10 md:mb-16">
              <h2 className="text-2xl md:text-3xl font-playfair font-bold text-foreground mb-6 md:mb-8">Getting Started</h2>
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-2 md:pb-0">
                <div className="flex md:grid md:grid-cols-2 gap-4 md:gap-6 min-w-max md:min-w-0">
                  {filteredGuides.map((guide, index) => {
                    const Icon = guide.icon;
                    return (
                      <Link key={index} to={guide.link} className="w-[280px] md:w-auto shrink-0">
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full relative">
                          <div className="absolute -top-2 -left-2 md:hidden w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-md">{guide.step}</div>
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg mb-2"><Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" /></div>
                              {guide.badge && <Badge className="bg-primary text-primary-foreground text-xs">{guide.badge}</Badge>}
                            </div>
                            <CardTitle className="flex items-center justify-between text-base md:text-lg">{guide.title}<ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 ml-2" /></CardTitle>
                            <CardDescription className="text-sm">{guide.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="pt-0"><p className="text-xs md:text-sm text-muted-foreground">{guide.duration}</p></CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Documentation */}
          {filteredDocs.length > 0 && (
            <section className="mb-10 md:mb-16">
              <h2 className="text-2xl md:text-3xl font-playfair font-bold text-foreground mb-6 md:mb-8">Technical Documentation</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredDocs.map((doc, index) => {
                  const Icon = doc.icon;
                  return (
                    <Link key={index} to={doc.link}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg mb-3 md:mb-4"><Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" /></div>
                            {doc.badge && <Badge variant="outline" className="text-xs">{doc.badge}</Badge>}
                          </div>
                          <CardTitle className="text-sm md:text-base">{doc.title}</CardTitle>
                          <CardDescription className="text-xs md:text-sm">{doc.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Downloads */}
          {filteredDownloads.length > 0 && (
            <section className="mb-10 md:mb-16">
              <h2 className="text-2xl md:text-3xl font-playfair font-bold text-foreground mb-6 md:mb-8">Downloadable Resources</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {filteredDownloads.map((download) => (
                  <motion.div key={download.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 md:gap-4 min-w-0">
                            <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg shrink-0"><Download className="h-5 w-5 md:h-6 md:w-6 text-primary" /></div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-foreground text-sm md:text-base truncate">{download.title}</h3>
                              <p className="text-xs md:text-sm text-muted-foreground">{download.format} • {download.size}</p>
                              <p className="text-xs text-muted-foreground">{download.downloads.toLocaleString()} downloads</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" disabled={downloadingId === download.id} onClick={() => handleDownload(download.id, download.generator, download.title)} className="shrink-0 min-h-[40px] min-w-[90px] btn-glow">
                            {downloadingId === download.id ? (<><Loader2 className="h-4 w-4 animate-spin mr-1" /><span className="hidden sm:inline">Loading</span></>) : 'Download'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Support CTA */}
          <section className="bg-muted/50 rounded-lg p-6 md:p-8 text-center">
            <MessageCircle className="h-10 w-10 md:h-12 md:w-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl md:text-2xl font-playfair font-bold text-foreground mb-3 md:mb-4">Can't Find What You're Looking For?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto text-sm md:text-base">Our support team is here to help.</p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
              <Link to="/contact"><Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 min-h-[48px] btn-glow">Contact Support</Button></Link>
              <Link to="/features"><Button variant="outline" size="lg" className="w-full sm:w-auto min-h-[48px]">Explore Features</Button></Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default ResourcesPage;
