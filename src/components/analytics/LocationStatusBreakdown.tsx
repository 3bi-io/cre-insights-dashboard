
import React from 'react';
import { MapPin, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LocationData {
  location: string;
  conversionRate: number;
  totalApplications: number;
}

interface StatusData {
  status: string;
  percentage: number;
  count: number;
}

interface LocationStatusBreakdownProps {
  locationConversion: LocationData[];
  statusBreakdown: StatusData[];
}

const LocationStatusBreakdown: React.FC<LocationStatusBreakdownProps> = ({ 
  locationConversion, 
  statusBreakdown 
}) => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Location Conversion Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Top Locations
          </CardTitle>
          <CardDescription>
            Applications by geographic location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {locationConversion.map((location, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{location.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Applications</p>
                  <p className="font-bold">{location.totalApplications}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Application Status
          </CardTitle>
          <CardDescription>
            Current status distribution of applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statusBreakdown.map((status, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium capitalize">{status.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{status.percentage.toFixed(1)}%</p>
                  <p className="font-bold">{status.count}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationStatusBreakdown;
