import React from 'react';
import { Badge } from '@/components/ui/badge';

const TimelineSection = () => {
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
  );
};

export default TimelineSection;