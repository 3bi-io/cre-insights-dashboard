import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "ATS.me transformed our hiring process completely. We're now hiring 3x faster with better quality candidates.",
      author: "Sarah Johnson",
      role: "VP of Talent",
      company: "TechCorp"
    },
    {
      quote: "The AI-powered insights have been game-changing. We've reduced our time-to-hire by 60% while improving candidate quality.",
      author: "Michael Chen",
      role: "Head of HR",
      company: "InnovateCo"
    },
    {
      quote: "Best ATS we've ever used. The automation features alone have saved us 20+ hours per week.",
      author: "Emily Rodriguez",
      role: "Talent Director",
      company: "GrowthLabs"
    }
  ];

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
            Trusted by Industry Leaders
          </h2>
          <p className="text-xl text-muted-foreground">
            See what our customers are saying about ATS.me
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
                  <div className="font-semibold text-foreground">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role} at {testimonial.company}
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