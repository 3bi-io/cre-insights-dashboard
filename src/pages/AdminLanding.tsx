
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  DollarSign, 
  Users, 
  Target,
  Shield,
  Briefcase,
  Building,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const AdminLanding = () => {
  const { setTheme } = useTheme();

  // Force dark mode for landing page
  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);

  const features = [
    {
      icon: DollarSign,
      title: "Spend Tracking & Analytics",
      description: "Monitor advertising spend across all platforms with real-time reporting and budget alerts.",
      benefits: ["Real-time spend monitoring", "Budget allocation tracking", "Cost per application analysis"]
    },
    {
      icon: Users,
      title: "Application Management",
      description: "Track and manage job applications from multiple sources in one centralized dashboard.",
      benefits: ["Centralized application tracking", "Source attribution", "Conversion rate analysis"]
    },
    {
      icon: Briefcase,
      title: "Job Listing Optimization",
      description: "Create, manage, and optimize job listings across multiple platforms for maximum reach.",
      benefits: ["Multi-platform posting", "Performance tracking", "A/B testing capabilities"]
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive reporting with actionable insights to improve your recruitment ROI.",
      benefits: ["Platform performance comparison", "Trend analysis", "Custom reporting"]
    },
    {
      icon: Building,
      title: "Client Management",
      description: "Manage client relationships and track recruitment campaigns for multiple organizations.",
      benefits: ["Client portfolio tracking", "Campaign attribution", "Performance reporting"]
    },
    {
      icon: Shield,
      title: "Administrative Controls",
      description: "Full administrative access with user management and system configuration options.",
      benefits: ["User role management", "System configuration", "Data export capabilities"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-8 py-4 max-w-7xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/8d8eed20-4fcb-4be0-adba-5d8a3a949c9e.png" 
                alt="C.R. England" 
                className="h-8 w-auto"
              />
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link to="/auth">
                  Access Platform
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="Professional truck driver and logistics" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-secondary/90"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-8 max-w-7xl">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-6 text-primary-foreground">
              Job Advertising Analytics Platform
            </h1>
            <p className="text-xl text-primary-foreground/90 mb-8 leading-relaxed">
              Comprehensive recruitment analytics and spend management for C.R. England. 
              Monitor performance, optimize campaigns, and maximize your recruitment ROI across all platforms.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/auth">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/jobs">
                  Browse Jobs
                  <Briefcase className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-8 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Platform Capabilities</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to optimize your recruitment advertising and maximize ROI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Icon className="w-10 h-10 text-primary mb-4" />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-center text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-8 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Dashboard Overview</h2>
            <p className="text-xl text-muted-foreground">
              Get insights at a glance with our comprehensive analytics dashboard
            </p>
          </div>

          <div className="bg-background rounded-xl border p-8 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-card rounded-lg p-6 border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spend (MTD)</p>
                    <p className="text-2xl font-bold">$24,567</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-primary">+12% from last month</p>
              </div>

              <div className="bg-card rounded-lg p-6 border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Applications</p>
                    <p className="text-2xl font-bold">1,234</p>
                  </div>
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-primary">+8% from last month</p>
              </div>

              <div className="bg-card rounded-lg p-6 border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Jobs</p>
                    <p className="text-2xl font-bold">45</p>
                  </div>
                  <Briefcase className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-secondary">3 new this week</p>
              </div>

              <div className="bg-card rounded-lg p-6 border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cost/Application</p>
                    <p className="text-2xl font-bold">$19.89</p>
                  </div>
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-primary">-5% from last month</p>
              </div>
            </div>

            <div className="bg-secondary/20 rounded-lg p-6 text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
              <p className="text-muted-foreground">
                Detailed charts, trends, and performance metrics available in the full dashboard
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/90">
        <div className="container mx-auto px-8 max-w-7xl text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Ready to Optimize Your Recruitment?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join the C.R. England analytics platform and start making data-driven recruitment decisions today.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/auth">
              Access Platform Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="container mx-auto px-8 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img 
                src="/lovable-uploads/8d8eed20-4fcb-4be0-adba-5d8a3a949c9e.png" 
                alt="C.R. England" 
                className="h-8 w-auto"
              />
            </div>
            <div className="text-muted-foreground text-center md:text-right">
              <p>&copy; 2024 C.R. England. All rights reserved.</p>
              <p className="text-sm">Recruitment Analytics Platform</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminLanding;
