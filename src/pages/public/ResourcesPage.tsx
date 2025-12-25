/**
 * Resources Page Component
 * Knowledge base, guides, and training resources
 */

import React, { useState } from 'react';
import { SEO } from '@/components/SEO';
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
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { generateFeatureGuidePDF, generateImplementationChecklistPDF, generateBestPracticesPDF } from '@/utils/resourcesPdfGenerator';
import { generateRoiCalculatorXLSX } from '@/utils/roiCalculatorGenerator';

const ResourcesPage = () => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const gettingStarted = [
    {
      icon: Zap,
      title: 'Quick Start Guide',
      description: 'Get up and running in 15 minutes',
      duration: '5 min read',
      link: '/features',
      badge: 'Popular'
    },
    {
      icon: Users,
      title: 'Creating Your First Job',
      description: 'Step-by-step job posting walkthrough',
      duration: '8 min read',
      link: '/features'
    },
    {
      icon: Settings,
      title: 'Account Setup & Configuration',
      description: 'Configure your organization settings',
      duration: '10 min read',
      link: '/contact'
    },
    {
      icon: Code,
      title: 'Integration Setup',
      description: 'Connect Tenstreet, job boards, and HRIS',
      duration: '12 min read',
      link: '/contact'
    }
  ];

  const documentation = [
    {
      icon: FileText,
      title: 'API Documentation',
      description: 'Complete API reference and integration guides',
      link: '/contact'
    },
    {
      icon: Code,
      title: 'Webhook Integration',
      description: 'Set up real-time event notifications',
      link: '/contact'
    },
    {
      icon: BarChart3,
      title: 'Analytics Guide',
      description: 'Understanding your data and metrics',
      link: '/features'
    },
    {
      icon: Settings,
      title: 'Admin Configuration',
      description: 'Advanced settings and customization',
      link: '/contact'
    }
  ];

  const downloads = [
    {
      id: 'feature-guide',
      title: 'ATS Intel Feature Guide',
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
      console.error('Download error:', error);
      toast.error('Failed to generate download. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen py-20">
      <SEO
        title="Resources & Documentation | Guides & Best Practices"
        description="Comprehensive knowledge base for ATS.me. Quick start guides, API documentation, implementation checklists, and best practices for recruitment teams."
        keywords="ATS documentation, recruitment guides, implementation guide, API docs, ATS.me resources"
        canonical="https://ats.me/resources"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <BookOpen className="h-3 w-3 mr-1 inline" />
            Knowledge Base
          </Badge>
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6">
            Resources & Documentation
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to succeed with ATS Intel - guides, tutorials, documentation, and best practices
          </p>
        </div>

        {/* Getting Started */}
        <section className="mb-16">
          <h2 className="text-3xl font-playfair font-bold text-foreground mb-8">
            Getting Started
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {gettingStarted.map((guide, index) => {
              const Icon = guide.icon;
              return (
                <Link key={index} to={guide.link}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-2">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        {guide.badge && (
                          <Badge className="bg-primary text-primary-foreground">{guide.badge}</Badge>
                        )}
                      </div>
                      <CardTitle className="flex items-center justify-between">
                        {guide.title}
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </CardTitle>
                      <CardDescription>{guide.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{guide.duration}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Documentation */}
        <section className="mb-16">
          <h2 className="text-3xl font-playfair font-bold text-foreground mb-8">
            Technical Documentation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {documentation.map((doc, index) => {
              const Icon = doc.icon;
              return (
                <Link key={index} to={doc.link}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-base">{doc.title}</CardTitle>
                      <CardDescription>{doc.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Downloads */}
        <section className="mb-16">
          <h2 className="text-3xl font-playfair font-bold text-foreground mb-8">
            Downloadable Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {downloads.map((download) => (
              <Card key={download.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                        <Download className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{download.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {download.format} • {download.size}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={downloadingId === download.id}
                      onClick={() => handleDownload(download.id, download.generator, download.title)}
                    >
                      {downloadingId === download.id ? 'Generating...' : 'Download'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Support CTA */}
        <section className="bg-muted/50 rounded-lg p-8 text-center">
          <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-playfair font-bold text-foreground mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Our support team is here to help. Get in touch and we'll respond quickly with the answers you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Contact Support
              </Button>
            </Link>
            <Link to="/features">
              <Button variant="outline" size="lg">
                Explore Features
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ResourcesPage;
