import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Rocket, 
  Calendar, 
  Settings, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Clock
} from 'lucide-react';

const OnboardingSection = () => {
  const onboardingSteps = [
    {
      icon: Calendar,
      title: 'Day 1: Kickoff & Setup',
      time: '2 hours',
      tasks: [
        'Initial consultation call',
        'Account configuration',
        'User access setup',
        'Branding customization'
      ]
    },
    {
      icon: Settings,
      title: 'Day 2: Integration',
      time: '4-6 hours',
      tasks: [
        'Connect Tenstreet (if applicable)',
        'Job board integrations',
        'Email & calendar sync',
        'Data migration support'
      ]
    },
    {
      icon: Users,
      title: 'Day 3-5: Training',
      time: '3 hours',
      tasks: [
        'Admin training session',
        'Team member onboarding',
        'Best practices workshop',
        'Q&A and customization'
      ]
    },
    {
      icon: Rocket,
      title: 'Day 5+: Go Live',
      time: 'Ongoing',
      tasks: [
        'Launch your first jobs',
        'Monitor analytics',
        'Ongoing support',
        'Optimization recommendations'
      ]
    }
  ];

  const quickWins = [
    'Post your first job in under 10 minutes',
    'Start receiving applications within 24 hours',
    'Full platform adoption in less than 1 week',
    'ROI visible within first month'
  ];

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Clock className="h-3 w-3 mr-1 inline" />
            Go Live in 48 Hours
          </Badge>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
            Fast, Guided Implementation
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our streamlined onboarding process gets you up and running quickly, with expert guidance every step of the way
          </p>
        </div>

        {/* Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {onboardingSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className="relative hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {step.time}
                  </p>
                  <ul className="space-y-2">
                    {step.tasks.map((task, taskIndex) => (
                      <li key={taskIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Wins */}
        <div className="bg-muted/50 rounded-lg p-8 mb-12">
          <h3 className="text-2xl font-playfair font-bold text-foreground mb-6 text-center">
            What You'll Achieve Quickly
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {quickWins.map((win, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-muted-foreground">{win}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Ready to Get Started?
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/demo">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Schedule Your Kickoff Call
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/resources">
              <Button variant="outline" size="lg">
                View Implementation Guide
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default OnboardingSection;
