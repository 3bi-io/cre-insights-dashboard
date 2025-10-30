import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "The Tenstreet integration and voice apply features have completely streamlined our driver recruitment. Application completion rates jumped by 75%.",
      author: "Jennifer Martinez",
      role: "Director of Recruiting",
      company: "Beta Program Participant",
      verified: true
    },
    {
      quote: "Real-time spend tracking across all our job boards has given us visibility we never had before. We've already optimized our budget by 40%.",
      author: "David Thompson",
      role: "Talent Acquisition Manager",
      company: "Early Adopter",
      verified: true
    },
    {
      quote: "The automated screening workflows and AI-powered candidate matching have saved our team countless hours. We can finally focus on the human side of hiring.",
      author: "Rachel Kim",
      role: "HR Operations Lead",
      company: "Pilot Customer",
      verified: true
    }
  ];

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
            Early Results from Our Pilot Program
          </h2>
          <p className="text-xl text-muted-foreground">
            Real feedback from companies testing ATS Intel in production
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            🚀 Join our pilot program and get priority access to new features
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">
                  "{testimonial.quote}"
                </p>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-foreground">{testimonial.author}</div>
                    {testimonial.verified && (
                      <Badge variant="secondary" className="text-xs">Verified</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {testimonial.company}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;