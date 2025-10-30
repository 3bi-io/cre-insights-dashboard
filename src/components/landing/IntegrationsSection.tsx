import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';

const IntegrationsSection = () => {
  const integrationCategories = [
    {
      title: "ATS & HRIS Systems",
      integrations: ["Tenstreet", "Workday", "BambooHR", "ADP", "SAP SuccessFactors"]
    },
    {
      title: "Job Boards & Sourcing",
      integrations: ["Indeed", "Glassdoor", "LinkedIn", "Adzuna", "Talroo", "Google Jobs"]
    },
    {
      title: "Background Checks & Verification",
      integrations: ["Checkr", "Sterling", "HireRight", "GoodHire", "Accurate Background"]
    },
    {
      title: "Calendar & Scheduling",
      integrations: ["Google Calendar", "Outlook", "Calendly", "Microsoft Teams", "Zoom"]
    },
    {
      title: "Communication & Collaboration",
      integrations: ["Slack", "Microsoft Teams", "Gmail", "SendGrid", "Twilio"]
    },
    {
      title: "Analytics & Reporting",
      integrations: ["Google Analytics", "Tableau", "Power BI", "Looker", "Custom API"]
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
            Seamless Integrations with Your Existing Tools
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Connect with 100+ platforms to create a unified recruitment ecosystem. No data silos, no manual exports.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {integrationCategories.map((category, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {category.title}
                </h3>
                <ul className="space-y-2">
                  {category.integrations.map((integration, idx) => (
                    <li key={idx} className="flex items-center text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                      {integration}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Need a custom integration? Our API makes it easy to connect any tool.
          </p>
          <Link to="/features">
            <Button variant="outline" className="group">
              View All Integrations
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
