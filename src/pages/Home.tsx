import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { 
  BarChart3, 
  Bot, 
  Shield, 
  Zap, 
  Users, 
  Target,
  ArrowRight,
  Building2
} from 'lucide-react';

const Home = () => {
  const { user, userRole } = useAuth();
  
  const features = [
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Get detailed insights into your recruitment performance with AI-powered analytics and reporting.'
    },
    {
      icon: Bot,
      title: 'AI-Powered Features',
      description: 'Leverage OpenAI and Anthropic models for intelligent applicant screening and automated workflows.'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level security with role-based access control and comprehensive audit trails.'
    },
    {
      icon: Zap,
      title: 'Multi-Platform Integration',
      description: 'Connect with Meta, Indeed, Google Jobs, Tenstreet and more platforms seamlessly.'
    },
    {
      icon: Users,
      title: 'Applicant Management',
      description: 'Streamline your hiring process with centralized application tracking and management.'
    },
    {
      icon: Target,
      title: 'Smart Targeting',
      description: 'Optimize your job postings with intelligent targeting and budget allocation.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/intel-ats-logo.png" alt="INTEL ATS" className="h-10 w-auto" />
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <Button asChild>
                <Link to={userRole === 'super_admin' ? '/admin' : '/'}>
                  {userRole === 'super_admin' ? 'Admin' : 'Dashboard'}
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Modern Recruitment Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline your hiring process with AI-powered analytics, multi-platform integration, 
            and comprehensive applicant management tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link to="/auth">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link to="/dashboard">View Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to revolutionize your recruitment process and attract top talent.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Building2 className="w-16 h-16 mx-auto mb-6 text-primary" />
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Hiring?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join leading organizations using INTEL ATS to streamline their recruitment process.
          </p>
          <Button asChild size="lg" className="text-lg px-8">
            <Link to="/auth">
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/intel-ats-logo.png" alt="INTEL ATS" className="h-8 w-auto" />
          </div>
          <p className="text-muted-foreground">
            © 2024 INTEL ATS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;