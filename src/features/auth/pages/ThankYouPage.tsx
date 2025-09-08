import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const ThankYouPage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Thank You!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              Your application has been submitted successfully. We will review your information and get back to you soon.
            </p>
            <Link to="/">
              <Button className="flex items-center gap-2 w-full">
                <Home className="w-4 h-4" />
                Return to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ThankYouPage;