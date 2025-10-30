/**
 * Resources Page Component
 * Knowledge base, guides, and training resources
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Video, 
  FileText, 
  Download,
  ExternalLink,
  PlayCircle,
  Code,
  MessageCircle,
  Zap,
  Users,
  Settings,
  BarChart3,
  Search
} from 'lucide-react';

const ResourcesPage = () => {
  const gettingStarted = [
    {
      icon: Zap,
      title: 'Quick Start Guide',
      description: 'Get up and running in 15 minutes',
      duration: '5 min read',
      link: '#',
      badge: 'Popular'
    },
    {
      icon: Users,
      title: 'Creating Your First Job',
      description: 'Step-by-step job posting walkthrough',
      duration: '8 min read',
      link: '#'
    },
    {
      icon: Settings,
      title: 'Account Setup & Configuration',
      description: 'Configure your organization settings',
      duration: '10 min read',
      link: '#'
    },
    {
      icon: Code,
      title: 'Integration Setup',
      description: 'Connect Tenstreet, job boards, and HRIS',
      duration: '12 min read',
      link: '#'
    }
  ];

  const videoTutorials = [
    {
      title: 'Platform Overview (15 min)',
      thumbnail: '/placeholder.svg',
      views: '1.2K views'
    },
    {
      title: 'Advanced Analytics Dashboard (12 min)',
      thumbnail: '/placeholder.svg',
      views: '856 views'
    },
    {
      title: 'Voice Apply Setup (8 min)',
      thumbnail: '/placeholder.svg',
      views: '645 views'
    },
    {
      title: 'Tenstreet Integration (10 min)',
      thumbnail: '/placeholder.svg',
      views: '542 views'
    }
  ];

  const documentation = [
    {
      icon: FileText,
      title: 'API Documentation',
      description: 'Complete API reference and integration guides'
    },
    {
      icon: Code,
      title: 'Webhook Integration',
      description: 'Set up real-time event notifications'
    },
    {
      icon: BarChart3,
      title: 'Analytics Guide',
      description: 'Understanding your data and metrics'
    },
    {
      icon: Settings,
      title: 'Admin Configuration',
      description: 'Advanced settings and customization'
    }
  ];

  const downloads = [
    {
      title: 'ATS Intel Feature Guide',
      size: '2.4 MB',
      format: 'PDF'
    },
    {
      title: 'Implementation Checklist',
      size: '856 KB',
      format: 'PDF'
    },
    {
      title: 'ROI Calculator Template',
      size: '1.2 MB',
      format: 'XLSX'
    },
    {
      title: 'Best Practices Guide',
      size: '3.1 MB',
      format: 'PDF'
    }
  ];

  return (
    <div className="min-h-screen py-20">
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
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Everything you need to succeed with ATS Intel - guides, tutorials, documentation, and best practices
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search documentation, guides, and tutorials..."
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
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
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
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
              );
            })}
          </div>
        </section>

        {/* Video Tutorials */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-playfair font-bold text-foreground">
              Video Tutorials
            </h2>
            <Button variant="outline">
              <Video className="mr-2 h-4 w-4" />
              View All Videos
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {videoTutorials.map((video, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <PlayCircle className="h-12 w-12 text-white" />
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-base">{video.title}</CardTitle>
                  <CardDescription className="text-xs">{video.views}</CardDescription>
                </CardHeader>
              </Card>
            ))}
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
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-base">{doc.title}</CardTitle>
                    <CardDescription>{doc.description}</CardDescription>
                  </CardHeader>
                </Card>
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
            {downloads.map((download, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
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
                    <Button variant="outline" size="sm">
                      Download
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
            <Link to="/demo">
              <Button variant="outline" size="lg">
                Schedule a Demo
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ResourcesPage;
