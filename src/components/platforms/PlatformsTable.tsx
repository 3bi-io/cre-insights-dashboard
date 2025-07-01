
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MoreHorizontal, Globe, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Platform {
  id: string;
  name: string;
  logo_url: string | null;
  api_endpoint: string | null;
  created_at: string;
}

interface PlatformsTableProps {
  platforms: Platform[] | undefined;
  onRefresh: () => void;
}

const PlatformsTable: React.FC<PlatformsTableProps> = ({ platforms, onRefresh }) => {
  if (!platforms || platforms.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12 px-4">
          <div className="text-gray-500 mb-4">
            <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No platforms found</h3>
            <p className="text-sm sm:text-base">Get started by adding your first advertising platform.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Platform</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">API Endpoint</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {platforms.map((platform) => (
              <tr key={platform.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    {platform.logo_url ? (
                      <img 
                        src={platform.logo_url} 
                        alt={platform.name}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Globe className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <span className="font-medium text-foreground">{platform.name}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-muted-foreground font-mono text-sm">
                    {platform.api_endpoint || 'Not configured'}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <Badge variant={platform.api_endpoint ? 'default' : 'secondary'}>
                    {platform.api_endpoint ? 'Configured' : 'Setup Required'}
                  </Badge>
                </td>
                <td className="py-4 px-4">
                  <span className="text-muted-foreground text-sm">
                    {new Date(platform.created_at).toLocaleDateString()}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Platform
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Platform
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlatformsTable;
