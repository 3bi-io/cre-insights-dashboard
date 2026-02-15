/**
 * Trust Section Component
 * Client testimonials + star ratings + trust stats
 */

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { SectionWrapper } from '../shared/SectionWrapper';
import { CountUpStatCard } from '../shared/CountUpStatCard';
import { trustContent } from '../../content/trust.content';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    quote: "ATS.me cut our time-to-hire by 60%. The AI voice screening is a game-changer for high-volume recruiting.",
    author: "Sarah M.",
    role: "VP of Talent Acquisition",
    company: "National Carrier",
    rating: 5,
  },
  {
    quote: "We went from missing 40% of callbacks to connecting with every single candidate. The ROI was immediate.",
    author: "James T.",
    role: "Director of Recruiting",
    company: "Regional Fleet",
    rating: 5,
  },
  {
    quote: "The Tenstreet integration alone saved us 15 hours per week. No more double data entry.",
    author: "Maria L.",
    role: "Recruitment Manager",
    company: "Logistics Company",
    rating: 5,
  },
];

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-warning fill-warning' : 'text-muted'}`}
      />
    ))}
  </div>
);

const TrustSection = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <SectionWrapper variant="muted" className="py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
          What People Say
        </Badge>
        <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
          {trustContent.title}
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {trustContent.description}
        </p>

        {/* Star rating summary */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <StarRating rating={5} />
          <span className="text-sm font-semibold text-foreground">4.9/5</span>
          <span className="text-sm text-muted-foreground">from 50+ reviews</span>
        </div>
      </motion.div>

      {/* Testimonial Carousel */}
      <div className="max-w-3xl mx-auto mb-14">
        <div className="relative bg-card border rounded-2xl p-8 md:p-10 shadow-sm">
          <Quote className="absolute top-6 left-6 h-8 w-8 text-primary/10" />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTestimonial}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <p className="text-lg md:text-xl text-foreground leading-relaxed mb-6 italic">
                "{testimonials[activeTestimonial].quote}"
              </p>
              <div className="flex items-center justify-center gap-3">
                <StarRating rating={testimonials[activeTestimonial].rating} />
              </div>
              <p className="mt-3 font-semibold text-foreground">
                {testimonials[activeTestimonial].author}
              </p>
              <p className="text-sm text-muted-foreground">
                {testimonials[activeTestimonial].role}, {testimonials[activeTestimonial].company}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Nav arrows */}
          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={() => setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
              className="p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === activeTestimonial ? 'bg-primary w-6' : 'bg-muted-foreground/30'}`}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
            <button
              onClick={() => setActiveTestimonial((prev) => (prev + 1) % testimonials.length)}
              className="p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Trust Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {trustContent.stats.map((stat, index) => (
          <CountUpStatCard
            key={index}
            icon={stat.icon}
            value={stat.value}
            label={stat.label}
            description={stat.description}
            delay={index * 100}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-10 text-center"
      >
        <p className="text-sm text-muted-foreground">
          {trustContent.footer}
        </p>
      </motion.div>
    </SectionWrapper>
  );
};

export default TrustSection;
