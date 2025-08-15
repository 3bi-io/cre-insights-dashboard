import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, MapPin, Users, Award, ArrowRight, Phone, Mail } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';

const Home = () => {
  const benefits = [
    {
      icon: Truck,
      title: 'Modern Fleet',
      description: 'Drive the latest trucks with advanced safety features and comfort technology'
    },
    {
      icon: MapPin,
      title: 'Nationwide Routes',
      description: 'Flexible routing options from coast to coast with competitive mileage pay'
    },
    {
      icon: Users,
      title: 'Family Culture',
      description: 'Join a team that values work-life balance and supports your success'
    },
    {
      icon: Award,
      title: 'Industry Leader',
      description: 'Over 90 years of excellence in transportation and logistics'
    }
  ];

  const stats = [
    { number: '90+', label: 'Years in Business' },
    { number: '4,000+', label: 'Professional Drivers' },
    { number: '1,000+', label: 'Support Staff' },
    { number: '48', label: 'States Served' }
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              Now Hiring - Competitive Pay & Benefits
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Drive Your Career Forward with <span className="text-secondary">C.R. England</span>
            </h1>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join America's premier transportation company and experience the difference of driving for a family-owned business that puts drivers first.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary">
                <Link to="/jobs">
                  View Open Positions
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <Link to="/contact">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose C.R. England?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We offer more than just a job – we provide a career path with industry-leading benefits and support.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Take the first step towards a rewarding career in transportation. Browse our current openings and apply today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link to="/jobs">Browse Jobs</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <a href="tel:1-800-274-3647">
                <Phone className="w-5 h-5 mr-2" />
                Call: 1-800-CR-ENGLAND
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Questions? We're Here to Help</h2>
            <p className="text-muted-foreground mb-8">
              Our recruitment team is standing by to answer your questions and help you take the next step.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                <span>1-800-CR-ENGLAND</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                <span>careers@crengland.com</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Home;