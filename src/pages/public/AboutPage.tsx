/**
 * About Page Component
 * Company information, mission, and team
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Target,
  Heart,
  Users,
  Globe,
  Award,
  TrendingUp,
  Linkedin,
  Twitter,
  Github
} from 'lucide-react';

const AboutPage = () => {
  const stats = [
    { number: "2019", label: "Founded" },
    { number: "10,000+", label: "Companies" },
    { number: "1M+", label: "Candidates Processed" },
    { number: "50+", label: "Countries" }
  ];

  const values = [
    {
      icon: Target,
      title: "Innovation First",
      description: "We're constantly pushing the boundaries of what's possible in recruitment technology, leveraging AI and machine learning to solve real problems."
    },
    {
      icon: Heart,
      title: "People-Centric",
      description: "At our core, we believe hiring is about connecting people. Our technology enhances human decision-making rather than replacing it."
    },
    {
      icon: Users,
      title: "Collaborative Culture",
      description: "We foster an environment where diverse perspectives are valued, and every team member contributes to our collective success."
    },
    {
      icon: Globe,
      title: "Global Impact",
      description: "We're building solutions that work for organizations of all sizes, from local startups to global enterprises, across every industry."
    }
  ];

  const team = [
    {
      name: "Sarah Chen",
      role: "CEO & Founder",
      bio: "Former VP of Engineering at LinkedIn, passionate about transforming how companies find and hire talent.",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b632?w=400&h=400&fit=crop&crop=face",
      social: {
        linkedin: "#",
        twitter: "#"
      }
    },
    {
      name: "Michael Rodriguez",
      role: "CTO",
      bio: "Ex-Google AI researcher with 15+ years experience building scalable machine learning systems.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      social: {
        linkedin: "#",
        github: "#"
      }
    },
    {
      name: "Emily Johnson",
      role: "VP of Product",
      bio: "Product leader with deep HR tech experience, focused on creating intuitive user experiences.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
      social: {
        linkedin: "#",
        twitter: "#"
      }
    },
    {
      name: "David Kim",
      role: "VP of Sales",
      bio: "Sales executive with 20+ years helping companies scale their recruitment operations.",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
      social: {
        linkedin: "#"
      }
    }
  ];

  const milestones = [
    {
      year: "2019",
      title: "Company Founded",
      description: "Started with a mission to make hiring more efficient and fair for everyone."
    },
    {
      year: "2020",
      title: "First AI Features",
      description: "Launched our first AI-powered candidate matching algorithms."
    },
    {
      year: "2021",
      title: "Series A Funding",
      description: "Raised $15M to accelerate product development and team growth."
    },
    {
      year: "2022",
      title: "Global Expansion",
      description: "Expanded to serve customers across 50+ countries worldwide."
    },
    {
      year: "2023",
      title: "10,000 Customers",
      description: "Reached milestone of serving over 10,000 companies globally."
    },
    {
      year: "2024",
      title: "Advanced AI Platform",
      description: "Launched next-generation AI analytics and automation features."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
              🚀 Our Story
            </Badge>
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6">
              Transforming Hiring for
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> the Future</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We're on a mission to make hiring more intelligent, efficient, and fair for organizations 
              and candidates worldwide. Powered by AI, driven by human insight.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2 font-playfair">
                  {stat.number}
                </div>
                <div className="text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                We believe that great hiring starts with great technology. Our mission is to empower 
                organizations to find, evaluate, and hire the best talent while creating a fair and 
                transparent process for all candidates.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                By combining artificial intelligence with human expertise, we're building the future 
                of recruitment - one that's more efficient, more inclusive, and more successful for everyone involved.
              </p>
              <Link to="/contact">
                <Button className="bg-primary hover:bg-primary/90">
                  Join Our Mission
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <Target className="h-24 w-24 text-primary/60 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">Mission-Driven Innovation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
              Our Values
            </h2>
            <p className="text-xl text-muted-foreground">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-muted-foreground">
              The people behind the innovation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {member.name}
                  </h3>
                  <p className="text-primary font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {member.bio}
                  </p>
                  <div className="flex justify-center space-x-2">
                    {member.social.linkedin && (
                      <a href={member.social.linkedin} className="text-muted-foreground hover:text-primary">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {member.social.twitter && (
                      <a href={member.social.twitter} className="text-muted-foreground hover:text-primary">
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                    {member.social.github && (
                      <a href={member.social.github} className="text-muted-foreground hover:text-primary">
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
              Our Journey
            </h2>
            <p className="text-xl text-muted-foreground">
              Key milestones in our company's growth
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-primary/20"></div>
            
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                  <div className={`flex-1 ${index % 2 === 0 ? 'lg:pr-8' : 'lg:pl-8'}`}>
                    <div className={`${index % 2 === 0 ? 'lg:text-right' : 'lg:text-left'} text-center lg:text-left`}>
                      <Badge className="mb-2 bg-primary/10 text-primary border-primary/20">
                        {milestone.year}
                      </Badge>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative z-10 w-4 h-4 bg-primary rounded-full border-4 border-background"></div>
                  
                  <div className="flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-white mb-4">
            Ready to Transform Your Hiring?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of organizations that trust INTEL ATS to power their recruitment success.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="px-8 py-3 text-lg bg-white text-primary hover:bg-white/90">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="px-8 py-3 text-lg border-white text-white hover:bg-white/10">
                Contact Our Team
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;