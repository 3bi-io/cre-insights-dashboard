import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BarChart3, Users, Zap, Target, Globe, Shield, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import atsLogo from '@/assets/ats-io-logo.png';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Navigation */}
      <nav className="bg-background/80 backdrop-blur-md border-b border-border/40 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src={atsLogo} alt="ATS.IO Logo" className="w-10 h-10" />
              <span className="text-xl font-bold text-foreground">ATS.IO</span>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link to="/auth">
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 max-w-7xl">
        <div className="text-center space-y-8">
          <div className="flex items-center justify-center mb-8">
            <img src={atsLogo} alt="ATS.IO Logo" className="w-20 h-20 mr-4" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              ATS.IO
            </h1>
          </div>
          
          <Badge variant="secondary" className="text-sm px-4 py-2">
            Next-Generation Applicant Tracking System
          </Badge>
          
          <h2 className="text-4xl md:text-6xl font-bold text-foreground max-w-4xl mx-auto leading-tight">
            Revolutionize Your
            <span className="text-primary"> Hiring Process</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Streamline recruitment with AI-powered analytics, automated workflows, and comprehensive candidate tracking. 
            Transform how you find, evaluate, and hire top talent.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button size="lg" className="text-lg px-8 py-4" asChild>
              <Link to="/auth">
                Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20 max-w-7xl">
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Scale Your Hiring
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful tools designed for modern recruitment teams
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-border/50 hover:border-primary/50 transition-colors group">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                AI-powered insights into your hiring funnel, candidate performance, and recruitment ROI
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 hover:border-primary/50 transition-colors group">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Candidate Management</CardTitle>
              <CardDescription>
                Centralized database with smart filtering, automated screening, and seamless communication
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 hover:border-primary/50 transition-colors group">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Automated Workflows</CardTitle>
              <CardDescription>
                Custom pipelines that move candidates through your process automatically and efficiently
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 hover:border-primary/50 transition-colors group">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Multi-Platform Posting</CardTitle>
              <CardDescription>
                Post jobs across 50+ job boards simultaneously and track performance from one dashboard
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 hover:border-primary/50 transition-colors group">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Global Compliance</CardTitle>
              <CardDescription>
                Built-in GDPR, CCPA, and international hiring law compliance features
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 hover:border-primary/50 transition-colors group">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Enterprise Security</CardTitle>
              <CardDescription>
                SOC 2 Type II certified with end-to-end encryption and role-based access controls
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h3 className="text-3xl md:text-4xl font-bold text-foreground">
                Why Leading Companies Choose ATS.IO
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">50% Faster Time-to-Hire</h4>
                    <p className="text-muted-foreground">Automated screening and smart candidate matching accelerate your hiring process</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">90% Reduction in Manual Tasks</h4>
                    <p className="text-muted-foreground">AI handles resume screening, interview scheduling, and candidate communication</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">360° Hiring Analytics</h4>
                    <p className="text-muted-foreground">Data-driven insights to optimize your recruitment strategy and budget allocation</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Seamless Integrations</h4>
                    <p className="text-muted-foreground">Connect with 200+ HR tools, job boards, and background check services</p>
                  </div>
                </div>
              </div>
              
              <Button size="lg" asChild>
                <Link to="/auth">
                  Get Started Today <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
            
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8 lg:p-12">
              <div className="space-y-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
                  <div className="text-muted-foreground">Companies Trust ATS.IO</div>
                </div>
                
                <div className="grid grid-cols-2 gap-8 text-center">
                  <div>
                    <div className="text-2xl font-bold text-foreground mb-1">2M+</div>
                    <div className="text-sm text-muted-foreground">Candidates Managed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground mb-1">500K+</div>
                    <div className="text-sm text-muted-foreground">Successful Hires</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground mb-1">99.9%</div>
                    <div className="text-sm text-muted-foreground">Uptime SLA</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground mb-1">24/7</div>
                    <div className="text-sm text-muted-foreground">Expert Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 max-w-7xl">
        <div className="text-center space-y-8 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-16">
          <h3 className="text-3xl md:text-4xl font-bold text-foreground">
            Ready to Transform Your Hiring?
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of companies using ATS.IO to build amazing teams faster and smarter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-4" asChild>
              <Link to="/auth">
                Start Your Free Trial
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4">
              Schedule a Demo
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <img src={atsLogo} alt="ATS.IO Logo" className="w-8 h-8" />
              <span className="font-semibold text-foreground">ATS.IO</span>
            </div>
            <div className="text-muted-foreground text-center md:text-right">
              <p>&copy; 2024 ATS.IO. All rights reserved.</p>
              <p className="text-sm">Next-Generation Applicant Tracking System</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;