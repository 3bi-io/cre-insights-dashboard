import { Link } from "react-router-dom";
import { ShieldX, Home, Mail, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/common";
import { SEO } from '@/components/SEO';

const AccessDenied = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <SEO
        title="Access Denied"
        description="You don't have permission to access this page. Please contact support if you believe this is an error."
        noindex={true}
      />
      <Card className="w-full max-w-md text-center animate-fade-in">
        <CardHeader className="pb-2">
          <div className="mx-auto mb-4">
            <Brand variant="horizontal" size="md" showAsLink={false} />
          </div>
          <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <ShieldX className="w-10 h-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription className="text-base">
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-sm">
            This could be because your account doesn't have the required permissions,
            or access to this content is restricted in your region.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="default">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/contact">
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Go back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessDenied;
