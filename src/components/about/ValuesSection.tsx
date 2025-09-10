import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Heart, Users, Globe } from 'lucide-react';

const ValuesSection = () => {
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

  return (
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
  );
};

export default ValuesSection;