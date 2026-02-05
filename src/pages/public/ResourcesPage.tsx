/**
 * Resources Page Component
 * Mobile-first knowledge base, guides, and training resources
 */

import React, { useState, useMemo } from 'react';
import { SEO } from '@/components/SEO';
import { StructuredData } from '@/components/StructuredData';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  FileText, 
  Download,
  ExternalLink,
  Code,
  MessageCircle,
  Zap,
  Users,
  Settings,
  BarChart3,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { generateFeatureGuidePDF, generateImplementationChecklistPDF, generateBestPracticesPDF } from '@/utils/resourcesPdfGenerator';
import { generateRoiCalculatorXLSX } from '@/utils/roiCalculatorGenerator';
import { logger } from '@/lib/logger';

const ResourcesPage = () => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const gettingStarted = [
    {
      icon: Zap,
      title: 'Quick Start Guide',
      description: 'Get up and running in 15 minutes',
      duration: '5 min read',
      link: '/features',
      badge: 'Popular',
      step: 1
    },
    {
      icon: Users,
      title: 'Creating Your First Job',
      description: 'Step-by-step job posting walkthrough',
      duration: '8 min read',
      link: '/demo',
      step: 2
    },
    {
      icon: Settings,
      title: 'Account Setup & Configuration',
      description: 'Configure your organization settings',
      duration: '10 min read',
      link: '/demo',
      step: 3
    },
    {
      icon: Code,
      title: 'Integration Setup',
      description: 'Connect Tenstreet, job boards, and HRIS',
      duration: '12 min read',
      link: '/features',
      step: 4
    }
  ];

  const documentation = [
    {
      icon: FileText,
      title: 'API Documentation',
      description: 'Complete API reference and integration guides',
      link: '/contact',
      badge: 'Contact Us'
    },
    {
      icon: Code,
      title: 'Webhook Integration',
      description: 'Set up real-time event notifications',
      link: '/contact',
      badge: 'Contact Us'
    },
    {
      icon: BarChart3,
      title: 'Analytics Guide',
      description: 'Understanding your data and metrics',
      link: '/demo'
    },
    {
      icon: Settings,
      title: 'Admin Configuration',
      description: 'Advanced settings and customization',
      link: '/demo'
    }
  ];

  const downloads = [
    {
      id: 'feature-guide',
      title: 'ATS.me Feature Guide',
      size: '~50 KB',
      format: 'PDF',
      generator: generateFeatureGuidePDF
    },
    {
      id: 'implementation',
      title: 'Implementation Checklist',
      size: '~45 KB',
      format: 'PDF',
      generator: generateImplementationChecklistPDF
    },
    {
      id: 'roi-calculator',
      title: 'ROI Calculator Template',
      size: '~20 KB',
      format: 'XLSX',
      generator: generateRoiCalculatorXLSX
    },
    {
      id: 'best-practices',
      title: 'Best Practices Guide',
      size: '~55 KB',
      format: 'PDF',
      generator: generateBestPracticesPDF
    }
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

  // Build ItemList schema for downloadable resources
  const resourcesSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "ATS.me Resources & Documentation",
    "description": "Guides, documentation, and downloadable resources for recruitment teams",
    "numberOfItems": downloads.length,
    "itemListElement": downloads.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "DigitalDocument",
        "name": item.title,
        "fileFormat": item.format,
        "description": `${item.title} - ${item.format} format`
      }
    }))
  }), []);

  return (
    <>
      <SEO
        title="Resources & Documentation | Guides & Best Practices"
        description="Comprehensive knowledge base for ATS.me. Quick start guides, API documentation, implementation checklists, and best practices for recruitment teams."
        keywords="ATS documentation, recruitment guides, implementation guide, API docs, ATS.me resources"
        canonical="https://ats.me/resources"
        ogImage="https://ats.me/og-resources.png"
      />
      <StructuredData data={resourcesSchema} />
      <div className="min-h-screen py-10 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 md:mb-16">
          <Badge className="mb-3 md:mb-4 bg-primary/10 text-primary border-primary/20">
            <BookOpen className="h-3 w-3 mr-1 inline" />
            Knowledge Base
          </Badge>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground mb-4 md:mb-6 px-2">
            Resources & Documentation
          </h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Everything you need to succeed with ATS.me - guides, tutorials, documentation, and best practices
          </p>
        </div>

        {/* Getting Started - Numbered steps on mobile */}
        <section className="mb-10 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-playfair font-bold text-foreground mb-6 md:mb-8">
            Getting Started
          </h2>
          
          {/* Mobile: Horizontal scroll with step numbers, Desktop: Grid */}
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-2 md:pb-0">
            <div className="flex md:grid md:grid-cols-2 gap-4 md:gap-6 min-w-max md:min-w-0">
              {gettingStarted.map((guide, index) => {
                const Icon = guide.icon;
                return (
                  <Link key={index} to={guide.link} className="w-[280px] md:w-auto shrink-0">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full relative">
                      {/* Step number indicator on mobile */}
                      <div className="absolute -top-2 -left-2 md:hidden w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                        {guide.step}
                      </div>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg mb-2">
                            <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                          </div>
                          {guide.badge && (
                            <Badge className="bg-primary text-primary-foreground text-xs">{guide.badge}</Badge>
                          )}
                        </div>
                        <CardTitle className="flex items-center justify-between text-base md:text-lg">
                          {guide.title}
                          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                        </CardTitle>
                        <CardDescription className="text-sm">{guide.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs md:text-sm text-muted-foreground">{guide.duration}</p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Documentation */}
        <section className="mb-10 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-playfair font-bold text-foreground mb-6 md:mb-8">
            Technical Documentation
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {documentation.map((doc, index) => {
              const Icon = doc.icon;
              return (
                <Link key={index} to={doc.link}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg mb-3 md:mb-4">
                          <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                        </div>
                        {doc.badge && (
                          <Badge variant="outline" className="text-xs">{doc.badge}</Badge>
                        )}
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

        {/* Downloads - Full width cards on mobile */}
        <section className="mb-10 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-playfair font-bold text-foreground mb-6 md:mb-8">
            Downloadable Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {downloads.map((download) => (
              <Card key={download.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                      <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg shrink-0">
                        <Download className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground text-sm md:text-base truncate">{download.title}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {download.format} • {download.size}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={downloadingId === download.id}
                      onClick={() => handleDownload(download.id, download.generator, download.title)}
                      className="shrink-0 min-h-[40px] min-w-[90px]"
                    >
                      {downloadingId === download.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          <span className="hidden sm:inline">Loading</span>
                        </>
                      ) : (
                        'Download'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Support CTA */}
        <section className="bg-muted/50 rounded-lg p-6 md:p-8 text-center">
          <MessageCircle className="h-10 w-10 md:h-12 md:w-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl md:text-2xl font-playfair font-bold text-foreground mb-3 md:mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto text-sm md:text-base">
            Our support team is here to help. Get in touch and we'll respond quickly with the answers you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
            <Link to="/contact">
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 min-h-[48px]">
                Contact Support
              </Button>
            </Link>
            <Link to="/features">
              <Button variant="outline" size="lg" className="w-full sm:w-auto min-h-[48px]">
                Explore Features
              </Button>
            </Link>
          </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default ResourcesPage;
