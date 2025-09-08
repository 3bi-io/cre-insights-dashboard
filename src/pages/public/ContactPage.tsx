/**
 * Contact Page Component
 * Contact form and company information
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mail, 
  Phone, 
  MapPin,
  Clock,
  MessageSquare,
  Users,
  Headphones,
  Send
} from 'lucide-react';

const ContactPage = () => {
  const [formData, setFormData] = React.useState({
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  const contactMethods = [
    {
      icon: MessageSquare,
      title: "Sales Inquiries",
      description: "Questions about pricing, features, or demos",
      contact: "sales@ats.io",
      action: "Contact Sales"
    },
    {
      icon: Headphones,
      title: "Customer Support",
      description: "Technical support for existing customers",
      contact: "support@ats.io",
      action: "Get Support"
    },
    {
      icon: Users,
      title: "Partnerships",
      description: "Integration partnerships and collaborations",
      contact: "partners@ats.io",
      action: "Partner With Us"
    }
  ];

  const officeLocations = [
    {
      city: "San Francisco",
      address: "123 Market Street, Suite 400\nSan Francisco, CA 94105",
      phone: "+1 (555) 123-4567",
      timezone: "PST (UTC-8)"
    },
    {
      city: "New York",
      address: "456 Broadway, Floor 12\nNew York, NY 10013",
      phone: "+1 (555) 234-5678",
      timezone: "EST (UTC-5)"
    },
    {
      city: "London",
      address: "789 Shoreditch High Street\nLondon E1 6AN, UK",
      phone: "+44 20 7123 4567",
      timezone: "GMT (UTC+0)"
    }
  ];

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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6">
            Get in
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Touch</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Ready to transform your hiring process? We're here to help you get started 
            and answer any questions you might have.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {contactMethods.map((method, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow text-center">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <method.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {method.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {method.description}
                  </p>
                  <p className="text-primary font-medium mb-4">
                    {method.contact}
                  </p>
                  <Button className="bg-primary hover:bg-primary/90">
                    {method.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Send us a message</CardTitle>
                  <p className="text-muted-foreground">
                    Fill out the form below and we'll get back to you within 24 hours.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          First Name *
                        </label>
                        <Input
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Last Name *
                        </label>
                        <Input
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Email Address *
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Company *
                        </label>
                        <Input
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Job Title
                        </label>
                        <Input
                          value={formData.jobTitle}
                          onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Company Size
                      </label>
                      <Select onValueChange={(value) => handleInputChange('companySize', value)}>
                        <SelectTrigger>
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
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Subject *
                      </label>
                      <Select onValueChange={(value) => handleInputChange('subject', value)} >
                        <SelectTrigger>
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
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Message *
                      </label>
                      <Textarea
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        placeholder="Tell us more about your requirements..."
                        className="min-h-[120px]"
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-6">
                  Our Offices
                </h3>
                <div className="space-y-6">
                  {officeLocations.map((office, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <h4 className="text-lg font-semibold text-foreground mb-3">
                          {office.city}
                        </h4>
                        <div className="space-y-2 text-muted-foreground">
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                            <span className="whitespace-pre-line">{office.address}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            <span>{office.phone}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span>{office.timezone}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-foreground mb-6">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <h4 className="font-semibold text-foreground mb-2">
                          {faq.question}
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {faq.answer}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Hours */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <Clock className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
              We're Here When You Need Us
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Our team is available during business hours in all major time zones. 
              Enterprise customers get 24/7 priority support.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="text-center">
                <h3 className="font-semibold text-foreground mb-2">Americas</h3>
                <p className="text-muted-foreground">Monday - Friday</p>
                <p className="text-muted-foreground">6 AM - 6 PM PST</p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-foreground mb-2">Europe</h3>
                <p className="text-muted-foreground">Monday - Friday</p>
                <p className="text-muted-foreground">9 AM - 6 PM GMT</p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-foreground mb-2">Asia Pacific</h3>
                <p className="text-muted-foreground">Monday - Friday</p>
                <p className="text-muted-foreground">9 AM - 6 PM JST</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;