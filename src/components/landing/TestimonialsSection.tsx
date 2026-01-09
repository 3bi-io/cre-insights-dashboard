import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Lightbulb, Clock } from 'lucide-react';

const TestimonialsSection = () => {
  const highlights = [
    {
      icon: Clock,
      title: 'Faster Response Times',
      description: 'AI voice callbacks connect with jobseekers within minutes of application, not hours or days.',
    },
    {
      icon: MessageSquare,
      title: 'Always Available',
      description: '24/7 automated screening means you never miss a qualified candidate, even outside business hours.',
    },
    {
      icon: Lightbulb,
      title: 'Smarter Screening',
      description: 'AI-powered qualification ensures your recruiters focus on the most promising candidates.',
    }
  ];

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Customer Success
          </Badge>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
            Built for Modern Recruiting Challenges
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We are building ATS.me to solve real problems faced by recruiting teams today
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {highlights.map((highlight, index) => {
            const Icon = highlight.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {highlight.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {highlight.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            See how ATS.me is transforming recruitment for companies like yours
          </p>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
