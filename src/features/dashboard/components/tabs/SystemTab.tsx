import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, BarChart3, Rss, Users, Image } from 'lucide-react';

export const SystemTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Database Status</CardTitle>
            <CardDescription>Monitor database health and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Connection Status</span>
                <Badge variant="secondary" className="bg-green-500/10 text-green-600">Connected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">RLS Policies</span>
                <Badge variant="secondary" className="bg-green-500/10 text-green-600">Enabled</Badge>
              </div>
              <Button asChild variant="outline" className="w-full mt-4">
                <a 
                  href="https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Open Supabase Dashboard <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edge Functions</CardTitle>
            <CardDescription>Serverless function status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Deployment Status</span>
                <Badge variant="secondary" className="bg-green-500/10 text-green-600">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Functions Count</span>
                <span className="text-sm font-medium">60+</span>
              </div>
              <Button asChild variant="outline" className="w-full mt-4">
                <a 
                  href="https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/functions" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  View Functions <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Access monitoring and management tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/visitor-analytics">
                <BarChart3 className="mr-2 h-4 w-4" /> Analytics
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/super-admin-feeds">
                <Rss className="mr-2 h-4 w-4" /> Feeds
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/user-management">
                <Users className="mr-2 h-4 w-4" /> Users
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/media">
                <Image className="mr-2 h-4 w-4" /> Media
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
