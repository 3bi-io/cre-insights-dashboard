/**
 * Contact Page Component
 * Contact form with functional submission and company information
 * Mobile-first with accordion FAQ section
 */

import React, { useState } from 'react';
import { SEO } from '@/components/SEO';
import { StructuredData, buildFAQSchema } from '@/components/StructuredData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Headphones,
  Send,
  Loader2,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// Client-side validation schema
const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address").max(255),
  company: z.string().min(1, "Company is required").max(200),
  jobTitle: z.string().max(200).optional(),
  companySize: z.string().max(50).optional(),
  subject: z.string().min(1, "Please select a subject").max(100),
  message: z.string().min(1, "Message is required").max(5000),
});

const ContactPage = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: '',
    companySize: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const validationResult = contactFormSchema.safeParse(formData);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fix the errors in the form."
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('contact-form', {
        body: formData
      });

      if (error) {
        throw new Error(error.message || 'Failed to submit form');
      }

      setIsSubmitted(true);
      toast({
        title: "Message Sent!",
        description: data?.message || "Thank you for contacting us. We'll get back to you within 24 hours.",
      });
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        company: '',
        jobTitle: '',
        companySize: '',
        subject: '',
        message: ''
      });

    } catch (error) {
      console.error('Contact form error:', error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Unable to send your message. Please try again or email us directly at sales@ats.me"
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const faqs = [
    {
      question: "How quickly can we get started?",
      answer: "Most customers are up and running within 24-48 hours. Our setup process is streamlined and our team provides full onboarding support."
    },
    {
      question: "Do you offer custom integrations?",
      answer: "Yes, we provide custom integrations for Enterprise customers. Our team can work with your existing systems and tools."
    },
    {
      question: "What kind of support do you provide?",
      answer: "We offer email support for all plans, priority support for Professional customers, and dedicated account management for Enterprise clients."
    },
    {
      question: "Can we migrate data from our current ATS?",
      answer: "Absolutely! We provide data migration services to help you transfer your existing candidate data, job postings, and historical records."
    }
  ];

  // Build FAQ schema for structured data
  const faqSchemaData = buildFAQSchema(faqs);

  // Contact page schema for AI search
  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact ATS.me",
    "description": "Get in touch with ATS.me for demos, support, or partnership inquiries",
    "url": "https://ats.me/contact",
    "mainEntity": {
      "@type": "Organization",
      "name": "ATS.me",
      "email": "support@ats.me",
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "contactType": "Sales",
          "email": "sales@ats.me"
        },
        {
          "@type": "ContactPoint",
          "contactType": "Customer Support",
          "email": "support@ats.me"
        }
      ]
    }
  };

  return (
    <>
      <SEO
        title="Contact Us | Get in Touch with ATS.me"
        description="Have questions about ATS.me? Contact our team for demos, support, or partnership inquiries. We're here to help you transform your recruitment process."
        keywords="contact ATS.me, recruitment support, demo request, ATS inquiry, customer service"
        canonical="https://ats.me/contact"
      />
      <StructuredData data={[contactPageSchema, faqSchemaData]} />
      <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-10 md:py-20 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-primary/5 bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        
        {/* Floating Elements - reduced motion */}
        <div className="absolute top-20 left-10 md:left-20 w-48 md:w-72 h-48 md:h-72 bg-primary/10 rounded-full blur-2xl md:blur-3xl motion-safe:animate-pulse"></div>
        <div className="absolute bottom-20 right-10 md:right-20 w-64 md:w-96 h-64 md:h-96 bg-accent/10 rounded-full blur-2xl md:blur-3xl motion-safe:animate-pulse delay-1000"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground mb-3 md:mb-6">
            Get in
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Touch</span>
          </h1>
          <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-3xl mx-auto px-4">
            Ready to transform your hiring process? We're here to help you get started.
          </p>
        </div>
      </section>


      {/* Contact Form & FAQ */}
      <section className="py-10 md:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {/* Contact Form */}
            <div>
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl md:text-2xl font-bold">Send us a message</CardTitle>
                  <p className="text-muted-foreground text-sm md:text-base">
                    Fill out the form below and we'll get back to you within 24 hours.
                  </p>
                </CardHeader>
                <CardContent>
                  {isSubmitted ? (
                    <div className="text-center py-8 md:py-12">
                      <CheckCircle className="h-14 w-14 md:h-16 md:w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">Message Sent!</h3>
                      <p className="text-muted-foreground mb-6 text-sm md:text-base">
                        Thank you for reaching out. We'll get back to you within 24 hours.
                      </p>
                      <Button onClick={() => setIsSubmitted(false)} variant="outline" className="min-h-[44px]">
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">
                            First Name *
                          </label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className={`min-h-[44px] ${errors.firstName ? 'border-destructive' : ''}`}
                            required
                            autoComplete="given-name"
                          />
                          {errors.firstName && (
                            <p className="text-destructive text-xs mt-1">{errors.firstName}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">
                            Last Name *
                          </label>
                          <Input
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className={`min-h-[44px] ${errors.lastName ? 'border-destructive' : ''}`}
                            required
                            autoComplete="family-name"
                          />
                          {errors.lastName && (
                            <p className="text-destructive text-xs mt-1">{errors.lastName}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          Email Address *
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`min-h-[44px] ${errors.email ? 'border-destructive' : ''}`}
                          required
                          autoComplete="email"
                          inputMode="email"
                        />
                        {errors.email && (
                          <p className="text-destructive text-xs mt-1">{errors.email}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">
                            Company *
                          </label>
                          <Input
                            id="company"
                            name="company"
                            value={formData.company}
                            onChange={(e) => handleInputChange('company', e.target.value)}
                            className={`min-h-[44px] ${errors.company ? 'border-destructive' : ''}`}
                            required
                            autoComplete="organization"
                          />
                          {errors.company && (
                            <p className="text-destructive text-xs mt-1">{errors.company}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">
                            Job Title
                          </label>
                          <Input
                            id="jobTitle"
                            name="jobTitle"
                            value={formData.jobTitle}
                            onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                            className="min-h-[44px]"
                            autoComplete="organization-title"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          Company Size
                        </label>
                        <Select name="companySize" onValueChange={(value) => handleInputChange('companySize', value)}>
                          <SelectTrigger className="min-h-[44px]">
                            <SelectValue placeholder="Select company size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-10">1-10 employees</SelectItem>
                            <SelectItem value="11-50">11-50 employees</SelectItem>
                            <SelectItem value="51-200">51-200 employees</SelectItem>
                            <SelectItem value="201-1000">201-1,000 employees</SelectItem>
                            <SelectItem value="1000+">1,000+ employees</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          Subject *
                        </label>
                        <Select name="subject" onValueChange={(value) => handleInputChange('subject', value)}>
                          <SelectTrigger className={`min-h-[44px] ${errors.subject ? 'border-destructive' : ''}`}>
                            <SelectValue placeholder="What can we help you with?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="demo">Schedule a Demo</SelectItem>
                            <SelectItem value="pricing">Pricing Information</SelectItem>
                            <SelectItem value="features">Product Features</SelectItem>
                            <SelectItem value="integration">Integration Questions</SelectItem>
                            <SelectItem value="migration">Data Migration</SelectItem>
                            <SelectItem value="partnership">Partnership Opportunity</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.subject && (
                          <p className="text-destructive text-xs mt-1">{errors.subject}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          Message *
                        </label>
                        <Textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={(e) => handleInputChange('message', e.target.value)}
                          placeholder="Tell us more about your requirements..."
                          className={`min-h-[100px] md:min-h-[120px] ${errors.message ? 'border-destructive' : ''}`}
                          required
                        />
                        {errors.message && (
                          <p className="text-destructive text-xs mt-1">{errors.message}</p>
                        )}
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary/90 min-h-[48px] text-base"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* FAQ Section with Accordion */}
            <div>
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <HelpCircle className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                <h3 className="text-xl md:text-2xl font-bold text-foreground">
                  Frequently Asked Questions
                </h3>
              </div>
              <p className="text-muted-foreground mb-4 md:mb-6 text-sm md:text-base">
                Find quick answers to common questions about our platform.
              </p>
              
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`faq-${index}`}
                    className="border rounded-lg px-4 bg-background"
                  >
                    <AccordionTrigger className="text-left py-4 hover:no-underline">
                      <span className="font-semibold text-foreground text-sm md:text-base pr-4">
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4 text-sm md:text-base">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {/* Additional Help Card */}
              <Card className="mt-6 bg-primary/5 border-primary/20">
                <CardContent className="p-4 md:p-6">
                  <h4 className="font-semibold text-foreground mb-2 text-sm md:text-base">
                    Still have questions?
                  </h4>
                  <p className="text-muted-foreground text-sm mb-4">
                    Can't find what you're looking for? Our support team is happy to help.
                  </p>
                  <a href="mailto:support@ats.me">
                    <Button variant="outline" className="w-full sm:w-auto min-h-[44px]">
                      <Headphones className="mr-2 h-4 w-4" />
                      Contact Support
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  );
};

export default ContactPage;
