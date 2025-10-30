/**
 * Demo Page Component
 * Interactive product tour and demo request
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  BarChart3, 
  Users, 
  Calendar, 
  FileText, 
  Zap,
  ArrowRight,
  CheckCircle 
} from 'lucide-react';

const DemoPage = () => {
  const features = [
    {
      icon: Users,
      title: 'Applicant Tracking',
      description: 'See how candidates flow through your pipeline with real-time updates'
    },
    {
      icon: BarChart3,
      title: 'AI-Powered Analytics',
      description: 'Explore predictive insights, cost-per-hire tracking, and source quality analysis'
    },
    {
      icon: Calendar,
      title: 'Interview Scheduling',
      description: 'Watch automated calendar coordination and candidate communication in action'
    },
    {
      icon: FileText,
      title: 'Automated Screening',
      description: 'Experience AI-powered resume parsing and candidate matching'
    },
    {
      icon: Zap,
      title: 'Voice Apply Technology',
      description: 'See how candidates can apply via phone in under 2 minutes'
    }
  ];

  const demoHighlights = [
    'Full platform walkthrough (15 minutes)',
    'Live Q&A with our product team',
    'Custom use case discussion',
    'Integration overview (Tenstreet, job boards, HRIS)',
    'Pricing and implementation timeline',
    'Pilot program enrollment options'
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Interactive Demo
          </Badge>
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6">
            Experience ATS Intel in Action
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Get a personalized walkthrough of our platform and see how we can transform your recruiting process
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                <Play className="mr-2 h-5 w-5" />
                Start Interactive Demo
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              Schedule Live Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Feature Preview */}
        <div className="mb-16">
          <h2 className="text-3xl font-playfair font-bold text-foreground mb-8 text-center">
            What You'll See in the Demo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        {/* What's Included */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-2xl font-playfair">
                What's Included in Your Demo
              </CardTitle>
              <CardDescription>
                Our comprehensive demo covers everything you need to make an informed decision
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {demoHighlights.map((highlight, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{highlight}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Early Adopter Opportunity:</strong> Demo participants 
                  get priority access to our pilot program with exclusive pricing and feature voting rights.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-playfair font-bold text-foreground mb-4">
            Ready to See It in Action?
          </h3>
          <p className="text-muted-foreground mb-6">
            Join 50+ companies already testing ATS Intel in production
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Launch Interactive Demo Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
