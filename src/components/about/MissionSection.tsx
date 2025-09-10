import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const MissionSection = () => {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
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
      </div>
    </section>
  );
};

export default MissionSection;