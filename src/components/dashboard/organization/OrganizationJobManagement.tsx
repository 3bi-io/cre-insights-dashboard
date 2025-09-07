import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  BriefcaseIcon, 
  Users, 
  Eye,
  Edit,
  MoreHorizontal,
  MapPin,
  DollarSign
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export const OrganizationJobManagement = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">Job Management</h3>
      <Button>
        <Plus className="w-4 h-4 mr-2" />
        Create Job
      </Button>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BriefcaseIcon className="w-4 h-4" />
            Active Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">156</div>
          <p className="text-xs text-muted-foreground">+8 this week</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Total Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">2,847</div>
          <p className="text-xs text-muted-foreground">This month</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Average Salary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$67K</div>
          <p className="text-xs text-muted-foreground">Across all positions</p>
        </CardContent>
      </Card>
    </div>
    
    <Card>
      <CardHeader>
        <CardTitle>Recent Job Listings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-medium">Regional Truck Driver</h4>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Salt Lake City, UT
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  $65,000 - $75,000
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  24 applications
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Duplicate Job</DropdownMenuItem>
                  <DropdownMenuItem>Export Applications</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Archive Job</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-medium">OTR Truck Driver</h4>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Multiple Locations
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  $70,000 - $85,000
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  42 applications
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Duplicate Job</DropdownMenuItem>
                  <DropdownMenuItem>Export Applications</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Archive Job</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-medium">Local Delivery Driver</h4>
                <Badge variant="outline">Draft</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Phoenix, AZ
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  $55,000 - $65,000
                </span>
                <span className="text-muted-foreground">Not published</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Publish Job</DropdownMenuItem>
                  <DropdownMenuItem>Duplicate Job</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Delete Draft</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);